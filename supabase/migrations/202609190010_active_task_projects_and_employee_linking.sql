-- Fix active project dropdown for task creation & auto-link unlinked employee profiles
begin;

-- 1. Create RPC function for loading active projects in task creation modals
create or replace function public.get_active_projects_for_tasks()
returns setof public.projects
language sql stable security definer set search_path = '' as $$
  select * from public.projects
  where is_active = true
    and private.role_of(auth.uid()) in ('admin', 'director', 'project_coordinator', 'associate_lead', 'team_lead')
  order by name asc;
$$;

grant execute on function public.get_active_projects_for_tasks() to authenticated;

-- 2. Function & trigger to automatically link profiles and employees by email / full_name
create or replace function private.auto_link_employee_profile()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Link employee to profile by email or full_name match
  update public.employees e
  set profile_id = new.id
  where e.profile_id is null
    and (
      (new.email is not null and lower(trim(e.email)) = lower(trim(new.email)))
      or (new.full_name is not null and lower(trim(e.full_name)) = lower(trim(new.full_name)))
    );

  -- Also sync profile team_id if missing from profile
  update public.profiles p
  set team_id = e.team_id
  from public.employees e
  where p.id = new.id
    and p.team_id is null
    and e.profile_id = p.id;

  return new;
end $$;

drop trigger if exists trg_auto_link_employee_profile on public.profiles;
create trigger trg_auto_link_employee_profile
  after insert or update on public.profiles
  for each row execute function private.auto_link_employee_profile();

-- 3. Execute immediate backfill to fix all currently unlinked employees (e.g., Kesavan)
update public.employees e
set profile_id = p.id
from public.profiles p
where e.profile_id is null
  and (
    (p.email is not null and lower(trim(e.email)) = lower(trim(p.email)))
    or (p.full_name is not null and lower(trim(e.full_name)) = lower(trim(p.full_name)))
  );

update public.profiles p
set team_id = e.team_id
from public.employees e
where p.team_id is null
  and e.profile_id = p.id;

notify pgrst, 'reload schema';
commit;
