import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
const source=await readFile(new URL('../src/lib/projectFinanceMetrics.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {financeSummary,financeMonth,trailingFinanceMonths,financeClients}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

test('project sales count each rate once, monthly charges recur, and expenses reduce net',()=>{
 const data={projects:[{id:'p',client_id:'c',rate:5000,status:'completed',sales_completed_at:'2026-09-30T20:00:00Z',created_at:'2026-09-30T20:00:00Z'},{id:'q',client_id:'other',rate:null,status:'completed',sales_completed_at:'2026-10-02T00:00:00Z',created_at:'2026-10-02T00:00:00Z'}],items:[
  {project_id:'p',kind:'charge',amount:10000,frequency:'monthly',start_month:'2026-10-01',end_month:'2026-11-01'},
  {project_id:'p',kind:'expense',amount:7000,frequency:'once',start_month:'2026-10-01',end_month:null},
 ]};
 assert.equal(financeMonth(data.projects[0].created_at),'2026-10');
 assert.deepEqual(trailingFinanceMonths('2026-02'),['2025-09','2025-10','2025-11','2025-12','2026-01','2026-02']);
 const october=financeSummary(data,'2026-10','c');
 assert.equal(october.projectRevenue,5000);assert.equal(october.revenue,15000);assert.equal(october.expenses,7000);assert.equal(october.net,8000);
 assert.equal(financeSummary(data,'2026-11','c').revenue,10000);
 assert.equal(financeSummary(data,'2026-12','c').revenue,0);
 assert.equal(financeSummary(data,'2026-10','other').unpriced,1);
 assert.equal(financeSummary(data,'2026-10','other','p').revenue,0);
 assert.equal(financeSummary({...data,projects:[]},'2026-10').revenue,0);
});

test('finance RPC protects coordinator scope, sales read-only access, provenance and stale edits',async()=>{
 const db=new PGlite();const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
 async function as(n,sql,args=[]){await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(n)}',false)`);return db.query(sql,args);}
 try {
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table profiles(id uuid primary key,full_name text,role text,is_active boolean default true);
   create table clients(id uuid primary key,name text);
   create table projects(id uuid primary key,project_code text,name text,client_id uuid references clients(id),status text,rate numeric,created_at timestamptz default now(),is_active boolean default true,created_by uuid);
   create table sales_permissions(profile_id uuid,access_level text);
   create function private.sales_level() returns text language sql stable security definer as $$select access_level from public.sales_permissions where profile_id=auth.uid()$$;
   create function private.can_view_project(pid uuid) returns boolean language sql stable security definer as $$select exists(select 1 from public.projects where id=pid and (created_by=auth.uid() or exists(select 1 from public.profiles where id=auth.uid() and role='admin')))$$;
   create function private.can_edit_project(pid uuid) returns boolean language sql stable security definer as $$select private.can_view_project(pid) and exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','project_coordinator'))$$;
   grant usage on schema auth,public to authenticated;`);
  await db.exec(await readFile(new URL('../supabase/migrations/202610100022_project_finance.sql',import.meta.url),'utf8'));
  await db.exec(`insert into profiles(id,full_name,role) values('${id(1)}','PC1','project_coordinator'),('${id(2)}','PC2','project_coordinator'),('${id(3)}','Sales','employee'),('${id(4)}','Artist','employee');
   insert into clients values('${id(10)}','Client');
   insert into projects(id,project_code,name,client_id,status,rate,created_by) values('${id(20)}','HMOCT0001','First','${id(10)}','ongoing',5000,'${id(1)}'),('${id(21)}','HMOCT0002','Second','${id(10)}','ongoing',1000,'${id(2)}');
   insert into sales_permissions values('${id(3)}','member');`);
  const own=(await as(1,'select project_finance_data() as data')).rows[0].data;
  assert.equal(own.projects.length,1);assert.equal(own.projects[0].can_edit,true);
  const sales=(await as(3,'select project_finance_data() as data')).rows[0].data;
  assert.equal(sales.projects.length,2);assert.ok(sales.projects.every(p=>!p.can_edit));
  await assert.rejects(as(4,'select project_finance_data()'),/unavailable/);
  const call="select save_project_finance_item($1,'Shoot Actuals','expense',$2,'once','2026-10-01') as id";
  await assert.rejects(as(1,call,[id(21),7000]),/cannot change/);
  await assert.rejects(as(3,call,[id(20),7000]),/cannot change/);
  await assert.rejects(as(1,call,[id(20),-1]),/check constraint/);
  const saved=(await as(1,call,[id(20),7000])).rows[0].id;
  await assert.rejects(as(1,'select * from project_finance_items'),/permission denied/);
  let item=(await as(1,'select project_finance_data() as data')).rows[0].data.items[0];
  assert.equal(item.created_by,id(1));assert.equal(item.amount,7000);
  const update="select save_project_finance_item($1,'Shoot Actuals','expense',8000,'once','2026-10-01',null,'',$2,$3)";
  await as(1,update,[id(20),saved,item.updated_at]);
  await assert.rejects(as(1,update,[id(20),saved,item.updated_at]),/changed/);
  await db.exec(`reset role;update profiles set is_active=false where id='${id(3)}'`);
  await assert.rejects(as(3,'select project_finance_data()'),/unavailable/);
  await db.exec('reset role;set role anon');await assert.rejects(db.query('select project_finance_data()'),/permission denied/);
 } finally {await db.close();}
});

test('sales client catalog includes clients without work and prefers current directory names',()=>{
 const data={projects:[{client_id:'a',client_name:'Old name'},{client_id:'b',client_name:'Finance-only client'}],items:[],clients:[{id:'a',name:'Actual name'},{id:'c',name:'No project client'},{id:'d',name:'Actual name'}]};
 assert.deepEqual(financeClients(data),[['a','Actual name'],['d','Actual name'],['b','Finance-only client'],['c','No project client']]);
 assert.deepEqual(financeClients({...data,projects:[]}),[['a','Actual name'],['d','Actual name'],['c','No project client']]);
 assert.equal(financeSummary(data,'2026-10','c').revenue,0);
});
test('sales count completion month, not creation or task dates; unfinished charges wait',()=>{
 const d={projects:[{id:'p',client_id:'c',rate:7000,status:'in_progress',created_at:'2026-10-01T00:00:00Z',sales_completed_at:null}],items:[{project_id:'p',kind:'charge',amount:1000,frequency:'once',start_month:'2026-10-01'}]};
 assert.equal(financeSummary(d,'2026-10').revenue,0);
 d.projects[0].status='completed';d.projects[0].sales_completed_at='2026-10-31T20:00:00Z';
 assert.equal(financeSummary(d,'2026-10').revenue,0);assert.equal(financeSummary(d,'2026-11').revenue,8000);assert.equal(financeSummary(d,'2026-12').revenue,0);
});
