begin;
create table public.member_page_access (
 profile_id uuid not null references public.profiles(id) on delete cascade,
 page text not null check(page in ('dashboard','my-work','my-team','team-pc','task-assignments','tasks','planner','projects','clients','teams','employees','team-members','performance','reports','sales','settings','timesheet','user-guide','daily-desk')),
 allowed boolean not null,
 updated_by uuid not null references public.profiles(id),
 updated_at timestamptz not null default now(),
 primary key(profile_id,page)
);
alter table public.member_page_access enable row level security;
revoke all on public.member_page_access from public,anon,authenticated;
create function private.manages_page_access() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('admin','manager','director'))
$$;
create function public.member_page_access_data() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 return jsonb_build_object('manager',private.manages_page_access(),'members',case when private.manages_page_access() then
 coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name,'role',p.role,'team',t.name,'active',p.is_active) order by p.full_name) from public.profiles p left join public.teams t on t.id=p.team_id),'[]'::jsonb) else '[]'::jsonb end,
 'rules',coalesce((select jsonb_agg(to_jsonb(a)) from public.member_page_access a where a.profile_id=auth.uid() or private.manages_page_access()),'[]'::jsonb));
end $$;
create function public.set_member_page_access(p_member uuid,p_rules jsonb) returns void language plpgsql security definer set search_path='' as $$
declare entry record;begin
 if not private.manages_page_access() then raise exception 'Leadership access required';end if;
 if not exists(select 1 from public.profiles where id=p_member) then raise exception 'Member not found';end if;
 if jsonb_typeof(p_rules)<>'object' or p_rules is null then raise exception 'Page rules must be an object';end if;
 for entry in select key,value from jsonb_each(p_rules) loop
 if entry.key not in ('dashboard','my-work','my-team','team-pc','task-assignments','tasks','planner','projects','clients','teams','employees','team-members','performance','reports','sales','settings','timesheet','user-guide','daily-desk') or jsonb_typeof(entry.value) not in ('boolean','null') then raise exception 'Invalid page rule';end if;
 if entry.value='null'::jsonb then delete from public.member_page_access where profile_id=p_member and page=entry.key;
 else insert into public.member_page_access(profile_id,page,allowed,updated_by) values(p_member,entry.key,(entry.value::text)::boolean,auth.uid()) on conflict(profile_id,page) do update set allowed=excluded.allowed,updated_by=auth.uid(),updated_at=now();end if;
 end loop;
end $$;
revoke all on function private.manages_page_access() from public,anon,authenticated;
revoke all on function public.member_page_access_data(),public.set_member_page_access(uuid,jsonb) from public,anon;
grant execute on function public.member_page_access_data(),public.set_member_page_access(uuid,jsonb) to authenticated;
create table public.daily_desk_entries (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
 work_date date not null default ((now() at time zone 'Asia/Kolkata')::date),
 kind text not null check(kind in ('todo','note')),
 content text not null check(length(trim(content)) between 1 and 10000),
 done boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.daily_desk_entries enable row level security;
create policy daily_desk_owner on public.daily_desk_entries for all to authenticated
 using(profile_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and is_active))
 with check(profile_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and is_active));
revoke all on public.daily_desk_entries from public,anon,authenticated;
grant select,insert,update,delete on public.daily_desk_entries to authenticated;
create index daily_desk_owner_day on public.daily_desk_entries(profile_id,work_date);
notify pgrst,'reload schema';
commit;
