import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('project IDs are generated once and daily tasks share the project rate', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema private;
      create table public.projects(id integer primary key, created_at timestamptz default now());
      create table public.tasks(id integer primary key, project_id integer references projects(id), planned_date date);`);
    await db.exec(await readFile(new URL('../supabase/migrations/202610100020_hat_panel_tracker.sql',import.meta.url),'utf8'));
    await db.exec(`insert into projects(id,created_at,rate) values (1,'2026-09-01T00:00:00Z',1000),(2,'2026-09-02T00:00:00Z',2000);`);
    await db.exec(await readFile(new URL('../supabase/migrations/202610100021_fixed_project_ids.sql',import.meta.url),'utf8'));
    const { rows: codes } = await db.query('select project_code from projects order by id');
    assert.deepEqual(codes.map(p => p.project_code), ['HMSEP0001','HMSEP0002']);
    const { rows: next } = await db.query("select private.next_project_code('2027-09-01T00:00:00Z') code");
    assert.equal(next[0].code,'HMSEP0003');
    await assert.rejects(db.exec("update projects set project_code='OTHER' where id=1"),/fixed/);
    await db.exec("insert into tasks values(1,1,'2026-09-01'),(2,1,'2026-09-02'); update projects set rate=1500 where id=1;");
    const { rows } = await db.query('select p.project_code,p.rate from tasks t join projects p on p.id=t.project_id order by t.id');
    assert.deepEqual(rows.map(r=>[r.project_code,Number(r.rate)]),[['HMSEP0001',1500],['HMSEP0001',1500]]);
    await db.exec("insert into projects(id,project_code) values(3,'CLIENT-SUPPLIED');");
    const {rows:newRows} = await db.query('select project_code from projects where id=3');
    assert.match(newRows[0].project_code,/^HM[A-Z]{3}\d{4,}$/);
    assert.notEqual(newRows[0].project_code,'CLIENT-SUPPLIED');
  } finally { await db.close(); }
});
