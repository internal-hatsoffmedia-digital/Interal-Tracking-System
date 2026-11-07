import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('late completion books the project month and preserves it through rework',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create schema private;
 create table projects(id int primary key,status text,rate numeric,sales_completed_at timestamptz,monthly_team_project boolean,billing_month date,start_date date,created_at timestamptz default now());
 create function private.project_sales_completion() returns trigger language plpgsql as $$begin return new;end$$;
 create trigger sales before insert or update on projects for each row execute function private.project_sales_completion();`);
 await db.exec(await readFile(new URL('../supabase/migrations/202611070001_project_month_sales.sql',import.meta.url),'utf8'));
 await db.exec(`insert into projects values
 (1,'in_progress',1000,null,false,null,'2020-10-20',now()),
 (2,'in_progress',2000,null,true,'2020-09-01','2020-10-01',now()),
 (3,'in_progress',3000,null,false,null,null,'2020-08-31T20:00:00Z'),
 (4,'in_progress',4000,null,false,null,(now() at time zone 'Asia/Kolkata')::date,now()),
 (5,'in_progress',5000,null,false,null,'2099-12-01',now());
 update projects set status='completed';`);
 const rows=(await db.query("select id,to_char(sales_completed_at at time zone 'Asia/Kolkata','YYYY-MM') as booking_month from projects order by id")).rows;
 assert.equal(rows[0].booking_month,'2020-10');assert.equal(rows[1].booking_month,'2020-09');assert.equal(rows[2].booking_month,'2020-09');
 const current=(await db.query("select to_char(now() at time zone 'Asia/Kolkata','YYYY-MM') as booking_month")).rows[0].booking_month;
 assert.equal(rows[3].booking_month,current);assert.equal(rows[4].booking_month,current);
 await db.exec("update projects set status='in_progress',start_date='2021-01-01',sales_completed_at=now() where id=1;update projects set status='completed' where id=1");
 assert.equal((await db.query("select to_char(sales_completed_at at time zone 'Asia/Kolkata','YYYY-MM') as booking_month from projects where id=1")).rows[0].booking_month,'2020-10');
 await db.exec("update projects set status='rejected' where id=1");
 assert.equal((await db.query('select rate from projects where id=1')).rows[0].rate,null);
 }finally{await db.close();}
});
