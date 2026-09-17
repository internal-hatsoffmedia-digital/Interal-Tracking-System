-- Run and commit this migration before 002 (PostgreSQL enum additions need a commit).
do $$
declare col record; value text;
begin
  for col in
    select c.table_name, c.column_name, c.udt_schema, c.udt_name, t.typtype
    from information_schema.columns c
    join pg_namespace n on n.nspname = c.udt_schema
    join pg_type t on t.typnamespace = n.oid and t.typname = c.udt_name
    where c.table_schema = 'public' and
      ((c.table_name = 'profiles' and c.column_name = 'role') or
       (c.table_name = 'projects' and c.column_name = 'status'))
  loop
    if col.typtype = 'e' then
      foreach value in array case when col.column_name = 'role'
        then array['associate_lead','director']
        else array['planning','in_progress','on_hold','completed'] end
      loop
        execute format('alter type %I.%I add value if not exists %L', col.udt_schema, col.udt_name, value);
      end loop;
    end if;
  end loop;
end $$;
