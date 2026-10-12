import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import ts from 'typescript';
const src=await readFile('src/lib/projectFinanceMetrics.ts','utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {financeSummary,financeForTeam}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('opening totals count once and never leak into client/project or other months',()=>{
 const d={projects:[],items:[],opening_sales:[56800,10000,2000,135000,158500].map(amount=>({month:'2026-10-01',amount}))};
 assert.equal(financeSummary(d,'2026-10').revenue,362300);
 assert.equal(financeSummary(d,'2026-11').revenue,0);
 assert.equal(financeSummary(d,'2026-10','client').revenue,0);
 assert.equal(financeSummary(d,'2026-10','','project').revenue,0);
 assert.equal(1000000-financeSummary(d,'2026-10').revenue,637700);
});
test('opening import is idempotent, team scoped, and denies direct/unauthorized access',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table teams(id uuid primary key default gen_random_uuid(),name text,team_type text,is_active boolean default true);
 create table profiles(id uuid primary key,team_id uuid,role text,is_active boolean default true);
 create function team_sales_access() returns boolean language sql stable security definer as $$select exists(select 1 from public.profiles where id=auth.uid() and is_active and role in ('admin','associate_lead'))$$;
 create function private.finance_all_projects() returns boolean language sql stable security definer as $$select exists(select 1 from public.profiles where id=auth.uid() and role='admin')$$;
 grant usage on schema auth,public to authenticated;
 insert into teams(name,team_type) values('Cut Masters','cut_masters'),('Creative Clan','graphic_design'),('Web Crafters','web_development'),('Digital Ninjas','digital_marketing');
 insert into profiles select '00000000-0000-0000-0000-000000000001',id,'admin',true from teams limit 1;
 insert into profiles select '00000000-0000-0000-0000-000000000002',id,'associate_lead',true from teams where name='Cut Masters';
 insert into profiles values('00000000-0000-0000-0000-000000000003',null,'employee',true);`);
 await db.exec(await readFile('supabase/migrations/202610120003_opening_sales.sql','utf8'));
 const seed=await readFile('scripts/import-october-opening-sales.sql','utf8');await db.exec(seed);await db.exec(seed);
 const total=(await db.query('select sum(amount) as total,count(*) as count from sales_opening_entries')).rows[0];assert.equal(Number(total.total),362300);assert.equal(total.count,5);
 async function as(n){await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-${String(n).padStart(12,'0')}',false)`);return (await db.query('select opening_sales_data() as data')).rows[0].data;}
 assert.equal((await as(1)).opening_periods.length,1);
 const own=await as(2);assert.equal(own.opening_sales.length,1);assert.equal(own.opening_sales[0].amount,56800);assert.equal(own.opening_periods.length,0);
 await assert.rejects(db.query('select * from sales_opening_entries'),/permission denied/);
 await assert.rejects(as(3),/unavailable/);
 await db.exec('reset role;set role anon');await assert.rejects(db.query('select opening_sales_data()'),/permission denied/);
 }finally{await db.close();}
});

test('team finance filter scopes projects, costs and opening sales without a company target',()=>{
 const data={teams:[{id:'v',name:'Cut Masters'}],projects:[{id:'p',team_id:'v'},{id:'q',production_team_ids:['v']},{id:'r',team_id:'other'}],items:[{project_id:'p'},{project_id:'r'}],opening_sales:[{team_name:'Cut Masters',amount:56800},{team_name:'Creative Clan',amount:12000}],opening_periods:[{target:1000000}]};
 const own=financeForTeam(data,'v');assert.equal(own.projects.length,2);assert.equal(own.items.length,1);assert.equal(own.opening_sales.length,1);assert.equal(own.opening_periods.length,0);assert.equal(financeForTeam(data,''),data);
});
