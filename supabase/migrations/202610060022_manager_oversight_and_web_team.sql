begin;
-- Manager inherits Director oversight through the existing checked read boundary.
-- Keep administrator-only provisioning, account mutation and deletion unchanged.
create or replace function private.role_of(uid uuid) returns text language sql stable security definer set search_path='' as $$
 select case when p.role::text='manager' then 'director' else p.role::text end
 from public.profiles p where p.id=uid and p.is_active
$$;
do $$ declare f record; source text; begin
 for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='private' and p.proname in ('full_project_access','can_view_project','can_view_task','visible_worker'))
 or (n.nspname='public' and p.proname='admin_set_access') loop
 source:=pg_get_functiondef(f.oid);
 source:=regexp_replace(source,'''director''([[:space:]]*,|[[:space:]]*\))','''director'',''manager''\1','g');
 execute source;
 end loop;
end $$;
create or replace function public.team_pc_workers() returns table(id uuid,full_name text,team_id uuid,is_active boolean,team_type text)
language sql stable security definer set search_path='' as $$
 select e.id,e.full_name::text,e.team_id,e.is_active,t.team_type::text from public.employees e left join public.teams t on t.id=e.team_id
 where private.role_of(auth.uid()) in ('admin','director','associate_lead','team_lead') and private.visible_worker(e.id)
 order by e.full_name,e.id
$$;
-- Reuse any existing web team. Never move staff or project records by name.
insert into public.teams(name,team_type,description,is_active)
select 'Web Crafters','web_development','Website development, deployment and maintenance',true
where not exists(select 1 from public.teams where team_type::text='web_development' or lower(name) like '%web%' or lower(name) like '%warrior%');
update public.teams set name='Web Crafters',team_type='web_development',description='Website development, deployment and maintenance'
where lower(name) like '%web%' or lower(name) like '%warrior%';
update public.teams set team_type='digital_marketing',description='Digital marketing, social media and campaign management' where lower(name)='digital ninjas';
notify pgrst,'reload schema';
commit;
