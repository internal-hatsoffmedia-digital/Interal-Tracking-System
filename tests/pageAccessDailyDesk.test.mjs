import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('leadership page controls and private daily entries enforce ownership',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated;create table teams(id uuid primary key,name text);create table profiles(id uuid primary key,full_name text,role text,team_id uuid,is_active boolean);grant select on profiles to authenticated;insert into profiles values('00000000-0000-0000-0000-000000000001','Admin','admin',null,true),('00000000-0000-0000-0000-000000000002','Worker','employee',null,true),('00000000-0000-0000-0000-000000000003','Other','employee',null,true);`);
 await db.exec(await readFile(new URL('../supabase/migrations/202610130005_page_access_daily_desk.sql',import.meta.url),'utf8'));
 const as=async n=>db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-${String(n).padStart(12,'0')}',false);`);
 await as(1);await db.query('select set_member_page_access($1,$2)',['00000000-0000-0000-0000-000000000002',{projects:false}]);
 await as(2);const own=(await db.query('select member_page_access_data() d')).rows[0].d;assert.equal(own.manager,false);assert.equal(own.members.length,0);assert.equal(own.rules.length,1);assert.equal(own.rules[0].allowed,false);
 await assert.rejects(db.query('select set_member_page_access($1,$2)',['00000000-0000-0000-0000-000000000003',{sales:true}]),/Leadership/);
 await db.exec(`insert into daily_desk_entries(kind,content) values('todo','Private checklist');`);
 await as(3);assert.equal((await db.query('select * from daily_desk_entries')).rows.length,0);assert.equal((await db.query("update daily_desk_entries set content='stolen' returning id")).rows.length,0);
 await assert.rejects(db.exec(`insert into daily_desk_entries(profile_id,kind,content) values('00000000-0000-0000-0000-000000000002','note','Wrong owner');`),/row-level security/);
 await as(2);assert.equal((await db.query('select * from daily_desk_entries')).rows[0].content,'Private checklist');await db.exec('update daily_desk_entries set done=true');assert.equal((await db.query('select done from daily_desk_entries')).rows[0].done,true);
 await as(1);assert.equal((await db.query('select * from daily_desk_entries')).rows.length,0);await assert.rejects(db.query('select set_member_page_access($1,$2)',['00000000-0000-0000-0000-000000000002',{invalid:true}]),/Invalid/);
 }finally{await db.close();}
});
