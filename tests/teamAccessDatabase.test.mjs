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
 create policy fixture_workers_write on employees for all to authenticated using(true) with check(true);
 create policy fixture_assignment_write on task_assignments for all to authenticated using(true) with check(true);`);
 for(const name of ['202609050001_roles_and_statuses.sql','202609050002_project_access.sql','202609050003_sales_tracker.sql','202609050004_workspace_updates.sql','202609080005_coordinator_project_access.sql','202609080006_team_access_admin.sql','202609180007_coordinator_team_leads.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
 await db.exec(`insert into auth.users select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,14)n;
 insert into teams(id,name) values('${id(100)}','Project Coordinators'),('${id(101)}','Creative Clan'),('${id(102)}','Cut Masters'),('${id(103)}','Web Development'),('${id(104)}','Digital Ninjas');`);
 const people=[[1,'Admin','admin',100],[2,'Muskan','associate_lead',100],[3,'Ganesh','associate_lead',101],[4,'Sudeesh','associate_lead',102],[5,'Vijay','associate_lead',103],[6,'Janani','associate_lead',104],[7,'Lavanya','project_coordinator',100],[8,'Esther','project_coordinator',100],[9,'Director','director',100],[10,'Image editor','employee',101],[11,'Video editor','employee',102],[12,'Web developer','employee',103],[13,'Digital marketer','employee',104],[14,'Kamalesh','team_lead',100]];
 for(const [n,name,role,team] of people){await db.query('insert into profiles(id,full_name,role,team_id) values($1,$2,$3,$4)',[id(n),name,role,id(team)]);await db.query('insert into employees(id,profile_id,full_name,employee_code,team_id) values($1,$2,$3,$4,$5)',[id(200+n),id(n),name,'E'+n,id(team)]);}
 await db.exec(`insert into clients(id,name) values('${id(50)}','Client');
 insert into projects(id,name,client_id,team_id,associate_assigned) values('${id(301)}','Multi-team project','${id(50)}','${id(100)}',true),('${id(302)}','Other project','${id(50)}','${id(100)}',true);
 insert into project_members(project_id,profile_id,access_kind) values('${id(301)}','${id(7)}','assignee'),('${id(302)}','${id(8)}','assignee');`);
 for(let n=1;n<=5;n++){
 await db.query('insert into tasks(id,project_id,title) values($1,$2,$3)',[id(400+n),id(301),'Task '+n]);
 const worker=n===5?10:9+n;
 await db.query('insert into task_assignments(id,task_id,employee_id,assigned_by) values($1,$2,$3,$4)',[id(500+n),id(400+n),id(200+worker),id(1)]);
 }
 await db.query('insert into task_assignments(id,task_id,employee_id,assigned_by) values($1,$2,$3,$4)',[id(506),id(405),id(211),id(1)]);
 await db.exec(`insert into timesheets(employee_id,task_id,work_date,start_time) values('${id(210)}','${id(405)}',current_date,now()),('${id(211)}','${id(405)}',current_date,now());`);
});
after(()=>db.close());

test('Flow Force team lead can discover coordinators and create an assigned project',async()=>{
 assert.equal((await as(14,'select workspace_access_context() as access')).rows[0].access.can_manage_projects,true);
 const people=(await as(14,'select * from project_people()')).rows;
 assert.ok(people.some(p=>p.id===id(7)));
 assert.ok(people.some(p=>p.id===id(8)));
 const created=(await as(14,'insert into projects(name,client_id,lead_employee_id) values($1,$2,$3) returning id',['Lead-created project',id(50),id(208)])).rows[0];
 assert.equal((await as(8,'select id from projects where id=$1',[created.id])).rows.length,1);
 assert.equal((await as(7,'select id from projects where id=$1',[created.id])).rows.length,0);
 await as(14,'select set_project_access($1,$2,$3)',[created.id,[id(7)],[]]);
 assert.equal((await as(8,'select id from projects where id=$1',[created.id])).rows.length,0);
 await db.exec('reset role');
 await db.query('delete from projects where id=$1',[created.id]);
});
test('all five Associate Leads have the intended project/task scope',async()=>{
 assert.equal((await as(2,'select id from projects')).rows.length,2);
 assert.equal((await as(2,'select id from tasks')).rows.length,5);
 for(const [lead,tasks] of [[3,2],[4,2],[5,1],[6,1]]){
 assert.equal((await as(lead,'select id from projects')).rows.length,1);
 assert.equal((await as(lead,'select id from tasks')).rows.length,tasks);
 }
 assert.equal((await as(9,'select id from tasks')).rows.length,5);
 assert.equal((await as(14,'select id from tasks')).rows.length,5);
});
test('coordinators retain isolated project ownership; employee task view is isolated',async()=>{
 assert.equal((await as(7,'select id from tasks')).rows.length,5);
 assert.equal((await as(8,'select id from tasks')).rows.length,0);
 assert.equal((await as(10,'select id from tasks')).rows.length,2);
 assert.equal((await as(10,'select id from task_assignments where task_id=$1',[id(405)])).rows.length,1);
});
test('shared tasks do not expose other teams assignments or timesheets',async()=>{
 for(const lead of [3,4]){
 assert.equal((await as(lead,'select id from task_assignments where task_id=$1',[id(405)])).rows.length,1);
 assert.equal((await as(lead,'select id from timesheets where task_id=$1',[id(405)])).rows.length,1);
 }
 assert.equal((await as(5,'select id from timesheets')).rows.length,0);
});
test('production leads cannot create projects, reassign project owners, move tasks or steal employee teams',async()=>{
 await assert.rejects(as(3,'insert into projects(name,client_id,team_id) values($1,$2,$3)',['No',id(50),id(101)]),/row-level security/);
 await assert.rejects(as(3,'select set_project_access($1,$2,$3)',[id(301),[id(7)],[]]),/not authorized/);
 await assert.rejects(as(3,'update tasks set project_id=$1 where id=$2',[id(302),id(401)]),/project managers/);
 await assert.rejects(as(3,'update employees set team_id=$1 where id=$2',[id(103),id(210)]),/administrators/);
 assert.equal((await as(3,'update tasks set title=$1 where id=$2 returning id',['Unauthorized',id(402)])).rows.length,0);
});
test('production team leads see their team workload without coordinator management rights',async()=>{
 await db.exec("reset role;select set_config('request.jwt.claim.sub','',false)");
 await db.query("update profiles set role='team_lead' where id=$1",[id(5)]);
 try {
  assert.equal((await as(5,'select workspace_access_context() as access')).rows[0].access.can_manage_projects,false);
  assert.equal((await as(5,'select id from tasks')).rows.length,1);
  assert.equal((await as(5,'select id from task_assignments')).rows.length,1);
  await assert.rejects(as(5,'select set_project_access($1,$2,$3)',[id(301),[id(7)],[]]),/not authorized/);
 } finally {
  await db.exec("reset role;select set_config('request.jwt.claim.sub','',false)");
  await db.query("update profiles set role='associate_lead' where id=$1",[id(5)]);
 }
});
test('directory and access mutation are admin-only; self-demotion and stale writes fail',async()=>{
 await assert.rejects(as(3,'select admin_access_directory()'),/Administrator/);
 const result=(await as(1,'select admin_access_directory() as data')).rows[0].data;assert.equal(result.accounts.length,14);
 const expected={role:'associate_lead',team_id:id(101),sales_access:null};
 await assert.rejects(as(3,'select admin_set_access($1,$2,$3,$4,$5)',[id(3),'admin',id(101),null,expected]),/Administrator/);
 await assert.rejects(as(1,'select admin_set_access($1,$2,$3,$4,$5)',[id(1),'employee',id(101),null,{role:'admin',team_id:id(100),sales_access:null}]),/own administrator/);
 await assert.rejects(as(1,'select admin_set_access($1,$2,$3,$4,$5)',[id(3),'associate_lead',id(103),null,{}]),/changed since/);
});
test('saving team and Sales access is atomic, audited and revokes the previous team immediately',async()=>{
 await as(1,'select admin_set_access($1,$2,$3,$4,$5)',[id(3),'associate_lead',id(103),'viewer',{role:'associate_lead',team_id:id(101),sales_access:null}]);
 assert.equal((await as(3,'select id from tasks')).rows.length,1);
 assert.equal((await as(3,'select id from tasks where id=$1',[id(401)])).rows.length,0);
 assert.equal((await as(3,'select sales_my_access() as access')).rows[0].access,'viewer');
 assert.equal((await as(1,'select team_id from employees where profile_id=$1',[id(3)])).rows[0].team_id,id(103));
 assert.equal((await as(1,'select id from admin_access_history')).rows.length,1);
 assert.equal((await as(3,'select id from admin_access_history')).rows.length,0);
});
