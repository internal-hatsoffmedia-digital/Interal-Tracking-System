import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {suppliedSchema} from './supplied-schema-fixture.mjs';
const db=new PGlite();const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
async function as(n,sql,params=[]){await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(n)}',false)`);return db.query(sql,params);}
let leadId;let version;
const input={name:'Verified lead',source:'Cold Call',company:'Test company',stage:'lead',deal_value:1200,owner_id:id(2)};
before(async()=>{
  await suppliedSchema(db);
  await db.exec(`insert into auth.users values('${id(1)}'),('${id(2)}'),('${id(3)}'),('${id(4)}');
    insert into profiles(id,full_name,role) values('${id(1)}','Admin','admin'),('${id(2)}','Sales One','employee'),('${id(3)}','Sales Two','employee'),('${id(4)}','Viewer','employee');`);
  await db.exec(await readFile(new URL('../supabase/migrations/202609050003_sales_tracker.sql',import.meta.url),'utf8'));
});
after(()=>db.close());
test('sales migration works with the supplied schema independently of project migrations',async()=>{
  assert.equal((await as(1,'select sales_my_access() as level')).rows[0].level,'admin');
  assert.equal((await as(2,'select sales_my_access() as level')).rows[0].level,null);
  assert.equal((await as(2,'select * from sales_leads')).rows.length,0);
});
test('only administrators grant sales access; legacy profile policy cannot allow promotion',async()=>{
  await assert.rejects(as(2,"select sales_grant_access($1,'manager')",[id(2)]),/administrators/);
  await assert.rejects(as(2,"update profiles set role='admin' where id=$1",[id(2)]),/administrators/);
  await as(1,"select sales_grant_access($1,'member')",[id(2)]);
  await as(1,"select sales_grant_access($1,'member')",[id(3)]);
  await as(1,"select sales_grant_access($1,'viewer')",[id(4)]);
});
test('lead creation records actor/history and notifies only assigned user',async()=>{
  leadId=(await as(1,'select sales_save_lead(null,$1) as id',[input])).rows[0].id;
  const rows=(await as(2,'select * from sales_leads')).rows;assert.equal(rows.length,1);version=rows[0].updated_at;
  assert.equal(rows[0].created_by,id(1));
  assert.equal((await as(3,'select * from sales_leads')).rows.length,0);
  assert.equal((await as(2,'select * from sales_activities')).rows.length,1);
  assert.equal((await as(3,'select * from sales_activities')).rows.length,0);
  assert.equal((await as(2,"select * from notifications where entity_type='sales_lead'")).rows.length,1);
  assert.equal((await as(3,"select * from notifications where entity_type='sales_lead'")).rows.length,0);
});
test('viewers can read but cannot write; direct table mutation is denied',async()=>{
  assert.equal((await as(4,'select * from sales_leads')).rows.length,1);
  await assert.rejects(as(4,'select sales_save_lead($1,$2,$3)',[leadId,input,version]),/not authorized/);
  await assert.rejects(as(2,"update sales_leads set stage='won' where id=$1",[leadId]),/permission denied/);
});
test('members cannot reassign or change another member lead',async()=>{
  await assert.rejects(as(2,'select sales_save_lead($1,$2,$3)',[leadId,{...input,owner_id:id(3)},version]),/reassign/);
  await assert.rejects(as(3,'select sales_save_lead($1,$2,$3)',[leadId,input,version]),/access denied/);
});
test('conversions record date and reject stale concurrent edits',async()=>{
  await as(2,'select sales_save_lead($1,$2,$3)',[leadId,{...input,stage:'won'},version]);
  const lead=(await as(2,'select * from sales_leads')).rows[0];assert.ok(lead.won_at);assert.equal(Number(lead.deal_value),1200);
  await assert.rejects(as(2,'select sales_save_lead($1,$2,$3)',[leadId,input,version]),/changed/);
  version=lead.updated_at;
});
test('activity notes complete or reschedule follow-ups and cannot forge system history',async()=>{
  await as(2,"select sales_log_activity($1,'call','Discussed next steps','2026-10-01',true)",[leadId]);
  assert.equal((await as(2,'select next_follow_up::text from sales_leads')).rows[0].next_follow_up,'2026-10-01');
  await as(2,"select sales_log_activity($1,'call','Completed follow-up',null,true)",[leadId]);
  assert.equal((await as(2,'select next_follow_up from sales_leads')).rows[0].next_follow_up,null);
  await assert.rejects(as(2,"select sales_log_activity($1,'system','Forged',null,false)",[leadId]),/manually/);
});
test('targets require management access and valid month/amount',async()=>{
  await assert.rejects(as(2,"select sales_set_target('2026-09-01',5000)"),/managers/);
  await assert.rejects(as(1,"select sales_set_target('2026-09-02',5000)"),/check constraint/);
  await as(1,"select sales_set_target('2026-09-01',5000)");
  assert.equal((await as(2,'select * from sales_targets')).rows.length,0);
  assert.equal((await as(4,'select * from sales_targets')).rows.length,1);
});
test('reassignment revokes former owner access including existing notifications',async()=>{
  version=(await as(1,'select updated_at from sales_leads')).rows[0].updated_at;
  await as(1,'select sales_save_lead($1,$2,$3)',[leadId,{...input,owner_id:id(3)},version]);
  assert.equal((await as(2,'select * from sales_leads')).rows.length,0);
  assert.equal((await as(2,"select * from notifications where entity_type='sales_lead'")).rows.length,0);
});
test('project migrations coexist with sales and retain sales function grants',async()=>{
  await db.exec("reset role;select set_config('request.jwt.claim.sub','',false)");
  await db.exec(await readFile(new URL('../supabase/migrations/202609050001_roles_and_statuses.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202609050002_project_access.sql',import.meta.url),'utf8'));
  assert.equal((await as(3,'select * from sales_leads')).rows.length,1);
});
