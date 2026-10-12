-- Destructive maintenance, run only with explicit approval. Never a deployment migration.
begin;
lock table public.projects, public.tasks in share row exclusive mode;
create temporary table reset_work_ids on commit drop as
select id from public.projects union select id from public.tasks
union select id from public.task_assignments union select id from public.timesheets
union select id from public.performance_records where task_id is not null;
delete from public.notifications where entity_id in (select id from reset_work_ids);
delete from public.activity_logs where entity_id in (select id from reset_work_ids);
delete from public.performance_records where task_id in (select id from public.tasks);
-- Keep prospect/CRM records, disconnect their deleted projects.
update public.sales_leads set project_id = null where project_id is not null;
delete from public.timesheets;
delete from public.task_assignments;
delete from public.tasks;
delete from public.projects;
-- Cascades remove assignments, timesheets, project sharing/activity/notifications.
select 'projects' as table_name,count(*) as remaining from public.projects
union all select 'tasks',count(*) from public.tasks
union all select 'assignments',count(*) from public.task_assignments
union all select 'timesheets',count(*) from public.timesheets
union all select 'project_activity',count(*) from public.project_activity
union all select 'clients_preserved',count(*) from public.clients
union all select 'users_preserved',count(*) from public.profiles;
commit;
