import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('project tracker stores data and rejects duplicate codes, negative rates and invalid production times', async()=>{
 const db=new PGlite();
 try {
 await db.exec('create table public.projects (id integer primary key);');
 await db.exec(await readFile(new URL('../supabase/migrations/202610100020_hat_panel_tracker.sql',import.meta.url),'utf8'));
 await db.exec("insert into projects(id,project_code,rate,started_at,ended_at,final_link) values(1,'HAT-001',1250,'2026-10-10T09:00:00Z','2026-10-10T10:30:00Z','https://example.com/delivery');");
 await assert.rejects(db.exec("insert into projects(id,project_code) values(2,'hat-001')"),/unique/);
 await assert.rejects(db.exec('update projects set rate=-1 where id=1'),/check constraint/);
 await assert.rejects(db.exec("update projects set ended_at='2026-10-10T08:00:00Z' where id=1"),/check constraint/);
 await assert.rejects(db.exec("update projects set final_link='javascript:alert(1)' where id=1"),/check constraint/);
 const {rows}=await db.query('select project_code,rate from projects where id=1');
 assert.equal(rows[0].project_code,'HAT-001');assert.equal(Number(rows[0].rate),1250);
 } finally { await db.close(); }
});
