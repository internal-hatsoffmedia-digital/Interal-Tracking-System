import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {suppliedSchema} from './supplied-schema-fixture.mjs';
const db=new PGlite();const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
async function as(n,sql,params=[]){await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(n)}',false)`);return db.query(sql,params);}
before(async()=>{
 await suppliedSchema(db);
 await db.exec(await readFile(new URL('../supabase/migrations/202609050001_roles_and_statuses.sql',import.meta.url),'utf8'));
 await db.exec(`insert into auth.users select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,7)n;
 insert into teams(id,name) values('${id(100)}','Project Coordination'),('${id(200)}','Production');
 insert into profiles(id,full_name,role,team_id) values
 ('${id(1)}','Admin','admin','${id(200)}'),('${id(2)}','Muskan','associate_lead','${id(100)}'),
 ('${id(3)}','Lavanya','project_coordinator','${id(100)}'),('${id(4)}','Esther','project_coordinator','${id(100)}'),
 ('${id(5)}','Director','director','${id(200)}'),('${id(6)}','Editor','employee','${id(200)}'),('${id(7)}','Other Coordinator','project_coordinator','${id(200)}');
 insert into employees(id,profile_id,employee_code,full_name,team_id) values('${id(13)}','${id(3)}','L','Lavanya','${id(100)}'),('${id(16)}','${id(6)}','E','Editor','${id(200)}');
 insert into clients(id,name) values('${id(20)}','Client');
 insert into projects(id,client_id,name,lead_employee_id) values('${id(30)}','${id(20)}','Lavanya project','${id(13)}'),('${id(31)}','${id(20)}','Other project','${id(16)}');`);
 await db.exec(await readFile(new URL('../supabase/migrations/202609050002_project_access.sql',import.meta.url),'utf8'));
 // Legacy cross-team Associate Lead grant must no longer override team scope.
 await db.exec(`insert into project_members(project_id,profile_id,access_kind) values('${id(31)}','${id(2)}','shared')`);
 await db.exec(await readFile(new URL('../supabase/migrations/202609080005_coordinator_project_access.sql',import.meta.url),'utf8'));
});
after(()=>db.close());
test('Muskan sees coordinator team only, even with legacy cross-team share; directors keep oversight',async()=>{
 assert.deepEqual((await as(2,'select name from projects order by name')).rows.map(r=>r.name),['Lavanya project']);
 assert.equal((await as(5,'select id from projects')).rows.length,2);
 assert.equal((await as(6,'select id from projects')).rows.length,0,'Legacy employee project membership must not grant access');
});
test('coordinators isolated until explicitly shared; admin and employee cannot be assigned',async()=>{
 assert.equal((await as(4,'select id from projects')).rows.length,0);
 for(const person of [1,2,6,7])await assert.rejects(as(1,'select set_project_access($1,$2,$3)',[id(30),[id(person)],[]]),/Project Coordinators/);
 await as(2,'select set_project_access($1,$2,$3)',[id(30),[id(3)],[id(4)]]);
 assert.equal((await as(4,'select id from projects')).rows.length,1);
 await as(2,'select set_project_access($1,$2,$3)',[id(30),[id(3)],[]]);
 assert.equal((await as(4,'select id from projects')).rows.length,0);
 await assert.rejects(as(2,'select set_project_access($1,$2,$3)',[id(31),[id(7)],[]]),/not authorized/);
});
test('new project derives coordinator team from initial coordinator and rejects employee lead',async()=>{
 const r=await as(1,'insert into projects(name,client_id,lead_employee_id) values($1,$2,$3) returning team_id',['New',id(20),id(13)]);
 assert.equal(r.rows[0].team_id,id(100));
 await assert.rejects(as(1,'insert into projects(name,client_id,lead_employee_id) values($1,$2,$3)',['Invalid',id(20),id(16)]),/active project lead/);
});
test('employees retain task-based production access without becoming project coordinators',async()=>{
 await db.exec(`reset role;select set_config('request.jwt.claim.sub','',false);
 insert into tasks(id,project_id,title) values('${id(40)}','${id(30)}','Editing');
 insert into task_assignments(task_id,employee_id,assigned_by) values('${id(40)}','${id(16)}','${id(1)}');`);
 assert.equal((await as(6,'select id from projects')).rows.length,1);
 assert.equal((await as(6,'select id from tasks')).rows.length,1);
 await assert.rejects(as(6,'select set_project_access($1,$2,$3)',[id(30),[id(3)],[]]),/not authorized/);
});
