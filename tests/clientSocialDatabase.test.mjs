import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
test('client sources and social editing enforce URLs, source options and narrow lead permissions',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role authenticated;create role anon;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table profiles(id uuid primary key,full_name text,role text,is_active boolean);
 create table clients(id uuid primary key,name text,links text[] not null default '{}');
 alter table clients enable row level security;
 grant usage on schema public,auth,private to authenticated,anon;
 grant select on profiles to authenticated;
 grant select,update on clients to authenticated;
 create table employees(id uuid primary key,profile_id uuid,full_name text,employee_code text,team_id uuid);
 create table task_assignments(id uuid primary key,task_id uuid,employee_id uuid,assigned_by uuid);
 create table visible_tasks(viewer uuid,task uuid);
 create function private.can_view_task(tid uuid) returns boolean language sql stable as $$select exists(select 1 from public.visible_tasks where viewer=auth.uid() and task=tid)$$;
 create function private.valid_client_links(items text[]) returns boolean language sql immutable as $$select cardinality(items)<=20 and not exists(select 1 from unnest(items) link where link is null or link !~* '^https?://[^/@[:space:]?#]+([/?#][^[:space:]]*)?$')$$;
 insert into profiles values('00000000-0000-0000-0000-000000000001','Lead','associate_lead',true),('00000000-0000-0000-0000-000000000002','Employee','employee',true),('00000000-0000-0000-0000-000000000003','Inactive','manager',false);
 insert into clients values('00000000-0000-0000-0000-000000000010','Client','{}');
 insert into employees values('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000002','Employee','EMP-002',null);
 insert into task_assignments values('00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000040','00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000001');
 insert into visible_tasks values('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000040');`);
 await db.exec(await readFile('supabase/migrations/202611070002_client_social_preview.sql','utf8'));
 async function login(n){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id(n)]);await db.exec('set role authenticated');}
 await login(1);
 assert.equal((await db.query('select * from clients')).rows.length,1);
 let result=(await db.query('select set_client_links_and_source($1,$2) c',[id(10),{lead_source:'campaign',facebook_link:'https://facebook.com/example',instagram_link:'https://instagram.com/example',youtube_link:'https://youtube.com/@example'}])).rows[0].c;
 assert.equal(result.lead_source,'campaign');assert.equal(result.youtube_link,'https://youtube.com/@example');
 await assert.rejects(()=>db.query('select set_client_links_and_source($1,$2)',[id(10),{name:'Changed'}]),/Only client links/);
 await assert.rejects(()=>db.query('select set_client_links_and_source($1,$2)',[id(10),{facebook_link:'javascript:alert(1)'}]),/clients_social_http_links/);
 await assert.rejects(()=>db.query('select set_client_links_and_source($1,$2)',[id(10),{lead_source:'unknown'}]),/clients_known_lead_source/);
 result=(await db.query('select set_client_links_and_source($1,$2) c',[id(10),{lead_source:null,facebook_link:null}])).rows[0].c;
 assert.equal(result.lead_source,null);assert.equal(result.facebook_link,null);
 assert.equal((await db.query('select * from assignment_display_people($1)',[[id(30)]])).rows[0].full_name,'Employee');
 await login(2);
 await assert.rejects(()=>db.query('select set_client_links_and_source($1,$2)',[id(10),{lead_source:'field'}]),/editing access required/);
 assert.equal((await db.query('select * from assignment_display_people($1)',[[id(30)]])).rows.length,0);
 await login(3);
 await assert.rejects(()=>db.query('select set_client_links_and_source($1,$2)',[id(10),{lead_source:'field'}]),/editing access required/);
 await db.exec('reset role;set role anon');
 await assert.rejects(()=>db.query('select * from assignment_display_people($1)',[[id(30)]]),/permission denied/);
 }finally{await db.close();}
});
