-- Read-only inventory: run on staging / live before planning deployment.
select table_name,column_name,data_type,udt_name from information_schema.columns
where table_schema='public' and table_name in ('profiles','projects','employees','tasks','task_assignments','timesheets')
order by table_name,ordinal_position;
select c.conrelid::regclass as table_name,c.conname,pg_get_constraintdef(c.oid) as definition
from pg_constraint c where c.conrelid in ('public.profiles'::regclass,'public.projects'::regclass);
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies where schemaname in ('public','storage') order by schemaname,tablename,policyname;
select id,full_name,role,team_id,is_active from public.profiles order by full_name;
select p.id,p.name,p.lead_employee_id,e.profile_id,e.team_id
from public.projects p left join public.employees e on e.id=p.lead_employee_id
where e.profile_id is null or e.team_id is null;
-- Review all exposed SECURITY DEFINER functions; these can bypass RLS independently.
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef,p.proconfig,pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prokind='f' and p.prosecdef;
-- Views must be security_invoker or independently protected; table RLS alone is insufficient.
select n.nspname,c.relname,c.relkind,c.reloptions,pg_get_viewdef(c.oid,true) as definition
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('v','m');
-- Inventory potential project-linked tables with nonstandard foreign-key paths.
select c.conrelid::regclass as child,c.confrelid::regclass as parent,pg_get_constraintdef(c.oid)
from pg_constraint c where c.contype='f' and c.confrelid in ('public.projects'::regclass,'public.tasks'::regclass);
-- If Supabase Storage is used, run separately and review public buckets/object path rules:
-- select id,name,public from storage.buckets;
