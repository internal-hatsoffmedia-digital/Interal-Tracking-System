begin;
do $$
declare status_type regtype;
begin
 select a.atttypid::regtype into status_type
 from pg_attribute a join pg_type t on t.oid=a.atttypid
 where a.attrelid='public.projects'::regclass and a.attname='status' and t.typtype='e';
 if status_type is not null then
   execute format('alter type %s add value if not exists %L',status_type,'rejected');
 end if;
end $$;

alter table public.clients add column links text[] not null default '{}';
create function private.valid_client_links(items text[]) returns boolean
language sql immutable set search_path='' as $$
 select cardinality(items)<=20 and not exists (
   select 1 from unnest(items) as link
   where link is null or length(link)>2048
     or link !~* '^https?://[^/@[:space:]?#]+([/?#][^[:space:]]*)?$'
 );
$$;
alter table public.clients add constraint clients_http_links check (private.valid_client_links(links));
notify pgrst,'reload schema';
commit;
