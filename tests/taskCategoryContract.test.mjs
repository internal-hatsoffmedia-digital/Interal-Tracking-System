import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('every task category and file status offered by the form is accepted by Supabase enums', async()=>{
 const db=new PGlite();
 try {
  await db.exec("create type task_category as enum ('shorts_reels','long_video','smp'); create type revision_status as enum ('new_file','internal_correction','client_correction'); create table tasks(category task_category,revision_status revision_status);");
  const migration=await readFile(new URL('../supabase/migrations/202610130001_task_category_alignment.sql',import.meta.url),'utf8');
  await db.exec(migration); await db.exec(migration);
  const page=await readFile(new URL('../src/pages/tasks/Tasks.tsx',import.meta.url),'utf8');
  const options=name=>[...page.slice(page.indexOf('const '+name),page.indexOf('];',page.indexOf('const '+name))).matchAll(/value: "([^"]+)"/g)].map(m=>m[1]);
  const categories=options('categoryOptions'),revisions=options('revisionStatusOptions');
  assert.equal(categories.length,12); assert.equal(revisions.length,3);
  for(const category of categories)for(const revision of revisions)await db.query('insert into tasks values($1,$2)',[category,revision]);
  assert.equal((await db.query('select count(*)::int count from tasks')).rows[0].count,36);
 }finally {await db.close();}
});
