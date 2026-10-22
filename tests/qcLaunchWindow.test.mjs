import {test} from 'node:test';import assert from 'node:assert/strict';import {PGlite} from '@electric-sql/pglite';import {readFile} from 'node:fs/promises';
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
test('QC launch keeps 22 October IST confirmations and preserves earlier records outside the active queue',async()=>{const db=new PGlite();try{
 await db.exec(`create table qc_reviews(id uuid primary key,project_id uuid,task_id uuid,coordinator_id uuid,coordinator_released_at timestamptz,state text);
 create table task_assignments(task_id uuid,status text,completed_at timestamptz);create table project_work_submissions(project_id uuid,submitted_at timestamptz);
 insert into qc_reviews values('${id(1)}','${id(101)}','${id(201)}',null,'2026-10-22T08:00:00+05:30','checking'),('${id(2)}','${id(102)}','${id(202)}',null,'2026-10-22T08:00:00+05:30','waiting'),('${id(3)}','${id(103)}',null,null,'2026-10-22T08:00:00+05:30','waiting'),('${id(4)}','${id(104)}',null,'${id(900)}','2026-10-22T00:00:00+05:30','approved'),('${id(5)}','${id(105)}',null,'${id(900)}','2026-10-21T23:59:59+05:30','waiting');
 insert into task_assignments values('${id(201)}','completed','2026-10-21T23:59:59+05:30'),('${id(202)}','completed','2026-10-22T00:00:00+05:30');insert into project_work_submissions values('${id(103)}','2026-10-22T00:00:00+05:30');`);
 const sql=await readFile('supabase/migrations/202610220006_qc_launch_window.sql','utf8');await db.exec(sql);await db.exec(sql);
 const rows=(await db.query('select * from qc_reviews order by id')).rows;assert.equal(rows.length,5);assert.equal(rows[0].coordinator_released_at,null);assert.ok(rows[0].prelaunch_released_at);assert.equal(rows[0].state,'checking');assert.ok(rows[1].coordinator_released_at);assert.ok(rows[2].coordinator_released_at);assert.ok(rows[3].coordinator_released_at);assert.equal(rows[4].coordinator_released_at,null);
 }finally{await db.close();}});
