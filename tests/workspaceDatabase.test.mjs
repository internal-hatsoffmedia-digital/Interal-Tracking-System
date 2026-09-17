import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {suppliedSchema} from './supplied-schema-fixture.mjs';
const db=new PGlite();const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
async function as(n,sql,params=[]){await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(n)}',false)`);return db.query(sql,params);}
before(async()=>{
 await suppliedSchema(db);
 await db.exec(`create policy fixture_tasks_write on tasks for all to authenticated using(true) with check(true);
 insert into auth.users values('${id(1)}'),('${id(2)}'),('${id(3)}');
 insert into profiles(id,full_name,role) values('${id(1)}','Admin','admin'),('${id(2)}','Worker','employee'),('${id(3)}','Other','employee');
 insert into employees(id,profile_id,employee_code,full_name) values('${id(12)}','${id(2)}','E2','Worker'),('${id(13)}','${id(3)}','E3','Other');
 insert into clients(id,name) values('${id(20)}','Client');
 insert into projects(id,client_id,name) values('${id(30)}','${id(20)}','Project');
 insert into tasks(id,project_id,title) values('${id(40)}','${id(30)}','Task');`);
 await db.exec(await readFile(new URL('../supabase/migrations/202609050004_workspace_updates.sql',import.meta.url),'utf8'));
});
after(()=>db.close());
test('only admin publishes valid image announcements',async()=>{
 await as(1,"insert into workspace_announcements(title,image_data) values('Hello','data:image/webp;base64,AAAA')");
 assert.equal((await as(2,'select * from workspace_announcements')).rows.length,1);
 await assert.rejects(as(2,"insert into workspace_announcements(title,image_data) values('Bad','data:image/webp;base64,AAAA')"),/row-level security/);
 await assert.rejects(as(1,"insert into workspace_announcements(title,image_data) values('Bad','javascript:bad')"),/check constraint/);
 await as(2,'delete from workspace_announcements');
 assert.equal((await as(1,'select * from workspace_announcements')).rows.length,1);
});
test('archiving preserves task and denies employees including direct writes',async()=>{
 await as(1,'select workspace_archive_task($1,true)',[id(40)]);
 assert.ok((await as(1,'select archived_at from tasks where id=$1',[id(40)])).rows[0].archived_at);
 await assert.rejects(as(2,'select workspace_archive_task($1,false)',[id(40)]),/Only task managers/);
 await assert.rejects(as(2,'update tasks set archived_at=null where id=$1',[id(40)]),/Only task managers/);
 await as(1,'select workspace_archive_task($1,false)',[id(40)]);
 assert.equal((await as(1,'select archived_at from tasks where id=$1',[id(40)])).rows[0].archived_at,null);
});
test('assignment notifies only assignee, unchanged saves do not duplicate, reassignment revokes old notification',async()=>{
 await as(1,'insert into task_assignments(id,task_id,employee_id,assigned_by) values($1,$2,$3,$4)',[id(50),id(40),id(12),id(1)]);
 let rows=(await as(2,"select * from notifications where type='task_assignment'")).rows;assert.equal(rows.length,1);
 const notification=rows[0].id;
 assert.equal((await as(3,"select * from notifications where type='task_assignment'")).rows.length,0);
 await as(2,'select workspace_read_notification($1)',[notification]);
 assert.ok((await as(2,'select read_at from notifications where id=$1',[notification])).rows[0].read_at);
 await as(1,'update task_assignments set employee_id=$1 where id=$2',[id(12),id(50)]);
 assert.equal((await as(2,"select * from notifications where type='task_assignment'")).rows.length,1);
 await as(1,'update task_assignments set employee_id=$1 where id=$2',[id(13),id(50)]);
 assert.equal((await as(2,"select * from notifications where type='task_assignment'")).rows.length,0);
 assert.equal((await as(3,"select * from notifications where type='task_assignment'")).rows.length,1);
 await assert.rejects(as(2,'select workspace_read_notification($1)',[notification]),/unavailable/);
});
test('earlier project and sales migrations coexist with workspace migration',async()=>{
 await db.exec('reset role');
 for(const name of ['202609050001_roles_and_statuses.sql','202609050002_project_access.sql','202609050003_sales_tracker.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
 assert.equal((await as(2,'select * from workspace_announcements')).rows.length,1);
 assert.equal((await as(3,"select * from notifications where type='task_assignment'")).rows.length,1);
 await as(1,'select workspace_archive_task($1,true)',[id(40)]);
});
