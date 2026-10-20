import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
test('QC claims, scoped feedback, resubmission, approval and reviewer revocation',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table profiles(id uuid primary key,full_name text,role text,is_active boolean,team_id uuid);
 create table clients(id uuid primary key,name text);
 create table projects(id uuid primary key,name text,project_code text,client_id uuid,team_id uuid,production_team_ids uuid[],status text,is_active boolean);
 create table tasks(id uuid primary key,project_id uuid references projects,title text,status text,footage_link text,archived_at timestamptz);
 create table employees(id uuid primary key,profile_id uuid,is_active boolean);
 create table task_assignments(task_id uuid,employee_id uuid,status text);
 create table project_members(project_id uuid,profile_id uuid);
 create table member_page_access(profile_id uuid,page text constraint member_page_access_page_check check(page in ('dashboard')),allowed boolean,updated_by uuid,updated_at timestamptz,primary key(profile_id,page));
 create function private.manages_page_access() returns boolean language sql as $$select true$$;
 create function private.role_of(u uuid) returns text language sql as $$select role from public.profiles where id=u and is_active$$;
 insert into profiles values('${id(1)}','Admin','admin',true,null),('${id(2)}','Reviewer','employee',true,null),('${id(3)}','Artist','employee',true,'${id(20)}'),('${id(4)}','Other','employee',true,'${id(21)}'),('${id(5)}','Lead','associate_lead',true,'${id(20)}');
 insert into projects values('${id(10)}','Project','P1',null,null,array['${id(20)}'::uuid],'in_progress',true);
 insert into tasks values('${id(11)}','${id(10)}','Design','internal_review',null,null);
 insert into employees values('${id(30)}','${id(3)}',true);
 insert into task_assignments values('${id(11)}','${id(30)}','completed');`);
 await db.exec(await readFile('supabase/migrations/202610150002_qc_workspace.sql','utf8'));
 await db.exec(await readFile('supabase/migrations/202610150003_qc_activity.sql','utf8'));
 await db.exec(`insert into profiles values('${id(6)}','PC','project_coordinator',true,null),('${id(7)}','Manager','manager',true,null),('${id(8)}','Director','director',true,null);insert into project_members values('${id(10)}','${id(6)}');`);
 await db.exec('grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;set role authenticated');
 const as=async n=>db.exec(`select set_config('request.jwt.claim.sub','${id(n)}',false)`);
 const workspace=async()=> (await db.query('select qc_workspace() d')).rows[0].d;
 for(const n of [1,7,8]){await as(n);assert.equal((await workspace()).operator,true);assert.ok((await db.query(`select qc_activity_data(current_date-1,current_date+1) d`)).rows[0].d.length>0);}
 for(const n of [3,5,6]){await as(n);assert.equal((await workspace()).items.length,1);assert.equal((await workspace()).operator,false);await assert.rejects(db.query(`select qc_activity_data(current_date-1,current_date+1)`),/Leadership/);}
 await as(1);await db.query(`select qc_set_reviewer('${id(2)}',true)`);
 await as(2);let data=await workspace();assert.equal(data.operator,true);const review=data.items[0].id;
 await db.query(`select qc_update('${review}','claim')`);
 await as(1);await assert.rejects(db.query(`select qc_update('${review}','claim')`),/already claimed/);
 await as(2);await assert.rejects(db.query(`select qc_update('${review}','corrections','Fix it','${id(4)}')`),/assigned employee/);
 await db.query(`select qc_update('${review}','corrections','Fix typography','${id(3)}')`);
 await as(4);assert.equal((await workspace()).items.length,0);await assert.rejects(db.query(`select qc_update('${review}','resubmit','Done')`),/unavailable/);
 await as(3);assert.equal((await workspace()).operator,false);assert.equal((await workspace()).items[0].notes[0].body,'Fix typography');await assert.rejects(db.query(`select qc_update('${review}','approve','Approved')`),/reviewer access/);await db.query(`select qc_update('${review}','resubmit','Typography fixed')`);
 await as(5);assert.equal((await workspace()).items.length,1);assert.ok((await db.query('select qc_notification_data() d')).rows[0].d.length>0);
 await as(2);await db.query(`select qc_update('${review}','approve','Looks good')`);assert.equal((await workspace()).items[0].state,'approved');
 await as(1);await db.query(`select qc_set_reviewer('${id(2)}',false)`);await as(2);assert.equal((await workspace()).items.length,0);
 await db.exec(`reset role;update tasks set status='editing_in_progress';update tasks set status='internal_review';set role authenticated`);await as(1);assert.equal((await workspace()).items[0].state,'waiting');
 }finally{await db.close();}
});
