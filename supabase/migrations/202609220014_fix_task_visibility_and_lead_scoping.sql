-- Migration 202609220014: Fix task visibility loss and lead scoping regression
begin;

-- 1. Restore private.coordinator_lead definition to check if team has an active project coordinator
create or replace function private.coordinator_lead(uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u where u.id=uid and u.is_active
 and u.role::text in ('associate_lead','team_lead') and u.team_id is not null
 and exists(select 1 from public.profiles c where c.role::text='project_coordinator'
 and c.is_active and c.team_id=u.team_id))
$$;

-- 2. Update private.team_task_access to grant access to:
--    a) Active assigned user (e.profile_id = uid) for non-rejected assignments regardless of profile role
--    b) Production associate leads / team leads for non-rejected assignments of employees on their team
create or replace function private.team_task_access(tid uuid,uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.task_assignments a join public.employees e on e.id=a.employee_id and e.is_active
 join public.profiles u on u.id=uid and u.is_active where a.task_id=tid and a.status::text<>'rejected' and (
 (u.role::text in ('associate_lead','team_lead') and not private.coordinator_lead(uid) and u.team_id is not null and e.team_id=u.team_id)
 or e.profile_id=uid))
$$;

-- 3. Ensure team_employee_boundary RLS policy allows employees to view own record and team members
alter table public.employees enable row level security;
drop policy if exists team_employee_boundary on public.employees;
create policy team_employee_boundary on public.employees as restrictive for select to public using (
  private.role_of(auth.uid()) is not null and (
    private.role_of(auth.uid()) in ('admin', 'director', 'project_coordinator')
    or private.coordinator_lead()
    or profile_id = auth.uid()
    or (team_id is not null and team_id = (select team_id from public.profiles where id = auth.uid()))
  )
);

-- 4. Ensure project_people RPC strictly enforces team boundaries for operational leads while granting Flow Force full visibility
create or replace function public.project_people() returns table(id uuid, full_name text, role text, team_id uuid, is_active boolean)
language sql stable security definer set search_path='' as $$
 select u.id, u.full_name::text, u.role::text, u.team_id, u.is_active from public.profiles u
 where private.role_of(auth.uid()) is not null and (
   private.role_of(auth.uid()) in ('admin', 'director', 'project_coordinator') or private.coordinator_lead()
   or u.id = auth.uid()
   or (u.team_id is not null and u.team_id = (select me.team_id from public.profiles me where me.id = auth.uid()))
 ) order by u.full_name;
$$;

grant execute on function public.project_people() to authenticated;

notify pgrst, 'reload schema';
commit;
