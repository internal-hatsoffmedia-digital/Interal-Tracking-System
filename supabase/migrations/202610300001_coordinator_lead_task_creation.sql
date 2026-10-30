begin;
-- Add the missing permissive INSERT path without broadening legacy helpers used elsewhere.
create function private.coordinator_task_writer(pid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.profiles u join public.teams tm on tm.id=u.team_id
  join public.projects p on p.id=pid
  where u.id=auth.uid() and u.is_active and tm.is_active and p.is_active
  and u.role::text in ('associate_lead','team_lead')
  and (tm.team_type::text in ('flow_force','project_coordination') or lower(trim(tm.name)) in ('flow force','project coordinators'))
  and private.full_project_access(p.id)
 )
$$;
revoke all on function private.coordinator_task_writer(uuid) from public,anon;
grant execute on function private.coordinator_task_writer(uuid) to authenticated;
-- Resolve the parent outside table RLS to avoid tasks <-> assignments policy recursion.
create function private.coordinator_assignment_writer(tid uuid,eid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.tasks t where t.id=tid and private.coordinator_task_writer(t.project_id))
 and exists(select 1 from public.task_artist_options() w where w.id=eid)
$$;
revoke all on function private.coordinator_assignment_writer(uuid,uuid) from public,anon;
grant execute on function private.coordinator_assignment_writer(uuid,uuid) to authenticated;
create policy coordinator_lead_task_insert on public.tasks for insert to authenticated
 with check(created_by=auth.uid() and private.coordinator_task_writer(project_id));
create policy coordinator_lead_assignment_insert on public.task_assignments for insert to authenticated
 with check(assigned_by=auth.uid()
  and private.coordinator_assignment_writer(task_id,employee_id));
-- Existing restrictive project/worker policies, commitment guards and audit triggers still apply.
notify pgrst,'reload schema';
commit;
