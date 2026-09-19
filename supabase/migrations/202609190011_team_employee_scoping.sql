-- Enforce Flow Force full employee visibility vs team-restricted employee visibility for operational teams
begin;

-- 1. Ensure project_people RPC strictly enforces team boundaries for operational leads while granting Flow Force full visibility
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

-- 2. Restrict employee table reads so Flow Force / Coordinators see all teams, while operational teams see only their own team
drop policy if exists team_employee_boundary on public.employees;
create policy team_employee_boundary on public.employees as restrictive for select to public using (
  private.role_of(auth.uid()) is not null and (
    private.role_of(auth.uid()) in ('admin', 'director', 'project_coordinator')
    or private.coordinator_lead()
    or team_id = (select team_id from public.profiles where id = auth.uid())
  )
);

notify pgrst, 'reload schema';
commit;
