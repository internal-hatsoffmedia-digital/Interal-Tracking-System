begin;

create function private.associate_task_project(project_id uuid, viewer_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.profiles viewer
    join public.teams team on team.id=viewer.team_id and team.is_active
    join public.projects project on project.id=project_id and project.is_active
    where viewer.id=viewer_id and viewer.is_active and viewer.role::text='associate_lead'
      and (project.team_id=team.id or team.id=any(project.production_team_ids))
  )
$$;
revoke all on function private.associate_task_project(uuid,uuid) from public,anon;
grant execute on function private.associate_task_project(uuid,uuid) to authenticated;

create policy associate_task_project_read on public.projects for select to authenticated
  using (private.associate_task_project(id));

create or replace function public.get_active_projects_for_tasks() returns setof public.projects
language sql stable security definer set search_path='' as $$
  select p.* from public.projects p
  where p.is_active and (
    private.role_of(auth.uid()) in ('admin','director','project_coordinator','team_lead')
    or private.associate_task_project(p.id)
    or (private.coordinator_lead() and private.full_project_access(p.id))
  ) order by p.name
$$;
revoke all on function public.get_active_projects_for_tasks() from public,anon;
grant execute on function public.get_active_projects_for_tasks() to authenticated;

-- Preserve the previous assignment scope and include tasks created by their team lead.
create or replace function private.team_task_access(tid uuid, uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.task_assignments a
    join public.employees e on e.id=a.employee_id and e.is_active
    join public.profiles u on u.id=uid and u.is_active
    where a.task_id=tid and a.status::text<>'rejected'
      and (e.profile_id=uid or (u.role::text in ('associate_lead','team_lead')
        and not private.coordinator_lead(uid) and e.team_id=u.team_id))
  ) or exists (
    select 1 from public.tasks t where t.id=tid and t.created_by=uid
      and private.associate_task_project(t.project_id,uid)
  )
$$;

-- INSERT RETURNING must work before the assignment exists.
alter policy crm_visibility_boundary on public.tasks
  using (private.full_project_access(project_id) or private.team_task_access(id)
    or (created_by=auth.uid() and private.associate_task_project(project_id)))
  with check (private.full_project_access(project_id) or private.team_task_access(id)
    or (created_by=auth.uid() and private.associate_task_project(project_id)));
create policy associate_own_task_read on public.tasks for select to authenticated
  using (created_by=auth.uid() and private.associate_task_project(project_id));
create policy associate_task_create on public.tasks for insert to authenticated
  with check (created_by=auth.uid() and private.associate_task_project(project_id));

create function private.associate_task_assignment(task_id uuid, employee_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists (select 1 from public.tasks t where t.id=task_id and t.created_by=auth.uid()
    and private.associate_task_project(t.project_id))
  and exists (select 1 from public.task_artist_options() artist where artist.id=employee_id
    and artist.team_id=(select team_id from public.profiles where id=auth.uid()))
$$;
revoke all on function private.associate_task_assignment(uuid,uuid) from public,anon;
grant execute on function private.associate_task_assignment(uuid,uuid) to authenticated;
create policy associate_task_assignment_create on public.task_assignments for insert to authenticated
  with check (assigned_by=auth.uid() and private.associate_task_assignment(task_id,employee_id));

alter policy project_create on public.projects with check (
  created_by=auth.uid() and exists (
    select 1 from public.profiles viewer
    where viewer.id=auth.uid() and viewer.is_active and viewer.role::text='project_coordinator'
      and viewer.team_id=projects.team_id
  )
);
create policy coordinator_created_project_read on public.projects for select to authenticated
  using (created_by=auth.uid() and private.role_of(auth.uid())='project_coordinator');

-- Restrict creation even if a privileged application RPC inserts the row.
create function private.require_project_coordinator_on_insert() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is not null and not exists (
    select 1 from public.profiles where id=auth.uid() and is_active and role::text='project_coordinator'
  ) then
    raise exception 'Only project coordinators can create projects' using errcode='42501';
  end if;
  return new;
end
$$;
revoke all on function private.require_project_coordinator_on_insert() from public,anon,authenticated;
create trigger require_project_coordinator_on_insert before insert on public.projects
  for each row execute function private.require_project_coordinator_on_insert();
notify pgrst,'reload schema';
commit;
