-- Commit enum additions before running 022. No account roles are reassigned.
do $$ declare col record; value text; begin
 for col in select c.table_name,c.column_name,c.udt_schema,c.udt_name,t.typtype
 from information_schema.columns c join pg_namespace n on n.nspname=c.udt_schema
 join pg_type t on t.typnamespace=n.oid and t.typname=c.udt_name
 where c.table_schema='public' and ((c.table_name='profiles' and c.column_name='role') or (c.table_name='teams' and c.column_name='team_type')) loop
 if col.typtype='e' then
 foreach value in array case when col.column_name='role' then array['manager'] else array['web_development','digital_marketing','project_coordination'] end loop
 execute format('alter type %I.%I add value if not exists %L',col.udt_schema,col.udt_name,value);
 end loop; end if; end loop;
end $$;
