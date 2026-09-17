import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const users = {admin:1,muskan:2,lavanya:3,esther:4,kamalesh:5,veena:6,sabari:7,employee:8,outsider:9};
async function as(user, sql, params=[]) {
  await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${id(users[user])}',false)`);
  return db.query(sql,params);
}
async function root(sql) { await db.exec("reset role; select set_config('request.jwt.claim.sub','',false)"); return db.exec(sql); }
before(async()=>{
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth, public to authenticated,anon;
    create type public.user_role as enum ('admin','project_coordinator','team_lead','employee');
    create type public.project_status as enum ('planning');
    create table public.teams(id uuid primary key, name text);
    create table public.profiles(id uuid primary key,full_name text,role public.user_role,team_id uuid references teams(id),is_active boolean default true);
    create table public.employees(id uuid primary key,profile_id uuid references profiles(id),team_id uuid,full_name text,is_active boolean default true);
    create table public.projects(id uuid primary key default gen_random_uuid(),name text,client_id uuid,lead_employee_id uuid references employees(id),created_by uuid references profiles(id),status public.project_status default 'planning',completed_assets int default 0,total_assets_required int default 0,target_deadline date,start_date date,is_active boolean default true,updated_at timestamptz default now(),created_at timestamptz default now());
    create table public.tasks(id uuid primary key,project_id uuid references projects(id),title text);
    create table public.task_assignments(id uuid primary key,task_id uuid references tasks(id),employee_id uuid references employees(id),status text default 'assigned');
    create table public.timesheets(id uuid primary key,task_id uuid references tasks(id),employee_id uuid references employees(id));
    create table public.project_comments(id uuid primary key,project_id uuid references projects(id),body text);
    create table public.activity_logs(id uuid primary key,actor_id uuid,entity_type text,entity_id uuid);
    create table public.notifications(id uuid primary key,user_id uuid,entity_type text,entity_id uuid);
    grant all on all tables in schema public to authenticated;
    alter table projects enable row level security;
    create policy legacy_coordinator_all on projects for all to authenticated using(true) with check(true);
    alter table profiles enable row level security;
    create policy legacy_profiles on profiles for all to authenticated using(true) with check(true);
    alter table tasks enable row level security;
    create policy legacy_tasks on tasks for all to authenticated using(true) with check(true);
    insert into teams values ('${id(100)}','Production'),('${id(101)}','Other team');
    insert into profiles(id,full_name,role,team_id) values
      ('${id(1)}','Admin','admin','${id(100)}'),('${id(2)}','Muskan','team_lead','${id(100)}'),
      ('${id(3)}','Lavanya','project_coordinator','${id(100)}'),('${id(4)}','Esther','project_coordinator','${id(100)}'),
      ('${id(5)}','Kamalesh','team_lead','${id(100)}'),('${id(6)}','Veena','admin','${id(100)}'),
      ('${id(7)}','Sabari','admin','${id(100)}'),('${id(8)}','Employee','employee','${id(100)}'),
      ('${id(9)}','Other lead','team_lead','${id(101)}');
    insert into employees values ('${id(203)}','${id(3)}','${id(100)}','Lavanya',true),('${id(204)}','${id(4)}','${id(100)}','Esther',true);
    insert into projects(id,name,lead_employee_id,created_by) values
      ('${id(301)}','Lavanya private','${id(203)}','${id(1)}'),
      ('${id(302)}','Esther private','${id(204)}','${id(1)}');
    insert into tasks values('${id(401)}','${id(301)}','Private task');
    insert into project_comments values('${id(501)}','${id(301)}','Private comment');
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/202609050001_roles_and_statuses.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202609050002_project_access.sql',import.meta.url),'utf8'));
  await root(`update profiles set role='associate_lead' where id='${id(2)}';update profiles set role='director' where id in ('${id(6)}','${id(7)}');`);
});
after(()=>db.close());
test('legacy assignments backfill without fabricating assigner or date',async()=>{
  const r=await as('lavanya','select assigned_by,assigned_at from projects');
  assert.deepEqual(r.rows,[{assigned_by:null,assigned_at:null}]);
});
test('coordinators are isolated despite legacy broad project policy',async()=>{
  assert.equal((await as('lavanya','select * from projects')).rows.length,1);
  assert.equal((await as('esther','select * from projects')).rows.length,1);
  assert.equal((await as('lavanya','select * from projects where id=$1',[id(302)])).rows.length,0);
  assert.equal((await as('esther','select * from projects where id=$1',[id(301)])).rows.length,0);
});
test('associate lead and directors read all team projects; lead cannot read unrelated projects',async()=>{
  for(const u of ['muskan','veena','sabari','admin'])assert.equal((await as(u,'select * from projects')).rows.length,2);
  assert.equal((await as('kamalesh','select * from projects')).rows.length,0);
});
test('related tasks and comments enforce parent access',async()=>{
  assert.equal((await as('esther','select * from tasks')).rows.length,0);
  assert.equal((await as('esther','select * from project_comments')).rows.length,0);
  assert.equal((await as('veena','select * from tasks')).rows.length,1);
  assert.equal((await as('lavanya','select * from project_comments')).rows.length,1);
});
test('coordinator cannot self-share, promote role, alter team, or impersonate employee',async()=>{
  await assert.rejects(as('esther','select set_project_access($1,$2,$3)',[id(301),[id(4)],[]]),/not authorized/);
  await assert.rejects(as('esther',"update profiles set role='admin' where id=$1",[id(4)]),/administrators/);
  await assert.rejects(as('esther','update profiles set team_id=$1 where id=$2',[id(101),id(4)]),/administrators/);
  await assert.rejects(as('esther','update employees set profile_id=$1 where id=$2',[id(4),id(203)]),/administrators/);
  await assert.rejects(as('esther',"insert into project_members(project_id,profile_id,access_kind) values($1,$2,'shared')",[id(301),id(4)]),/permission denied/);
});
test('directors and leads have read access without project or task editing',async()=>{
  assert.equal((await as('veena',"update projects set name='bad' returning id")).rows.length,0);
  assert.equal((await as('veena',"update tasks set title='bad' returning id")).rows.length,0);
});
test('sharing is selective and revocation hides activity and notifications',async()=>{
  await as('muskan','select set_project_access($1,$2,$3)',[id(301),[id(3)],[id(4)]]);
  assert.equal((await as('esther','select * from projects')).rows.length,2);
  assert.equal((await as('esther','select * from project_notifications')).rows.length,1);
  await as('muskan','select set_project_access($1,$2,$3)',[id(301),[id(3)],[]]);
  assert.equal((await as('esther','select * from projects')).rows.length,1);
  assert.equal((await as('esther','select * from project_activity')).rows.length,0);
  assert.equal((await as('esther','select * from project_notifications')).rows.length,0);
});
test('joint assignment grants lead oversight only within the team and creates deduplicated notifications',async()=>{
  await as('muskan','select set_project_access($1,$2,$3)',[id(301),[id(3),id(4)],[]]);
  assert.equal((await as('kamalesh','select * from projects')).rows.length,1);
  assert.equal((await as('outsider','select * from projects')).rows.length,0);
  const before=(await as('kamalesh','select * from project_notifications')).rows.length;
  await as('muskan','select set_project_access($1,$2,$3)',[id(301),[id(3),id(4)],[]]);
  assert.equal((await as('kamalesh','select * from project_notifications')).rows.length,before);
});
test('reassignment revokes old access and preserves lead oversight',async()=>{
  await as('admin','select set_project_access($1,$2,$3)',[id(301),[id(4)],[]]);
  assert.equal((await as('lavanya','select * from projects')).rows.length,0);
  assert.equal((await as('kamalesh','select * from projects')).rows.length,1);
  assert.equal((await as('esther','select * from projects')).rows.length,2);
});
test('coordinator can update visible details; completion generates stakeholder notification and read state is owned',async()=>{
  await as('esther',"update projects set status='completed',completed_assets=1 where id=$1",[id(301)]);
  const rows=(await as('veena',"select * from project_notifications where message like 'Project completed:%'")).rows;
  assert.equal(rows.length,1);
  await as('esther','select mark_project_notification_read($1)',[rows[0].id]);
  assert.equal((await as('veena','select read_at from project_notifications where id=$1',[rows[0].id])).rows[0].read_at,null);
  await as('veena','select mark_project_notification_read($1)',[rows[0].id]);
  assert.ok((await as('veena','select read_at from project_notifications where id=$1',[rows[0].id])).rows[0].read_at);
});
test('coordinator cannot forge project provenance or archive',async()=>{
  await as('esther',"select set_config('crm.assignment_rpc','on',false)");
  await assert.rejects(as('esther','update projects set assigned_by=$1 where id=$2',[id(4),id(301)]),/workflow/);
  await assert.rejects(as('esther','update projects set is_active=false where id=$1',[id(301)]),/archive/);
});
test('new Associate Lead assignment records real provenance and gives lead visibility immediately',async()=>{
  const rows=(await as('muskan',"insert into projects(name,lead_employee_id) values('New assigned project',$1) returning *",[id(203)])).rows;
  assert.equal(rows[0].assigned_by,id(2)); assert.equal(rows[0].associate_assigned,true);
  assert.ok(rows[0].assigned_at);
  assert.equal((await as('kamalesh','select id from projects where id=$1',[rows[0].id])).rows.length,1);
  assert.equal((await as('lavanya','select id from projects where id=$1',[rows[0].id])).rows.length,1);
});
test('coordinator cannot create projects or mutate legacy project lead to bypass access workflow',async()=>{
  await assert.rejects(as('esther',"insert into projects(name) values('Unauthorized')"),/row-level security/);
  await assert.rejects(as('esther','update projects set lead_employee_id=$1 where id=$2',[id(203),id(301)]),/assignment workflow/);
});
test('inactive accounts lose membership and notification access',async()=>{
  await root(`update profiles set is_active=false where id='${id(4)}'`);
  assert.equal((await as('esther','select * from projects')).rows.length,0);
  assert.equal((await as('esther','select * from project_notifications')).rows.length,0);
});
test('anonymous sessions cannot read projects or provision trusted accounts',async()=>{
  await root("set role anon");
  await assert.rejects(db.query('select * from projects'),/permission denied/);
  await assert.rejects(db.query("insert into profiles(id,role) values($1,'admin')",[id(999)]),/permission denied/);
});
test('only administrators can map project teams and verified roles',async()=>{
  await assert.rejects(as('muskan','select set_project_team($1,$2)',[id(301),id(101)]),/administrators/);
  await as('admin','select set_project_team($1,$2)',[id(301),id(101)]);
  assert.equal((await as('kamalesh','select id from projects where id=$1',[id(301)])).rows.length,0);
  assert.equal((await as('outsider','select id from projects where id=$1',[id(301)])).rows.length,1);
  await as('admin',"update profiles set role='associate_lead' where id=$1",[id(9)]);
  assert.equal((await as('outsider','select id from projects where id=$1',[id(301)])).rows.length,1);
});
