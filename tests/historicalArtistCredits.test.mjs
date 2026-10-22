import {test} from 'node:test';import assert from 'node:assert/strict';import {PGlite} from '@electric-sql/pglite';import {readFile} from 'node:fs/promises';
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
test('historical credits use a unique verified contributor, preserve existing credits and skip ambiguous projects',async()=>{const db=new PGlite();try{
 await db.exec(`create schema private;create schema auth;create function auth.uid() returns uuid language sql as $$select null::uuid$$;
 create table projects(id uuid primary key,status text,sales_completed_at timestamptz,rate numeric,created_by uuid,completed_by_profile_id uuid,is_active boolean);
 create table profiles(id uuid primary key,is_active boolean,team_id uuid);create table employees(id uuid primary key,profile_id uuid,is_active boolean);
 create table project_artist_links(project_id uuid,profile_id uuid);create table tasks(id uuid primary key,project_id uuid,archived_at timestamptz);create table task_assignments(task_id uuid,employee_id uuid,status text);
 create table project_sales_credits(project_id uuid,profile_id uuid,amount numeric,credited_by uuid,team_id uuid,source text,primary key(project_id,profile_id));
 insert into profiles values('${id(1)}',true,null),('${id(2)}',true,null);insert into employees values('${id(11)}','${id(1)}',true),('${id(12)}','${id(2)}',true);
 insert into projects select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'completed',now(),800,null,null,true from generate_series(21,24) n;
 insert into project_artist_links values('${id(21)}','${id(1)}'),('${id(22)}','${id(1)}'),('${id(22)}','${id(2)}'),('${id(23)}','${id(1)}');
 insert into project_sales_credits values('${id(23)}','${id(2)}',300,'${id(2)}',null,'manual');`);
 const sql=await readFile('supabase/migrations/202610220003_verified_historical_credits.sql','utf8');await db.exec(sql);await db.exec(sql);
 const rows=(await db.query('select * from project_sales_credits order by project_id')).rows;assert.equal(rows.length,2);assert.equal(rows[0].profile_id,id(1));assert.equal(Number(rows[0].amount),800);assert.equal(rows[1].profile_id,id(2));assert.equal(Number(rows[1].amount),300);
 assert.equal((await db.query('select completed_by_profile_id from projects where id=$1',[id(21)])).rows[0].completed_by_profile_id,id(1));
 }finally{await db.close();}});
