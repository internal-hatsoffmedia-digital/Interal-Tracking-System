-- Destructive maintenance, run only with explicit approval. Never a deployment migration.
begin;
lock table public.projects, public.tasks, public.sales_leads, public.sales_activities, public.sales_targets in share row exclusive mode;
create temporary table reset_work_ids on commit drop as
select id from public.projects union select id from public.tasks
union select id from public.sales_leads
union select id from public.task_assignments union select id from public.timesheets
union select id from public.performance_records where task_id is not null;
delete from public.notifications where entity_id in (select id from reset_work_ids);
delete from public.activity_logs where entity_id in (select id from reset_work_ids);
delete from public.performance_records where task_id in (select id from public.tasks);
delete from public.sales_activities;
delete from public.sales_targets;
delete from public.sales_leads;
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
union all select 'sales_leads',count(*) from public.sales_leads
union all select 'sales_targets',count(*) from public.sales_targets
union all select 'sales_activities',count(*) from public.sales_activities
union all select 'clients_preserved',count(*) from public.clients
union all select 'users_preserved',count(*) from public.profiles;
commit;
