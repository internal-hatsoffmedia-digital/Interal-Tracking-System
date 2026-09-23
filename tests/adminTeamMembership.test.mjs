import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {suppliedSchema} from './supplied-schema-fixture.mjs';
test('admin assigns existing auth users atomically; non-admin and invalid team rejected',async()=>{
 const db=new PGlite();try{
 await suppliedSchema(db);
 await db.exec(`alter table auth.users add column email text;create schema private;
 create function private.role_of(uid uuid) returns text language sql security definer as $$select role::text from public.profiles where id=uid and is_active$$;`);
 await db.exec(await readFile(new URL('../supabase/migrations/202609230015_admin_team_membership.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/migrations/202609230016_admin_auth_employee.sql',import.meta.url),'utf8'));
 const admin='00000000-0000-0000-0000-000000000001', user='00000000-0000-0000-0000-000000000002',team='00000000-0000-0000-0000-000000000003';
 await db.query('insert into auth.users(id,email) values($1,$2),($3,$4)',[admin,'admin@test.local',user,'new@test.local']);
 await db.query("insert into profiles(id,full_name,role) values($1,'Admin','admin')",[admin]);
 await db.query("insert into teams(id,name) values($1,'Team')",[team]);
 await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${user}',false)`);
 await assert.rejects(db.query('select admin_team_accounts()'),/Administrator/);
 await assert.rejects(db.query('select admin_save_auth_employee($1,$2)',[user,'New Person']),/Administrator/);
 await assert.rejects(db.query('select admin_assign_team_account($1,$2)',[user,team]),/Administrator/);
 await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false)`);
 assert.equal((await db.query('select * from admin_team_accounts()')).rows.length,2);
 await assert.rejects(db.query('select admin_assign_team_account($1,$2)',[user,admin]),/active team/);
 await db.query('select admin_save_auth_employee($1,$2)',[user,'New Person']);
 assert.equal((await db.query('select full_name from employees where profile_id=$1',[user])).rows[0].full_name,'New Person');
 await db.query('select admin_assign_team_account($1,$2)',[user,team]);
 await db.query('select admin_assign_team_account($1,$2)',[user,team]);
 const p=(await db.query('select team_id,role from profiles where id=$1',[user])).rows[0];assert.equal(p.team_id,team);assert.equal(p.role,'employee');
 const e=(await db.query('select team_id from employees where profile_id=$1',[user])).rows;assert.equal(e.length,1);assert.equal(e[0].team_id,team);
 }finally{await db.close();}
});
