-- Historical one-time reset executed with user approval on 2026-10-13.
-- DO NOT run during deployment; rerunning deletes newly created data.
-- One-time live operation, run only after explicit permanent-deletion confirmation.
begin;
delete from public.performance_records where task_id is not null;
do $$ begin
 if to_regclass('public.work_timer_sessions') is not null then execute 'delete from public.work_timer_sessions';end if;
end $$;
update public.sales_leads set project_id=null where project_id is not null;
delete from public.tasks;
delete from public.projects;
commit;
