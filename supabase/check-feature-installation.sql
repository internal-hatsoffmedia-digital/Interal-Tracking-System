-- READ ONLY: check feature objects before running a migration again.
select 'Project membership' as feature, to_regclass('public.project_members') is not null as present
union all select 'Sales Tracker', to_regclass('public.sales_leads') is not null
union all select 'Image announcements', to_regclass('public.workspace_announcements') is not null
union all select 'Task archiving', exists(select 1 from information_schema.columns where table_schema='public' and table_name='tasks' and column_name='archived_at')
union all select 'Assignment notification trigger', exists(select 1 from pg_trigger where tgrelid='public.task_assignments'::regclass and tgname='workspace_assignment_notification' and not tgisinternal);
