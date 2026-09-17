-- READ ONLY. Run in Supabase SQL Editor and share the single JSON result.
-- No data, role, policy, or schema changes are made. No customer records are exported.
select jsonb_pretty(jsonb_build_object(
  'columns', (select jsonb_agg(to_jsonb(c)) from (
    select table_name,column_name,data_type,udt_name,is_nullable,column_default
    from information_schema.columns where table_schema='public' order by table_name,ordinal_position
  ) c),
  'constraints', (select jsonb_agg(to_jsonb(c)) from (
    select r.relname as table_name,c.conname,c.contype,pg_get_constraintdef(c.oid) as definition
    from pg_constraint c join pg_class r on r.oid=c.conrelid
    join pg_namespace n on n.oid=r.relnamespace where n.nspname='public' order by r.relname,c.conname
  ) c),
  'policies', (select jsonb_agg(to_jsonb(p)) from (
    select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
    from pg_policies where schemaname in ('public','storage') order by schemaname,tablename,policyname
  ) p),
  'rls', (select jsonb_agg(to_jsonb(t)) from (
    select c.relname as table_name,c.relrowsecurity,c.relforcerowsecurity
    from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'
  ) t),
  'enums', (select jsonb_agg(to_jsonb(e)) from (
    select t.typname,e.enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid
    join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' order by t.typname,e.enumsortorder
  ) e),
  'views', (select jsonb_agg(to_jsonb(v)) from (
    select c.relname,c.relkind,c.reloptions,pg_get_viewdef(c.oid,true) as definition
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('v','m')
  ) v)
)) as schema_inventory;
