import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('project rejection clears the rate and first completion survives later rework', async () => {
 const db = new PGlite();
 try {
  await db.exec(`create schema private; create table public.profiles (id uuid);
    create type project_status as enum ('in_progress','completed');
    create table projects (id int primary key,status project_status,rate numeric,sales_completed_at timestamptz);
    create table clients (id int primary key);
    create function private.project_sales_completion() returns trigger language plpgsql as $$begin return new;end$$;
    create trigger project_sales_completion before insert or update on projects for each row execute function private.project_sales_completion();
    insert into projects values (1,'completed',1200,'2026-10-20T10:00:00Z');`);
  const load = name => readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8');
  await db.exec(await load('202611060001_project_rejection_and_client_links.sql'));
  await db.exec(await load('202611060002_preserve_sales_booking.sql'));
  const booked = async () => (await db.query("select rate, sales_completed_at::date::text as day from projects where id=1")).rows[0];
  await db.exec("update projects set status='in_progress', sales_completed_at=now() where id=1");
  assert.equal((await booked()).day,'2026-10-20');
  await db.exec("update projects set status='completed' where id=1");
  assert.equal((await booked()).day,'2026-10-20');
  await db.exec("update projects set status='rejected' where id=1");
  assert.equal((await booked()).rate,null);
  await db.exec("insert into clients values (1,array['https://example.com/path','http://example.org'])");
  await assert.rejects(()=>db.exec("update clients set links=array['javascript:alert(1)']"),/clients_http_links/);
 } finally {await db.close();}
});
