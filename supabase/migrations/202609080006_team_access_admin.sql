-- Requires migrations 001 through 005. Run once. No names are used as account identifiers.
begin;
create function private.coordinator_lead(uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u where u.id=uid and u.is_active and u.role::text='associate_lead' and u.team_id is not null and exists(select 1 from public.profiles c where c.role::text='project_coordinator' and c.is_active and c.team_id=u.team_id))
$$;
create function private.full_project_access(pid uuid,uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.projects p join public.profiles u on u.id=uid and u.is_active where p.id=pid and (
 u.role::text in ('admin','director')
 or (private.coordinator_lead(uid) and p.team_id=u.team_id)
 or (u.role::text='team_lead' and p.associate_assigned and p.team_id=u.team_id)
 or (u.role::text in ('project_coordinator','team_lead') and exists(select 1 from public.project_members m where m.project_id=pid and m.profile_id=uid))))
$$;
create function private.team_task_access(tid uuid,uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.task_assignments a join public.employees e on e.id=a.employee_id and e.is_active join public.profiles u on u.id=uid and u.is_active where a.task_id=tid and a.status::text<>'rejected' and (
 (u.role::text='associate_lead' and not private.coordinator_lead(uid) and u.team_id is not null and e.team_id=u.team_id)
 or (u.role::text='employee' and e.profile_id=uid)))
$$;
create function private.can_view_task(tid uuid,uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.tasks t where t.id=tid and (private.full_project_access(t.project_id,uid) or private.team_task_access(tid,uid)))
$$;
create or replace function private.can_view_project(pid uuid,uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$
 select private.full_project_access(pid,uid) or exists(select 1 from public.tasks t where t.project_id=pid and private.team_task_access(t.id,uid))
$$;
create or replace function private.can_manage_project(pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.projects p join public.profiles u on u.id=auth.uid() and u.is_active where p.id=pid and (u.role::text='admin' or (private.coordinator_lead() and p.team_id=u.team_id)))
$$;
create or replace function private.can_edit_project(pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.can_manage_project(pid) or (private.role_of(auth.uid())='project_coordinator' and private.full_project_access(pid))
$$;
create or replace function private.is_manager() returns boolean language sql stable security definer set search_path='' as $$
 select private.role_of(auth.uid())='admin' or private.coordinator_lead()
$$;
-- Preserve INSERT RETURNING support without granting production leads project ownership.
drop policy project_read on public.projects;
create policy project_read on public.projects for select to authenticated using (
 private.role_of(auth.uid()) in ('admin','director') or
 (private.coordinator_lead() and team_id=(select team_id from public.profiles where id=auth.uid())) or private.can_view_project(id));

create function private.visible_worker(eid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.employees e join public.profiles u on u.id=auth.uid() and u.is_active where e.id=eid and (
 u.role::text in ('admin','director','project_coordinator','team_lead') or private.coordinator_lead() or
 (u.role::text='associate_lead' and u.team_id=e.team_id) or (u.role::text='employee' and e.profile_id=u.id)))
$$;
-- Replace broad parent-project boundaries with task and worker-level boundaries.
do $$ declare r record;expr text;begin
 for r in select table_name,bool_or(column_name='project_id') direct,bool_or(column_name='task_id') via_task,bool_or(column_name='employee_id') worker
 from information_schema.columns where table_schema='public' and table_name in (
 select tablename from pg_policies where schemaname='public' and policyname='crm_visibility_boundary') group by table_name loop
  expr:=case when r.table_name='tasks' then '(private.full_project_access(project_id) or private.team_task_access(id))' when r.via_task then 'private.can_view_task(task_id)' else 'private.full_project_access(project_id)' end;
  if r.worker then expr:='('||expr||' and private.visible_worker(employee_id))';end if;
  if r.table_name='performance_records' then expr:='('||expr||' or (task_id is null and private.visible_worker(employee_id) and (private.role_of(auth.uid()) in (''admin'',''director'',''employee'') or (private.role_of(auth.uid())=''associate_lead'' and employee_id in (select id from public.employees where team_id=(select team_id from public.profiles where id=auth.uid()))))))';end if;
  execute format('drop policy crm_visibility_boundary on public.%I',r.table_name);
  execute format('drop policy crm_related_read on public.%I',r.table_name);
  execute format('create policy crm_visibility_boundary on public.%I as restrictive for all to public using (%s) with check (%s)',r.table_name,expr,expr);
  execute format('create policy crm_related_read on public.%I for select to authenticated using (%s)',r.table_name,expr);
 end loop;
end $$;
-- Context access to a project must not reveal its other teams' detailed activity.
create policy team_project_activity_boundary on public.project_activity as restrictive for select to public using(private.full_project_access(project_id));
create policy team_project_members_boundary on public.project_members as restrictive for select to public using(private.full_project_access(project_id));
drop policy crm_activity_boundary on public.activity_logs;
create policy crm_activity_boundary on public.activity_logs as restrictive for select to public using(
 case when entity_type in ('project','projects') then private.full_project_access(entity_id)
 when entity_type in ('task','tasks') then private.can_view_task(entity_id)
 else private.role_of(auth.uid())='admin' or (private.role_of(auth.uid()) is not null and actor_id=auth.uid()) end);
drop policy crm_existing_notification_boundary on public.notifications;
create policy crm_existing_notification_boundary on public.notifications as restrictive for select to public using(user_id=auth.uid() and private.role_of(auth.uid()) is not null and
 case when entity_type in ('task','tasks') then private.can_view_task(entity_id) when entity_type in ('project','projects') then private.can_view_project(entity_id) else true end);
-- Employee directory queries used by assignment controls are also team-scoped for production leads.
create policy team_employee_boundary on public.employees as restrictive for select to public using(
 private.role_of(auth.uid()) is not null and (private.role_of(auth.uid())<>'associate_lead' or private.coordinator_lead() or team_id=(select team_id from public.profiles where id=auth.uid())));

create table public.admin_access_history(id uuid primary key default gen_random_uuid(),actor_id uuid not null references public.profiles(id),account_id uuid not null references public.profiles(id),before_access jsonb not null,after_access jsonb not null,created_at timestamptz not null default now());
alter table public.admin_access_history enable row level security;
revoke all on public.admin_access_history from anon,authenticated;
grant select on public.admin_access_history to authenticated;
create policy access_history_admin on public.admin_access_history for select to authenticated using(private.role_of(auth.uid())='admin');
create function public.admin_access_directory() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if private.role_of(auth.uid()) is distinct from 'admin' then raise exception 'Administrator access required';end if;
 return jsonb_build_object('accounts',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'full_name',p.full_name,'email',p.email,'role',p.role::text,'team_id',p.team_id,'is_active',p.is_active,'sales_access',s.access_level) order by p.full_name),'[]') from public.profiles p left join public.sales_permissions s on s.profile_id=p.id),
 'teams',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name) order by name),'[]') from public.teams where is_active));
end $$;
create function public.admin_set_access(p_account uuid,p_role text,p_team uuid,p_sales text,p_expected jsonb) returns void language plpgsql security definer set search_path='' as $$
declare old_access jsonb;new_access jsonb;old_role text;begin
 if private.role_of(auth.uid()) is distinct from 'admin' then raise exception 'Administrator access required';end if;
 if p_role not in ('admin','director','team_lead','associate_lead','project_coordinator','employee') or p_role is null then raise exception 'Invalid role';end if;
 if p_sales is not null and p_sales not in ('viewer','member','manager') then raise exception 'Invalid Sales permission';end if;
 perform 1 from public.profiles where id=p_account for update;if not found then raise exception 'Account not found';end if;
 if p_account=auth.uid() and p_role<>'admin' then raise exception 'You cannot remove your own administrator role';end if;
 if p_team is null and p_role in ('associate_lead','project_coordinator','team_lead','employee') then raise exception 'Select a team for this role';end if;
 if p_team is not null and not exists(select 1 from public.teams where id=p_team and is_active) then raise exception 'Select an active team';end if;
 select jsonb_build_object('role',p.role::text,'team_id',p.team_id,'sales_access',s.access_level),p.role::text into old_access,old_role from public.profiles p left join public.sales_permissions s on s.profile_id=p.id where p.id=p_account;
 if p_expected is distinct from old_access then raise exception 'Access changed since you opened this account. Refresh and review again';end if;
 -- The role column is an enum in the supplied schema; use its actual type safely.
 execute format('update public.profiles set role=%L,team_id=%L where id=%L',p_role,p_team,p_account);
 update public.employees set team_id=p_team where profile_id=p_account;
 perform public.sales_grant_access(p_account,case when p_role='admin' then null else p_sales end);
 new_access:=jsonb_build_object('role',p_role,'team_id',p_team,'sales_access',case when p_role='admin' then null else p_sales end);
 if old_access is distinct from new_access then insert into public.admin_access_history(actor_id,account_id,before_access,after_access) values(auth.uid(),p_account,old_access,new_access);end if;
end $$;
revoke all on function public.admin_access_directory(),public.admin_set_access(uuid,text,uuid,text,jsonb) from public,anon;
grant execute on function public.admin_access_directory(),public.admin_set_access(uuid,text,uuid,text,jsonb) to authenticated;
revoke all on function private.coordinator_lead(uuid),private.full_project_access(uuid,uuid),private.team_task_access(uuid,uuid),private.can_view_task(uuid,uuid),private.visible_worker(uuid) from public;
grant execute on function private.coordinator_lead(uuid),private.full_project_access(uuid,uuid),private.team_task_access(uuid,uuid),private.can_view_task(uuid,uuid),private.visible_worker(uuid) to authenticated;
create function public.workspace_access_context() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('can_manage_projects',coalesce(private.is_manager(),false),'coordinator_lead',private.coordinator_lead())
$$;
revoke all on function public.workspace_access_context() from public,anon;
grant execute on function public.workspace_access_context() to authenticated;
create function private.team_identity_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and private.role_of(auth.uid()) is distinct from 'admin' and new.team_id is distinct from old.team_id then raise exception 'Only administrators can change employee teams';end if;
 return new;
end $$;
create trigger team_identity_guard before update on public.employees for each row execute function private.team_identity_guard();
create function private.task_parent_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and (new.id is distinct from old.id or new.project_id is distinct from old.project_id) and not (private.can_edit_project(old.project_id) and private.can_edit_project(new.project_id)) then raise exception 'Only project managers can move tasks between projects';end if;
 return new;
end $$;
create trigger task_parent_guard before update on public.tasks for each row execute function private.task_parent_guard();
revoke all on function private.team_identity_guard(),private.task_parent_guard() from public;
notify pgrst,'reload schema';
commit;
