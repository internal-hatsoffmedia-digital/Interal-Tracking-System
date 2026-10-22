import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
test('categories save and coordinator activity survives archive, restore and deletion within supervisor scope',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create type task_category as enum('shorts_reels');
 create table profiles(id uuid primary key,role text,is_active boolean,team_id uuid);
 create table projects(id uuid primary key,name text,is_active boolean,updated_at timestamptz,rate numeric);
 create table tasks(id uuid primary key,project_id uuid,title text,category task_category,archived_at timestamptz,status text,updated_at timestamptz,due_date timestamptz);
 create table task_assignments(id uuid primary key,task_id uuid,employee_id uuid,status text);
 create table clients(id uuid primary key,name text);
 create function private.full_project_access(pid uuid) returns boolean language sql stable as $$select pid='${id(20)}'::uuid$$;
 insert into profiles values('${id(1)}','admin',true,null),('${id(2)}','project_coordinator',true,'${id(10)}'),('${id(3)}','associate_lead',true,'${id(10)}'),('${id(4)}','employee',true,'${id(10)}');`);
 await db.exec(await readFile('supabase/migrations/202610200001_audit_task_categories.sql','utf8'));
 await db.exec(await readFile('supabase/migrations/202610200002_coordinator_work_activity.sql','utf8'));
 await db.exec(`select set_config('request.jwt.claim.sub','${id(2)}',false);
 insert into projects values('${id(20)}','Website',true,now(),2000),('${id(21)}','Other',true,now(),3000);
 insert into tasks values('${id(30)}','${id(20)}','Audit','gmb_audit',null,'new',now(),null);
 update tasks set category='seo_audit' where id='${id(30)}';update tasks set category='website_audit' where id='${id(30)}';update tasks set category='whisk' where id='${id(30)}';
 update tasks set archived_at=now();update tasks set archived_at=null;
 update projects set is_active=false where id='${id(20)}';update projects set is_active=true where id='${id(20)}';
 insert into task_assignments values('${id(40)}','${id(30)}','${id(50)}','assigned');update task_assignments set status='accepted';
 delete from task_assignments;insert into clients values('${id(60)}','Client');update clients set name='New client';
 update projects set updated_at=now();set role authenticated;select set_config('request.jwt.claim.sub','${id(1)}',false);`);
 await db.exec(`reset role;select set_config('request.jwt.claim.sub','${id(2)}',false);update tasks set due_date=now()+interval '2 hours' where id='${id(30)}';set role authenticated;select set_config('request.jwt.claim.sub','${id(1)}',false);`);
 const rows=async()=>(await db.query('select team_pc_work_activity() d')).rows[0].d;
 let activity=await rows();assert.equal(activity.length,16);assert.ok(activity.some(a=>a.actor_id===id(2)&&a.changed_fields.includes('due_date')));assert.ok(activity.some(a=>a.action==='deleted'&&a.entity_type==='tasks'));assert.ok(activity.some(a=>a.action==='restored'&&a.entity_type==='projects'));
 assert.ok(!JSON.stringify(activity).includes('2000'));assert.ok(!JSON.stringify(activity).includes('3000'));
 await db.exec(`select set_config('request.jwt.claim.sub','${id(3)}',false)`);activity=await rows();assert.ok(!activity.some(a=>a.project_id===id(21)));assert.ok(activity.some(a=>a.entity_type==='clients'));
 await assert.rejects(db.query('select * from coordinator_work_activity'),/permission denied/);
 await db.exec(`select set_config('request.jwt.claim.sub','${id(4)}',false)`);await assert.rejects(rows(),/Supervisor access/);
 await db.exec(`reset role;update profiles set is_active=false where id='${id(3)}';set role authenticated;select set_config('request.jwt.claim.sub','${id(3)}',false)`);await assert.rejects(rows(),/Supervisor access/);
 await db.exec('reset role;set role anon');await assert.rejects(rows(),/permission denied/);
 }finally{await db.close();}
});
