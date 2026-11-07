begin;
-- Book first completion against the work's project date, not the day the
-- coordinator presses Completed. Keep an existing booking fixed on rework.
create or replace function private.project_sales_completion() returns trigger
language plpgsql set search_path='' as $$
declare project_day date; completion_day date:=(now() at time zone 'Asia/Kolkata')::date;
begin
 if tg_op='INSERT' then
   new.sales_completed_at:=null;
 else
   new.sales_completed_at:=old.sales_completed_at;
 end if;
 if new.status::text='completed' and new.sales_completed_at is null then
   project_day:=coalesce(
     case when new.monthly_team_project then new.billing_month end,
     new.start_date,
     (new.created_at at time zone 'Asia/Kolkata')::date,
     completion_day
   );
   -- Current/future projects retain today's booking; historical work belongs
   -- to its own month. Do not fabricate a future sale.
   new.sales_completed_at:=case
     when date_trunc('month',project_day::timestamp)<date_trunc('month',completion_day::timestamp)
       then project_day::timestamp at time zone 'Asia/Kolkata'
     else now()
   end;
 end if;
 if new.status::text='rejected' then new.rate:=null;end if;
 return new;
end $$;
notify pgrst,'reload schema';
commit;
