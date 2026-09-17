-- Apply after 001 and 002. No accounts are remapped by display name.
-- Existing membership history is retained; future assignment/share targets must be coordinators.
begin;
create or replace function private.can_view_project(pid uuid, uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projects p join public.profiles u on u.id = uid and u.is_active
    where p.id = pid and (
      u.role::text in ('admin','director')
      or (u.role::text = 'associate_lead' and u.team_id is not null and p.team_id = u.team_id)
      or (u.role::text = 'team_lead' and p.associate_assigned and u.team_id is not null and p.team_id = u.team_id)
      or (u.role::text in ('project_coordinator','team_lead') and exists (select 1 from public.project_members m where m.project_id = p.id and m.profile_id = uid))
      -- Existing production employees keep access through their current task assignments.
      or (u.role::text = 'employee' and exists (
        select 1 from public.task_assignments a join public.tasks t on t.id = a.task_id
        join public.employees e on e.id = a.employee_id
        where t.project_id = p.id and e.profile_id = uid and a.status::text <> 'rejected'))
    )
  )
$$;
create or replace function private.can_manage_project(pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.projects p join public.profiles u on u.id=auth.uid() and u.is_active where p.id=pid and (u.role::text='admin' or (u.role::text='associate_lead' and u.team_id is not null and p.team_id=u.team_id)))
$$;
create or replace function private.initial_assignee(eid uuid, tid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select u.id from public.employees e join public.profiles u on u.id=e.profile_id
  where e.id=eid and e.is_active and u.is_active and u.role::text='project_coordinator' and u.team_id=tid and private.is_manager() and
    (private.role_of(auth.uid())='admin' or u.team_id=tid)
$$;
create or replace function public.set_project_access(p_project_id uuid, p_assignees uuid[], p_shared uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare previous_assignees uuid[]; previous_shared uuid[]; next_assignees uuid[]; next_shared uuid[]; team uuid;
begin
  select team_id into team from public.projects where id=p_project_id for update;
  if not coalesce(private.can_manage_project(p_project_id),false) then raise exception 'Project assignment is not authorized'; end if;
  select coalesce(array_agg(distinct x order by x),'{}') into next_assignees from unnest(coalesce(p_assignees,'{}')) x;
  select coalesce(array_agg(distinct x order by x),'{}') into next_shared from unnest(coalesce(p_shared,'{}')) x;
  if exists(select 1 from unnest(next_assignees || next_shared) x left join public.profiles u on u.id=x
    where u.id is null or not u.is_active or u.role::text <> 'project_coordinator' or team is null or u.team_id is distinct from team) then
    raise exception 'Choose active Project Coordinators in the mapped coordinator team';
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
create function private.coordinator_membership_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles u join public.projects p on p.id=new.project_id where u.id=new.profile_id and u.is_active and u.role::text='project_coordinator' and u.team_id=p.team_id) then
  raise exception 'Project assignment and sharing require an active Project Coordinator in the mapped project team';
 end if;
 return new;
end $$;
create trigger coordinator_membership_guard before insert or update on public.project_members for each row execute function private.coordinator_membership_guard();
revoke all on function private.coordinator_membership_guard() from public;
create or replace function private.guard_project() returns trigger language plpgsql security invoker set search_path = '' as $$
declare initial_profile uuid;
begin
  if TG_OP='INSERT' then
    if auth.uid() is not null then
      new.created_by := auth.uid();
      new.assigned_by := null; new.assigned_at := null; new.associate_assigned := false;
      if new.team_id is null then
        if new.lead_employee_id is not null then
          select u.team_id into new.team_id from public.employees e join public.profiles u on u.id=e.profile_id where e.id=new.lead_employee_id;
        else select team_id into new.team_id from public.profiles where id=auth.uid(); end if;
      end if;
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
notify pgrst,'reload schema';
commit;
