import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
test('verified project artists receive scoped history and project QC without tasks or financial access',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table profiles(id uuid primary key,full_name text,role text,is_active boolean,team_id uuid);
 create table clients(id uuid primary key,name text);
 create table projects(id uuid primary key,name text,project_code text,client_id uuid,team_id uuid,production_team_ids uuid[],status text,is_active boolean,started_at timestamptz,ended_at timestamptz,target_deadline date,rate numeric);
 create table tasks(id uuid primary key,project_id uuid references projects,title text,status text,footage_link text,archived_at timestamptz);
 create table employees(id uuid primary key,profile_id uuid,is_active boolean);create table task_assignments(task_id uuid,employee_id uuid,status text);create table project_members(project_id uuid,profile_id uuid);
 create table member_page_access(profile_id uuid,page text constraint member_page_access_page_check check(page in ('dashboard')),allowed boolean,updated_by uuid,updated_at timestamptz,primary key(profile_id,page));
 create function private.manages_page_access() returns boolean language sql as $$select true$$;
 create function private.role_of(u uuid) returns text language sql as $$select role from public.profiles where id=u and is_active$$;
 insert into profiles values('${id(1)}','Admin','admin',true,null),('${id(2)}','Artist A','employee',true,'${id(10)}'),('${id(3)}','Artist B','employee',true,'${id(11)}'),('${id(4)}','Lead A','associate_lead',true,'${id(10)}'),('${id(5)}','Coordinator','project_coordinator',true,'${id(12)}');
 insert into projects values('${id(20)}','Project A','A1',null,'${id(12)}',array['${id(10)}'::uuid],'in_progress',true,null,null,null,9000),('${id(21)}','Project B','B1',null,'${id(12)}',array['${id(11)}'::uuid],'completed',true,null,null,null,8000);`);
 await db.exec(await readFile('supabase/migrations/202610150002_qc_workspace.sql','utf8'));await db.exec(await readFile('supabase/migrations/202610150004_project_artist_links.sql','utf8'));
 await db.exec(`insert into project_artist_links(project_id,profile_id,coordinator_id,source_artist,source_coordinator,linked_by) values('${id(20)}','${id(2)}','${id(5)}','A','PC','${id(1)}'),('${id(21)}','${id(3)}','${id(5)}','B','PC','${id(1)}');insert into qc_reviews(project_id) values('${id(20)}');grant usage on schema auth to authenticated;set role authenticated;`);
 const as=async n=>db.exec(`select set_config('request.jwt.claim.sub','${id(n)}',false)`);const rows=async()=> (await db.query('select project_artist_work() d')).rows[0].d;
 await as(2);let r=await rows();assert.deepEqual(r.map(x=>x.code),['A1']);assert.equal(r[0].artist,'Artist A');assert.equal(r[0].coordinator,'Coordinator');assert.ok(!('rate' in r[0]));assert.equal((await db.query('select project_artist_work($1) d',[id(21)])).rows[0].d.length,0);await assert.rejects(db.query('select * from project_artist_links'),/permission denied/);
 let qc=(await db.query('select qc_workspace() d')).rows[0].d;assert.equal(qc.items.length,1);assert.deepEqual(qc.items[0].assignees,[{id:id(2),name:'Artist A'}]);const review=qc.items[0].id;
 await as(3);assert.deepEqual((await rows()).map(x=>x.code),['B1']);assert.equal((await db.query('select qc_workspace() d')).rows[0].d.items.length,0);
 await as(4);assert.deepEqual((await rows()).map(x=>x.code),['A1']);await as(5);assert.equal((await rows()).length,2);assert.equal((await db.query('select qc_workspace() d')).rows[0].d.items.length,1);
 await as(1);await db.query('select qc_update($1,$2)',[review,'claim']);await db.query('select qc_update($1,$2,$3,$4)',[review,'corrections','Fix the poster',id(2)]);
 await as(2);await db.query('select qc_update($1,$2,$3)',[review,'resubmit','Poster fixed']);
 await db.exec(`reset role;update profiles set is_active=false where id='${id(2)}';set role authenticated`);await assert.rejects(rows(),/Active account/);await as(4);assert.equal((await rows()).length,0);
 await db.exec('reset role;set role anon');await assert.rejects(rows(),/permission denied/);
 }finally{await db.close();}
});
