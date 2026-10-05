import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('client provenance and assignment timing are enforced by database',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create schema private;create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table profiles(id uuid primary key,role text,is_active bool);
 create table teams(id uuid primary key,team_type text);
 create table employees(id uuid primary key,team_id uuid references teams);
 create table clients(id uuid primary key,name text,created_at timestamptz default now());
 create table tasks(id uuid primary key,due_date timestamptz);
 create table task_assignments(id uuid primary key,task_id uuid,employee_id uuid,assigned_by uuid,assigned_at timestamptz,status text,completed_at timestamptz);
 insert into profiles values('00000000-0000-0000-0000-000000000001','project_coordinator',true);
 insert into teams values('00000000-0000-0000-0000-000000000002','cut_masters');
 insert into employees values('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002');
 insert into tasks values('00000000-0000-0000-0000-000000000004','2026-10-05T11:30:00Z');`);
 await db.exec(await readFile(new URL('../supabase/migrations/202610050019_client_provenance_and_delivery_timing.sql',import.meta.url),'utf8'));
 await db.exec(`select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
 insert into clients(id,name,created_at) values('00000000-0000-0000-0000-000000000005','Manual','2020-01-01');
 insert into task_assignments(id,task_id,employee_id,status) values('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000003','assigned');`);
 assert.equal((await db.query('select created_by::text from clients')).rows[0].created_by,'00000000-0000-0000-0000-000000000001');
 await assert.rejects(db.exec("update clients set created_at='2020-01-01'"),/cannot be changed/);
 const due=(await db.query('select deadline_at from task_assignments')).rows[0].deadline_at;
 await db.exec("update tasks set due_date='2026-10-06';update task_assignments set status='completed',completed_at='2000-01-01'");
 const completion=(await db.query('select completed_at from task_assignments')).rows[0].completed_at;
 assert.equal((await db.query('select deadline_at from task_assignments')).rows[0].deadline_at.getTime(),due.getTime());
 assert.ok(completion.getTime()>Date.parse('2026-01-01'));
 await db.exec("update task_assignments set status='in_progress';update task_assignments set status='completed',completed_at='2000-01-01'");
 assert.equal((await db.query('select completed_at from task_assignments')).rows[0].completed_at.getTime(),completion.getTime());
 await assert.rejects(db.exec("update task_assignments set deadline_at='2026-10-07'"),/cannot be changed/);
 await db.exec('update tasks set due_date=null');
 await assert.rejects(db.exec("insert into task_assignments(id,task_id,employee_id,status) values('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000003','assigned')"),/exact task deadline/);
 }finally{await db.close()}
});
