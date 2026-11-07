import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
test('authorized sales leaders can reassign existing credit atomically without adding revenue',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role authenticated;create role anon;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table teams(id uuid primary key,name text,team_type text,is_active boolean);
 create table profiles(id uuid primary key,role text,is_active boolean,team_id uuid);
 create table auth.users(id uuid primary key);
 create table employees(profile_id uuid,is_active boolean);
 create table projects(id uuid primary key,is_active boolean,status text,sales_completed_at timestamptz,rate numeric,monthly_team_project boolean default false,sales_credit_team_id uuid,production_team_ids uuid[] default '{}');
 create table project_sales_credits(project_id uuid,profile_id uuid,amount numeric,credited_by uuid,team_id uuid,source text,updated_at timestamptz default now(),primary key(project_id,profile_id));
 create table credit_audit(project_id uuid,action text,details jsonb);
 create function private.record_event(pid uuid,action text,details jsonb) returns void language sql as $$insert into public.credit_audit values(pid,action,details)$$;
 create function private.team_credit_project(uuid[]) returns boolean language sql as $$select false$$;
 grant usage on schema auth,public,private to authenticated,anon;
 grant select on projects,project_sales_credits,credit_audit to authenticated;
 insert into teams values('00000000-0000-0000-0000-000000000100','Project Coordinators','project_coordination',true),('00000000-0000-0000-0000-000000000101','Cut Masters','cut_masters',true);
 insert into profiles values
 ('00000000-0000-0000-0000-000000000001','admin',true,'00000000-0000-0000-0000-000000000100'),('00000000-0000-0000-0000-000000000002','manager',true,'00000000-0000-0000-0000-000000000100'),('00000000-0000-0000-0000-000000000003','director',true,'00000000-0000-0000-0000-000000000100'),
 ('00000000-0000-0000-0000-000000000004','associate_lead',true,'00000000-0000-0000-0000-000000000100'),('00000000-0000-0000-0000-000000000005','associate_lead',true,'00000000-0000-0000-0000-000000000101'),
 ('00000000-0000-0000-0000-000000000006','employee',true,'00000000-0000-0000-0000-000000000101'),('00000000-0000-0000-0000-000000000007','project_coordinator',true,'00000000-0000-0000-0000-000000000100'),
 ('00000000-0000-0000-0000-000000000008','manager',false,'00000000-0000-0000-0000-000000000100'),('00000000-0000-0000-0000-000000000009','employee',true,'00000000-0000-0000-0000-000000000101');
 insert into auth.users select id from profiles;
 insert into employees select id,true from profiles;
 insert into projects(id,is_active,status,sales_completed_at,rate) values('00000000-0000-0000-0000-000000000200',true,'completed',now(),1500);
 insert into project_sales_credits(project_id,profile_id,amount) values('00000000-0000-0000-0000-000000000200','00000000-0000-0000-0000-000000000006',1500);`);
 const access=(await readFile('supabase/migrations/202610120004_sales_leadership_only.sql','utf8')).match(/create or replace function public\.team_sales_access\(\)[\s\S]*?\$\$;/)[0];
 await db.exec(access);
 await db.exec(await readFile('supabase/migrations/202611070003_sales_credit_reassignment.sql','utf8'));
 const snapshot=async()=>{await db.exec('reset role');return (await db.query('select profile_id,amount from project_sales_credits where project_id=$1 and amount>0 order by profile_id',[id(200)])).rows;};
 async function as(n,sql,args=[]){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id(n)]);await db.exec('set role authenticated');return db.query(sql,args);}
 const initial=await snapshot();
 await as(4,'select reassign_project_sales_credit($1,$2,$3)',[id(200),id(9),initial]);
 assert.equal(Number((await as(4,'select amount from project_sales_credits where profile_id=$1',[id(6)])).rows[0].amount),0);
 assert.equal(Number((await as(4,'select sum(amount) amount from project_sales_credits')).rows[0].amount),1500);
 await assert.rejects(()=>as(2,'select reassign_project_sales_credit($1,$2,$3)',[id(200),id(6),initial]),/Allocations changed/);
 for(const n of [1,2,3,4]){
  const expected=await snapshot();await as(n,'select reassign_project_sales_credit($1,$2,$3)',[id(200),id(6),expected]);
  assert.equal(Number((await as(n,'select sum(amount) amount from project_sales_credits')).rows[0].amount),1500);
 }
 for(const n of [5,6,7,8]){
  const expected=await snapshot();await assert.rejects(()=>as(n,'select reassign_project_sales_credit($1,$2,$3)',[id(200),id(9),expected]),/Sales leadership access/);
 }
 assert.equal(Number((await as(4,'select rate from projects')).rows[0].rate),1500);
 assert.equal((await as(4,'select * from credit_audit')).rows.length,5);
 const expected=await snapshot();await db.exec('reset role;set role anon');
 await assert.rejects(()=>db.query('select reassign_project_sales_credit($1,$2,$3)',[id(200),id(9),expected]),/permission denied/);
 }finally{await db.close();}
});
