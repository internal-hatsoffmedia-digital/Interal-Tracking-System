-- Flow Force team leads share the coordinator-team associate lead workflow.
-- No employee identities or production team memberships are changed here.
begin;
create or replace function private.coordinator_lead(uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u where u.id=uid and u.is_active
 and u.role::text in ('associate_lead','team_lead') and u.team_id is not null
 and exists(select 1 from public.profiles c where c.role::text='project_coordinator'
 and c.is_active and c.team_id=u.team_id))
$$;
create or replace function private.full_project_access(pid uuid,uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.projects p join public.profiles u on u.id=uid and u.is_active where p.id=pid and (
 u.role::text in ('admin','director')
 or (private.coordinator_lead(uid) and p.team_id=u.team_id)
 or (u.role::text='project_coordinator' and exists(select 1 from public.project_members m where m.project_id=pid and m.profile_id=uid))))
$$;
create or replace function private.team_task_access(tid uuid,uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.task_assignments a join public.employees e on e.id=a.employee_id and e.is_active
 join public.profiles u on u.id=uid and u.is_active where a.task_id=tid and a.status::text<>'rejected' and (
 (u.role::text in ('associate_lead','team_lead') and not private.coordinator_lead(uid) and u.team_id is not null and e.team_id=u.team_id)
 or (u.role::text='employee' and e.profile_id=uid)))
$$;
create or replace function private.visible_worker(eid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.employees e join public.profiles u on u.id=auth.uid() and u.is_active where e.id=eid and (
 u.role::text in ('admin','director','project_coordinator') or private.coordinator_lead()
 or (u.role::text in ('associate_lead','team_lead') and u.team_id=e.team_id)
 or (u.role::text='employee' and e.profile_id=u.id)))
$$;
drop policy team_employee_boundary on public.employees;
create policy team_employee_boundary on public.employees as restrictive for select to public using(
 private.role_of(auth.uid()) is not null and (private.role_of(auth.uid()) not in ('associate_lead','team_lead')
 or private.coordinator_lead() or team_id=(select team_id from public.profiles where id=auth.uid())));
-- The directory must include coordinators before their first project assignment.
create or replace function public.project_people() returns table(id uuid,full_name text,role text,team_id uuid,is_active boolean)
language sql stable security definer set search_path='' as $$
 select u.id,u.full_name::text,u.role::text,u.team_id,u.is_active from public.profiles u
 where private.role_of(auth.uid()) is not null and (
 private.role_of(auth.uid())='admin' or u.id=auth.uid()
 or (private.coordinator_lead() and u.team_id=(select me.team_id from public.profiles me where me.id=auth.uid()))
 or exists(select 1 from public.project_members m where m.profile_id=u.id and private.can_view_project(m.project_id))
 or exists(select 1 from public.projects p where private.can_view_project(p.id) and u.id in (p.created_by,p.assigned_by))
 or exists(select 1 from public.project_activity a where a.actor_id=u.id and private.can_view_project(a.project_id))
 ) order by u.full_name
$$;
notify pgrst,'reload schema';
commit;
