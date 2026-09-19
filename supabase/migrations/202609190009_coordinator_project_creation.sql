-- Allow project_coordinator and associate_lead roles to create projects for their team,
-- ensure project_people RPC exposes all eligible project coordinators/leads,
-- fix initial_assignee check to validate active employee leads cleanly,
-- and update guard_project trigger to never block valid project creation.
begin;

create or replace function private.coordinator_lead(uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u where u.id=uid and u.is_active
 and u.role::text in ('associate_lead','team_lead','project_coordinator') and u.team_id is not null)
$$;

create or replace function private.is_manager() returns boolean
language sql stable security definer set search_path='' as $$
 select private.role_of(auth.uid()) in ('admin','director','project_coordinator') or private.coordinator_lead()
$$;

create or replace function private.initial_assignee(eid uuid, tid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select coalesce(e.profile_id, e.id) from public.employees e
  left join public.profiles u on u.id = e.profile_id
  where e.id = eid and e.is_active
$$;

create or replace function private.guard_project() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare initial_profile uuid;
begin
  if TG_OP='INSERT' then
    if auth.uid() is not null then
      new.created_by := auth.uid();
      new.assigned_by := null; new.assigned_at := null; new.associate_assigned := false;
      
      if new.team_id is null then
        if new.lead_employee_id is not null then
          select coalesce(u.team_id, e.team_id) into new.team_id 
          from public.employees e left join public.profiles u on u.id=e.profile_id 
          where e.id=new.lead_employee_id;
        end if;
        if new.team_id is null then
          select team_id into new.team_id from public.profiles where id=auth.uid();
        end if;
      end if;

      if new.lead_employee_id is not null then
        initial_profile := private.initial_assignee(new.lead_employee_id, new.team_id);
        if initial_profile is not null then
          new.assigned_by := auth.uid(); 
          new.assigned_at := now();
          new.associate_assigned := (private.role_of(auth.uid()) in ('associate_lead', 'project_coordinator'));
        end if;
      end if;
    end if;
  elsif auth.uid() is not null then
    if new.id is distinct from old.id or new.created_by is distinct from old.created_by or
       new.team_id is distinct from old.team_id or new.assigned_by is distinct from old.assigned_by or
       new.assigned_at is distinct from old.assigned_at or new.associate_assigned is distinct from old.associate_assigned then
      if current_user <> (select pg_catalog.pg_get_userbyid(relowner) from pg_catalog.pg_class where oid='public.projects'::regclass) then
        raise exception 'Assignment metadata must be changed through the assignment workflow';
      end if;
    end if;
    if new.lead_employee_id is distinct from old.lead_employee_id and
       current_user <> (select pg_catalog.pg_get_userbyid(relowner) from pg_catalog.pg_class where oid='public.projects'::regclass) then
      raise exception 'Use the assignment workflow to change project assignees';
    end if;
  end if;
  return new;
end $$;

create or replace function public.project_people() returns table(id uuid,full_name text,role text,team_id uuid,is_active boolean)
language sql stable security definer set search_path='' as $$
 select u.id,u.full_name::text,u.role::text,u.team_id,u.is_active from public.profiles u
 where private.role_of(auth.uid()) is not null and (
 private.role_of(auth.uid()) in ('admin','director') or u.id=auth.uid()
 or u.role::text in ('project_coordinator','associate_lead','team_lead')
 or (private.coordinator_lead() and u.team_id=(select me.team_id from public.profiles me where me.id=auth.uid()))
 or exists(select 1 from public.project_members m where m.profile_id=u.id and private.can_view_project(m.project_id))
 or exists(select 1 from public.projects p where private.can_view_project(p.id) and u.id in (p.created_by,p.assigned_by))
 or exists(select 1 from public.project_activity a where a.actor_id=u.id and private.can_view_project(a.project_id))
 ) order by u.full_name
$$;

notify pgrst,'reload schema';
commit;
