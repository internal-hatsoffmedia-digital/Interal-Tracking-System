begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- These source tables/columns are established by the application. Fail atomically on drift.
do $$ begin
  perform id, role, team_id, is_active from public.profiles limit 0;
  perform id, profile_id from public.employees limit 0;
  perform id, lead_employee_id, created_by, status, completed_assets from public.projects limit 0;
  perform id, project_id from public.tasks limit 0;
  perform task_id, employee_id from public.task_assignments limit 0;
  perform task_id, employee_id from public.timesheets limit 0;
end $$;

alter table public.projects add column if not exists team_id uuid references public.teams(id);
alter table public.projects add column if not exists assigned_by uuid references public.profiles(id);
alter table public.projects add column if not exists assigned_at timestamptz;
-- Sticky provenance: remains true after subsequent reassignment, so leads retain oversight.
alter table public.projects add column if not exists associate_assigned boolean not null default false;

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  access_kind text not null check (access_kind in ('assignee','shared')),
  granted_by uuid references public.profiles(id),
  granted_at timestamptz,
  primary key (project_id, profile_id, access_kind)
);
create index project_members_user on public.project_members(profile_id, project_id);
create index projects_team on public.projects(team_id);
create index projects_assigner on public.projects(assigned_by);
create index projects_deadline on public.projects(target_deadline);

create table public.project_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index project_activity_project on public.project_activity(project_id, created_at desc);
create table public.project_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.project_activity(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id),
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique(event_id, recipient_id)
);
create index project_notifications_recipient on public.project_notifications(recipient_id, created_at desc);

-- Backfill only the explicit legacy project lead relationship. Creator is not assigner.
insert into public.project_members(project_id, profile_id, access_kind)
select p.id, e.profile_id, 'assignee' from public.projects p
join public.employees e on e.id = p.lead_employee_id
join public.profiles u on u.id = e.profile_id on conflict do nothing;
update public.projects p set team_id = e.team_id from public.employees e
where p.lead_employee_id = e.id and p.team_id is null;

create function private.role_of(uid uuid) returns text language sql stable security definer set search_path = '' as $$
  select role::text from public.profiles where id = uid and is_active = true
$$;
create function private.is_manager() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(private.role_of(auth.uid()) in ('admin','associate_lead'), false)
$$;
create function private.can_view_project(pid uuid, uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projects p join public.profiles u on u.id = uid and u.is_active
    where p.id = pid and (
      u.role::text in ('admin','director')
      or (u.role::text = 'associate_lead' and u.team_id is not null and p.team_id = u.team_id)
      or (u.role::text = 'team_lead' and p.associate_assigned and u.team_id is not null and p.team_id = u.team_id)
      or exists (select 1 from public.project_members m where m.project_id = p.id and m.profile_id = uid)
      -- Existing production employees keep access through their current task assignments.
      or (u.role::text = 'employee' and exists (
        select 1 from public.task_assignments a join public.tasks t on t.id = a.task_id
        join public.employees e on e.id = a.employee_id
        where t.project_id = p.id and e.profile_id = uid and a.status::text <> 'rejected'))
    )
  )
$$;
create function private.can_manage_project(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_manager() and private.can_view_project(pid)
$$;
create function private.can_edit_project(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.can_view_project(pid) and private.role_of(auth.uid()) in ('admin','associate_lead','project_coordinator')
$$;
create function private.task_project(tid uuid) returns uuid language sql stable security definer set search_path = '' as $$
  select project_id from public.tasks where id = tid
$$;
create function private.initial_assignee(eid uuid, tid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select u.id from public.employees e join public.profiles u on u.id=e.profile_id
  where e.id=eid and u.is_active and private.is_manager() and
    (private.role_of(auth.uid())='admin' or u.team_id=tid)
$$;

-- Replace project policies; a broad legacy coordinator policy must not survive.
do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='projects' loop
    execute format('drop policy %I on public.projects', r.policyname);
  end loop;
end $$;
alter table public.projects enable row level security;
-- Evaluate the new row's team directly for INSERT ... RETURNING; a stable helper query
-- cannot see that row in its statement snapshot yet.
create policy project_read on public.projects for select to authenticated using (
  private.role_of(auth.uid()) in ('admin','director') or
  (private.role_of(auth.uid())='associate_lead' and team_id=(select team_id from public.profiles where id=auth.uid())) or
  private.can_view_project(id)
);
create policy project_create on public.projects for insert to authenticated with check (
  private.is_manager() and created_by = auth.uid() and
  (private.role_of(auth.uid()) = 'admin' or team_id = (select team_id from public.profiles where id = auth.uid()))
);
create policy project_update on public.projects for update to authenticated
using (private.can_edit_project(id)) with check (private.can_edit_project(id));
create policy project_delete on public.projects for delete to authenticated using (private.role_of(auth.uid()) = 'admin');
grant select, insert, update, delete on public.projects to authenticated;

alter table public.project_members enable row level security;
alter table public.project_activity enable row level security;
alter table public.project_notifications enable row level security;
create policy members_read on public.project_members for select to authenticated using (private.can_view_project(project_id));
create policy activity_read on public.project_activity for select to authenticated using (private.can_view_project(project_id));
create policy notifications_read on public.project_notifications for select to authenticated
using (recipient_id = auth.uid() and private.can_view_project(project_id));
grant select on public.project_members, public.project_activity, public.project_notifications to authenticated;
revoke insert, update, delete on public.project_members, public.project_activity, public.project_notifications from anon, authenticated;

-- A restrictive boundary intersects existing writes, preserving narrower production permissions.
-- The explicit SELECT policy allows directors/associate leads to read related records.
do $$ declare r record; expression text; begin
  for r in select c.table_name,
      bool_or(c.column_name='project_id') as direct,
      bool_or(c.column_name='task_id') as via_task
    from information_schema.columns c join information_schema.tables t
      on t.table_schema=c.table_schema and t.table_name=c.table_name and t.table_type='BASE TABLE'
    where c.table_schema='public' and c.table_name not in ('projects','project_members','project_activity','project_notifications','sales_leads','sales_activities','sales_targets','sales_permissions')
    group by c.table_name having bool_or(c.column_name in ('project_id','task_id'))
  loop
    expression := case when r.direct then 'private.can_view_project(project_id)'
      else 'private.can_view_project(private.task_project(task_id))' end;
    if r.table_name='performance_records' then
      expression := '(private.can_view_project(private.task_project(task_id)) or (task_id is null and (private.role_of(auth.uid()) in (''admin'',''director'') or (private.role_of(auth.uid()) is not null and employee_id in (select id from public.employees where profile_id=auth.uid())))))';
    end if;
    execute format('alter table public.%I enable row level security', r.table_name);
    execute format('create policy crm_visibility_boundary on public.%I as restrictive for all to public using (%s) with check (%s)',r.table_name,expression,expression);
    execute format('create policy crm_related_read on public.%I for select to authenticated using (%s)',r.table_name,expression);
    -- Viewing alone cannot authorize writes by directors or leads through a legacy permissive policy.
    execute format('create policy crm_write_boundary on public.%I as restrictive for insert to public with check (private.role_of(auth.uid()) in (''admin'',''associate_lead'',''project_coordinator'',''employee''))',r.table_name);
    execute format('create policy crm_update_boundary on public.%I as restrictive for update to public using (private.role_of(auth.uid()) in (''admin'',''associate_lead'',''project_coordinator'',''employee'')) with check (private.role_of(auth.uid()) in (''admin'',''associate_lead'',''project_coordinator'',''employee''))',r.table_name);
    execute format('create policy crm_delete_boundary on public.%I as restrictive for delete to public using (private.role_of(auth.uid()) in (''admin'',''associate_lead'',''project_coordinator''))',r.table_name);
  end loop;
end $$;

-- The supplied schema also has polymorphic project/task references, not project_id columns.
alter table public.activity_logs enable row level security;
create policy crm_activity_boundary on public.activity_logs as restrictive for select to public using (
  case when entity_type in ('project','projects') then private.can_view_project(entity_id)
       when entity_type in ('task','tasks') then private.can_view_project(private.task_project(entity_id))
       else private.role_of(auth.uid())='admin' or (private.role_of(auth.uid()) is not null and actor_id=auth.uid()) end
);
alter table public.notifications enable row level security;
create policy crm_existing_notification_boundary on public.notifications as restrictive for select to public using (
  user_id=auth.uid() and private.role_of(auth.uid()) is not null and
  case when entity_type in ('project','projects') then private.can_view_project(entity_id)
       when entity_type in ('task','tasks') then private.can_view_project(private.task_project(entity_id))
       else true end
);

-- Guard trusted identity fields even if an old profile UPDATE policy is overly broad.
create function private.guard_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and private.role_of(auth.uid()) is distinct from 'admin' then
    if TG_OP='INSERT' then
      if new.id <> auth.uid() or new.role::text <> 'employee' or new.team_id is not null then
        raise exception 'Only administrators can provision roles and teams';
      end if;
    elsif new.id is distinct from old.id or new.role is distinct from old.role
       or new.team_id is distinct from old.team_id or new.is_active is distinct from old.is_active then
      raise exception 'Only administrators can change account access';
    end if;
  end if;
  return new;
end $$;
create trigger crm_guard_profile before insert or update on public.profiles for each row execute function private.guard_profile();
alter table public.profiles enable row level security;
create policy crm_profile_write on public.profiles as restrictive for update to public
using (id=auth.uid() or private.role_of(auth.uid())='admin') with check (id=auth.uid() or private.role_of(auth.uid())='admin');
create policy crm_profile_delete on public.profiles as restrictive for delete to public using (private.role_of(auth.uid())='admin');
create policy crm_profile_admin_read on public.profiles for select to authenticated using (private.role_of(auth.uid())='admin' or id=auth.uid());
create policy crm_profile_admin_update on public.profiles for update to authenticated
using (private.role_of(auth.uid())='admin') with check (private.role_of(auth.uid())='admin');
-- Employee profile mappings are also identity data: prevent impersonating another assignee.
create function private.guard_employee() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and private.role_of(auth.uid()) is distinct from 'admin' and
    (TG_OP='INSERT' or new.profile_id is distinct from old.profile_id) then
    raise exception 'Only administrators can map employee accounts';
  end if;
  return new;
end $$;
create trigger crm_guard_employee before insert or update on public.employees for each row execute function private.guard_employee();
revoke insert, update, delete on public.profiles, public.employees from public, anon;

create function private.guard_project() returns trigger language plpgsql security invoker set search_path = '' as $$
declare initial_profile uuid;
begin
  if TG_OP='INSERT' then
    if auth.uid() is not null then
      new.created_by := auth.uid();
      new.assigned_by := null; new.assigned_at := null; new.associate_assigned := false;
      if new.team_id is null then select team_id into new.team_id from public.profiles where id=auth.uid(); end if;
      if new.lead_employee_id is not null then
        initial_profile := private.initial_assignee(new.lead_employee_id,new.team_id);
        if initial_profile is null then raise exception 'Choose an active project lead in the project team'; end if;
        new.assigned_by := auth.uid(); new.assigned_at := now();
        new.associate_assigned := private.role_of(auth.uid())='associate_lead';
      end if;
    end if;
  elsif auth.uid() is not null then
    if new.id is distinct from old.id or new.created_by is distinct from old.created_by or
       new.team_id is distinct from old.team_id or new.assigned_by is distinct from old.assigned_by or
       new.assigned_at is distinct from old.assigned_at or new.associate_assigned is distinct from old.associate_assigned then
      -- Trusted assignment RPC runs as table owner; still validates the authenticated caller itself.
      if current_user <> (select pg_catalog.pg_get_userbyid(relowner) from pg_catalog.pg_class where oid='public.projects'::regclass) then
        raise exception 'Assignment metadata must be changed through the assignment workflow';
      end if;
    end if;
    if new.lead_employee_id is distinct from old.lead_employee_id and
       current_user <> (select pg_catalog.pg_get_userbyid(relowner) from pg_catalog.pg_class where oid='public.projects'::regclass) then
      raise exception 'Use the assignment workflow to change project assignees';
    end if;
    if new.is_active is distinct from old.is_active and not private.can_manage_project(old.id) then
      raise exception 'Only administrators and Associate Leads can archive projects';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger crm_guard_project before insert or update on public.projects for each row execute function private.guard_project();

create function private.record_event(pid uuid, action_name text, payload jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare eid uuid;
begin
  insert into public.project_activity(project_id,actor_id,action,details)
  values(pid,auth.uid(),action_name,payload) returning id into eid;
  insert into public.project_notifications(event_id,project_id,recipient_id,message)
  select eid,pid,u.id,action_name || ': ' || (select name from public.projects where id=pid) from public.profiles u
  where u.is_active and u.id is distinct from auth.uid() and private.can_view_project(pid,u.id)
    and (u.role::text in ('admin','director','associate_lead','team_lead') or exists (
      select 1 from public.project_members m where m.project_id=pid and m.profile_id=u.id))
  on conflict do nothing;
end $$;

create function public.set_project_access(p_project_id uuid, p_assignees uuid[], p_shared uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare previous_assignees uuid[]; previous_shared uuid[]; next_assignees uuid[]; next_shared uuid[]; team uuid;
begin
  select team_id into team from public.projects where id=p_project_id for update;
  if not coalesce(private.can_manage_project(p_project_id),false) then raise exception 'Project assignment is not authorized'; end if;
  select coalesce(array_agg(distinct x order by x),'{}') into next_assignees from unnest(coalesce(p_assignees,'{}')) x;
  select coalesce(array_agg(distinct x order by x),'{}') into next_shared from unnest(coalesce(p_shared,'{}')) x;
  if exists(select 1 from unnest(next_assignees || next_shared) x left join public.profiles u on u.id=x
    where u.id is null or not u.is_active or (private.role_of(auth.uid()) <> 'admin' and u.team_id is distinct from team)) then
    raise exception 'Choose active accounts in the project team';
  end if;
  select coalesce(array_agg(profile_id order by profile_id),'{}') into previous_assignees from public.project_members where project_id=p_project_id and access_kind='assignee';
  select coalesce(array_agg(profile_id order by profile_id),'{}') into previous_shared from public.project_members where project_id=p_project_id and access_kind='shared';
  if previous_assignees=next_assignees and previous_shared=next_shared then return; end if;
  delete from public.project_members where project_id=p_project_id and
    ((access_kind='assignee' and not(profile_id=any(next_assignees))) or (access_kind='shared' and not(profile_id=any(next_shared))));
  insert into public.project_members(project_id,profile_id,access_kind,granted_by,granted_at)
    select p_project_id,x,'assignee',auth.uid(),now() from unnest(next_assignees) x on conflict do nothing;
  insert into public.project_members(project_id,profile_id,access_kind,granted_by,granted_at)
    select p_project_id,x,'shared',auth.uid(),now() from unnest(next_shared) x on conflict do nothing;
  if previous_assignees is distinct from next_assignees then
    update public.projects set assigned_by=auth.uid(),assigned_at=now(),
      lead_employee_id=(select e.id from public.employees e where e.profile_id=any(next_assignees) order by e.id limit 1),
      associate_assigned=associate_assigned or private.role_of(auth.uid())='associate_lead'
      where id=p_project_id;
  end if;
  perform private.record_event(p_project_id,
    case when previous_assignees is distinct from next_assignees then 'Project assignments updated' else 'Project sharing updated' end,
    jsonb_build_object('previous_assignees',previous_assignees,'assignees',next_assignees,'previous_shared',previous_shared,'shared',next_shared));
end $$;

create function private.project_changed() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP='INSERT' then
    if new.lead_employee_id is not null then
      insert into public.project_members(project_id,profile_id,access_kind,granted_by,granted_at)
      select new.id,e.profile_id,'assignee',auth.uid(),now() from public.employees e
      join public.profiles u on u.id=e.profile_id where e.id=new.lead_employee_id on conflict do nothing;
    end if;
    perform private.record_event(new.id,'Project created');
  elsif new.status is distinct from old.status or new.target_deadline is distinct from old.target_deadline
    or new.completed_assets is distinct from old.completed_assets or new.total_assets_required is distinct from old.total_assets_required then
    perform private.record_event(new.id,case when new.status::text='completed' and old.status::text<>'completed'
      then 'Project completed' else 'Project progress or deadline updated' end,
      jsonb_build_object('previous_status',old.status,'status',new.status,'previous_deadline',old.target_deadline,
        'deadline',new.target_deadline,'previous_completed',old.completed_assets,'completed',new.completed_assets));
  end if;
  return new;
end $$;
create trigger crm_project_changed after insert or update on public.projects for each row execute function private.project_changed();

create function public.project_people() returns table(id uuid,full_name text,role text,team_id uuid,is_active boolean)
language sql stable security definer set search_path = '' as $$
  select u.id,u.full_name::text,u.role::text,u.team_id,u.is_active from public.profiles u
  where private.role_of(auth.uid()) is not null and (
    private.role_of(auth.uid())='admin' or u.id=auth.uid()
    or (private.role_of(auth.uid())='associate_lead' and u.team_id=(select me.team_id from public.profiles me where me.id=auth.uid()))
    or exists(select 1 from public.project_members m where m.profile_id=u.id and private.can_view_project(m.project_id))
    or exists(select 1 from public.projects p where private.can_view_project(p.id) and u.id in (p.created_by,p.assigned_by))
    or exists(select 1 from public.project_activity a where a.actor_id=u.id and private.can_view_project(a.project_id))
  ) order by u.full_name
$$;
create function public.mark_project_notification_read(p_id uuid) returns void
language sql security definer set search_path = '' as $$
  update public.project_notifications set read_at=coalesce(read_at,now())
  where id=p_id and recipient_id=auth.uid() and private.can_view_project(project_id)
$$;

create function public.set_project_team(p_project_id uuid, p_team_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare previous_team uuid;
begin
  if private.role_of(auth.uid()) is distinct from 'admin' then raise exception 'Only administrators can map project teams'; end if;
  select team_id into previous_team from public.projects where id=p_project_id for update;
  if not found then raise exception 'Project unavailable'; end if;
  if p_team_id is null or not exists(select 1 from public.teams where id=p_team_id) then raise exception 'Select an existing team'; end if;
  if previous_team is not distinct from p_team_id then return; end if;
  update public.projects set team_id=p_team_id where id=p_project_id;
  perform private.record_event(p_project_id,'Project team updated',jsonb_build_object('previous_team',previous_team,'team',p_team_id));
end $$;

revoke all on function private.role_of(uuid),private.is_manager(),private.can_view_project(uuid,uuid),
 private.can_manage_project(uuid),private.can_edit_project(uuid),private.task_project(uuid),private.initial_assignee(uuid,uuid),
 private.guard_profile(),private.guard_employee(),private.guard_project(),private.record_event(uuid,text,jsonb),private.project_changed()
 from public,anon,authenticated;
grant execute on function private.role_of(uuid),private.is_manager(),private.can_view_project(uuid,uuid),
  private.can_edit_project(uuid),private.can_manage_project(uuid),private.task_project(uuid),private.initial_assignee(uuid,uuid) to authenticated;
revoke all on function public.set_project_access(uuid,uuid[],uuid[]),public.project_people(),public.mark_project_notification_read(uuid) from public, anon;
grant execute on function public.set_project_access(uuid,uuid[],uuid[]),public.project_people(),public.mark_project_notification_read(uuid) to authenticated;
revoke all on function public.set_project_team(uuid,uuid) from public,anon;
grant execute on function public.set_project_team(uuid,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
