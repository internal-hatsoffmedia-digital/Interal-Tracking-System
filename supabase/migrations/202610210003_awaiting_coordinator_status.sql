do $$declare col record;begin
 select c.udt_schema,c.udt_name,t.typtype into col from information_schema.columns c join pg_namespace n on n.nspname=c.udt_schema join pg_type t on t.typnamespace=n.oid and t.typname=c.udt_name where c.table_schema='public' and c.table_name='projects' and c.column_name='status';
 if col.typtype='e' then execute format('alter type %I.%I add value if not exists %L',col.udt_schema,col.udt_name,'awaiting_coordinator');end if;
end $$;
notify pgrst,'reload schema';
