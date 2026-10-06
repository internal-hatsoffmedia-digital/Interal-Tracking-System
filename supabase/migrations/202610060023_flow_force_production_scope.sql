begin;
alter table public.employees enable row level security;
alter table public.teams enable row level security;
create or replace function private.flow_force(uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p join public.teams t on t.id=p.team_id where p.id=uid and p.is_active and p.role::text<>'admin' and (t.team_type::text in ('flow_force','project_coordination') or lower(t.name)='flow force'))
$$;
create or replace function private.production_supervisor(uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$
 select private.flow_force(uid) and exists(select 1 from public.profiles where id=uid and is_active and role::text in ('manager','director','associate_lead'))
$$;
create or replace function private.production_team(tid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select tid is null or exists(select 1 from public.teams where id=tid and team_type::text not in ('digital_ninjas','digital_marketing','social_media') and lower(name) not in ('digital ninjas','digital marketing'))
$$;
create or replace function private.production_task(tid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.tasks t join public.projects p on p.id=t.project_id where t.id=tid and private.production_team(p.team_id) and (
 not exists(select 1 from public.task_assignments a where a.task_id=tid and a.status::text<>'rejected')
 or exists(select 1 from public.task_assignments a join public.employees e on e.id=a.employee_id where a.task_id=tid and a.status::text<>'rejected' and private.production_team(e.team_id))))
$$;
-- Retain the existing non-Flow-Force rules as a fallback, including explicit sharing.
do $$ declare source text; begin
 source:=pg_get_functiondef('private.full_project_access(uuid,uuid)'::regprocedure);
 execute replace(source,'FUNCTION private.full_project_access(', 'FUNCTION private.production_base_project_access(');
 source:=pg_get_functiondef('private.visible_worker(uuid)'::regprocedure);
 execute replace(source,'FUNCTION private.visible_worker(', 'FUNCTION private.production_base_worker_access(');
end $$;
create or replace function private.full_project_access(pid uuid,uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$
 select (private.production_base_project_access(pid,uid) or (private.production_supervisor(uid) and exists(select 1 from public.projects where id=pid)))
 and (not private.flow_force(uid) or exists(select 1 from public.projects where id=pid and private.production_team(team_id)))
$$;
create or replace function private.visible_worker(eid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select (private.production_base_worker_access(eid) or private.production_supervisor()) and (not private.flow_force() or exists(select 1 from public.employees where id=eid and private.production_team(team_id)))
$$;
do $$ declare expression text; begin
 select pg_get_expr(polqual,polrelid) into expression from pg_policy where polrelid='public.employees'::regclass and polname='team_employee_boundary';
 if expression is not null then execute format('alter policy team_employee_boundary on public.employees using ((%s) or private.production_supervisor())',expression); end if;
end $$;
create policy flow_force_worker_read on public.employees as restrictive for select to authenticated using(not private.flow_force() or private.production_team(team_id));
create policy flow_force_team_read on public.teams as restrictive for select to authenticated using(not private.flow_force() or private.production_team(id));
create policy production_team_directory on public.teams for select to authenticated using(private.role_of(auth.uid()) is not null);
create policy flow_force_project_read on public.projects as restrictive for select to authenticated using(not private.flow_force() or private.production_team(team_id));
create policy flow_force_task_read on public.tasks as restrictive for select to authenticated using(
 (not private.flow_force() or private.production_task(id)) and (private.role_of(auth.uid())<>'project_coordinator' or created_by=auth.uid() or exists(select 1 from public.task_assignments where task_id=tasks.id and assigned_by=auth.uid())));
create policy coordinator_assignment_read on public.task_assignments as restrictive for select to authenticated using(private.role_of(auth.uid())<>'project_coordinator' or assigned_by=auth.uid());
create policy flow_force_assignment_read on public.task_assignments as restrictive for select to authenticated using(not private.flow_force() or private.visible_worker(employee_id));
-- Other task-linked tables must obey the same task boundary.
create or replace function private.can_view_task(tid uuid,uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.tasks t where t.id=tid and (private.full_project_access(t.project_id,uid) or private.team_task_access(tid,uid))
 and (not private.flow_force(uid) or private.production_task(tid))
 and (private.role_of(uid)<>'project_coordinator' or t.created_by=uid or exists(select 1 from public.task_assignments a where a.task_id=tid and a.assigned_by=uid)))
$$;
revoke all on function private.flow_force(uuid),private.production_supervisor(uuid),private.production_team(uuid),private.production_task(uuid),private.production_base_project_access(uuid,uuid),private.production_base_worker_access(uuid) from public;
grant execute on function private.flow_force(uuid),private.production_supervisor(uuid),private.production_team(uuid),private.production_task(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
