import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('client creation permits active Flow Force roles and preserves provenance and other boundaries',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role authenticated;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table teams(id uuid primary key,name text,team_type text);
 create table profiles(id uuid primary key,role text,team_id uuid,is_active boolean default true);
 create table clients(id uuid default gen_random_uuid() primary key,name text,created_by uuid,created_at timestamptz default now());
 create function public.is_admin_or_coordinator() returns boolean language sql stable security definer as $$select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','project_coordinator'))$$;
 alter table clients enable row level security;
 create policy clients_select on clients for select to authenticated using(true);
 create policy clients_insert on clients for insert to authenticated with check(is_admin_or_coordinator());
 grant usage on schema auth to authenticated;grant all on clients to authenticated;
 insert into teams values('00000000-0000-0000-0000-000000000100','Flow Force','flow_force'),('00000000-0000-0000-0000-000000000101','Creative Clan','creative_clan');`);
 await db.exec(await readFile(new URL('../supabase/migrations/202610060024_flow_force_client_creation.sql',import.meta.url),'utf8'));
 await db.exec('create trigger workspace_client_provenance before insert or update on clients for each row execute function private.client_provenance()');
 const roles=['admin','director','manager','associate_lead','team_lead','project_coordinator','employee'];
 for(let i=0;i<roles.length;i++){
 const uid='00000000-0000-0000-0000-'+String(i+1).padStart(12,'0');
 await db.query('insert into profiles(id,role,team_id) values($1,$2,$3)',[uid,roles[i],'00000000-0000-0000-0000-000000000100']);
 await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${uid}',false)`);
 assert.equal((await db.query('select client_creation_allowed() as allowed')).rows[0].allowed,true,roles[i]);
 const row=(await db.query('insert into clients(name,created_by,created_at) values($1,$2,$3) returning *',['Test',uid,'2000-01-01'])).rows[0];
 assert.equal(row.created_by,uid);assert.notEqual(new Date(row.created_at).getUTCFullYear(),2000);
 await db.exec('reset role');
 }
 await db.exec(`update profiles set team_id='00000000-0000-0000-0000-000000000101' where role='employee';set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000007',false)`);
 assert.equal((await db.query('select client_creation_allowed() as allowed')).rows[0].allowed,false);
 await assert.rejects(db.query("insert into clients(name) values('Denied')"),/cannot create clients|row-level security/);
 await db.exec(`reset role;update profiles set is_active=false where role='associate_lead';set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false)`);
 assert.equal((await db.query('select client_creation_allowed() as allowed')).rows[0].allowed,false);
 await assert.rejects(db.query("insert into clients(name) values('Inactive')"),/cannot create clients|row-level security/);
 await db.exec(`reset role;update teams set name='Coordination',team_type='project_coordination' where team_type='flow_force';set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false)`);
 assert.equal((await db.query('select client_creation_allowed() as allowed')).rows[0].allowed,true);
 await db.exec('reset role');
 await assert.rejects(db.query("update clients set created_at='2000-01-01'"),/cannot be changed/);
 }finally{await db.close();}
});
