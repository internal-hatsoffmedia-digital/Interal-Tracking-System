import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
const source=await readFile(new URL('../src/lib/dashboardCelebrations.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {studioDay,validBirthdayWish}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('birthday wishes expire at exact IST midnight and reject stale or malformed payloads',()=>{
 assert.equal(studioDay(new Date('2026-10-10T18:29:59Z')),'2026-10-10');
 assert.equal(studioDay(new Date('2026-10-10T18:30:00Z')),'2026-10-11');
 const wish={id:'wish',announcementId:'birthday',day:'2026-10-10',author:'Colleague',text:'Happy birthday!'};
 assert.equal(validBirthdayWish(wish,'birthday','2026-10-10'),true);
 for(const value of [null,{}, {...wish,day:'2026-10-09'},{...wish,announcementId:'other'},{...wish,text:' '.repeat(5)},{...wish,text:'x'.repeat(281)}])assert.equal(validBirthdayWish(value,'birthday','2026-10-10'),false);
});
test('birthday channel authorization restricts dates and active accounts; image limits are enforced',async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema private;create schema realtime;
 create table private.test_identity(active boolean);insert into private.test_identity values(true);
 create function private.workspace_role() returns text language sql stable as $$select case when active then 'employee' end from private.test_identity$$;
 create table public.workspace_announcements(id uuid primary key,title text,image_data text);
 create table realtime.messages(extension text);alter table realtime.messages enable row level security;
 create function realtime.topic() returns text language sql stable as $$select current_setting('test.topic',true)$$;
 grant usage on schema private,realtime to authenticated;grant select,insert on realtime.messages to authenticated;
 `);
 await db.exec(await readFile(new URL('../supabase/migrations/202610100023_dashboard_celebrations.sql',import.meta.url),'utf8'));
 const id='10000000-0000-0000-0000-000000000001';
 await db.query(`insert into public.workspace_announcements(id,title,image_data,birthday_on,images) values($1,'Birthday','data:image/webp;base64,AAAA',(now() at time zone 'Asia/Kolkata')::date,array['data:image/webp;base64,AAAA','data:image/png;base64,AAAA'])`,[id]);
 const {rows:[{day}]}=await db.query(`select birthday_on::text as day from public.workspace_announcements`);
 const allowed=async topic=>(await db.query('select private.can_join_birthday_wishes($1) as allowed',[topic])).rows[0].allowed;
 assert.equal(await allowed(`birthday-wishes:${id}:${day}`),true);
 assert.equal(await allowed(`birthday-wishes:${id}:2000-01-01`),false);
 assert.equal(await allowed(`birthday-wishes:10000000-0000-0000-0000-000000000002:${day}`),false);
 await db.query("select set_config('test.topic',$1,false)",[`birthday-wishes:${id}:${day}`]);
 await db.exec('set role authenticated;insert into realtime.messages values(\'broadcast\');reset role;');
 await db.exec('update private.test_identity set active=false;');assert.equal(await allowed(`birthday-wishes:${id}:${day}`),false);
 await db.exec('set role authenticated;');await assert.rejects(()=>db.exec("insert into realtime.messages values('broadcast')"),/row-level security/);await db.exec('reset role;');
 for(const images of [[],['https://unapproved.test/image.png'],Array(9).fill('data:image/webp;base64,AAAA'),['x'.repeat(2000001)]]){
   await assert.rejects(()=>db.query('update public.workspace_announcements set images=$1 where id=$2',[images,id]),/announcement_images_valid/);
 }
 assert.equal((await db.query("select count(*)::int n from information_schema.tables where table_schema='public' and table_name like '%wish%' ")).rows[0].n,0);
 await db.close();
});
