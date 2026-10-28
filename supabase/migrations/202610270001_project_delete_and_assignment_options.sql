begin;
-- Recoverable project deletion is a separate permission from project editing.
create function private.project_delete_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'Use recoverable project deletion';end if;
 if ((tg_op='UPDATE' and new.is_active is distinct from old.is_active) or (tg_op='INSERT' and not new.is_active)) and not exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('admin','manager')) then raise exception 'Only Admin and Manager can delete or restore projects';end if;
 return new;
end $$;
create trigger project_delete_guard before insert or update or delete on public.projects for each row execute function private.project_delete_guard();
create function public.set_project_active(p_project uuid,p_active boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_active is null or not exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('admin','manager')) then raise exception 'Only Admin and Manager can delete or restore projects';end if;
 perform 1 from public.projects where id=p_project for update;if not found then raise exception 'Project unavailable';end if;
 update public.projects set is_active=p_active,updated_at=now() where id=p_project and is_active is distinct from p_active;
end $$;
-- Changing visibility must not re-run old delivery validations or create sales credits.
do $$ declare f text; sig text;begin
 foreach sig in array array['private.guard_project()','private.project_required_workflow()','private.monthly_project_rules()','private.project_solo_sales_trigger()'] loop
 if to_regprocedure(sig) is null then continue;end if;
 f:=pg_get_functiondef(sig::regprocedure);
 f:=regexp_replace(f,'begin', 'begin
 if TG_OP=''UPDATE'' and new.is_active is distinct from old.is_active and (to_jsonb(new)-''is_active''-''updated_at'')=(to_jsonb(old)-''is_active''-''updated_at'') then return new;end if;', 'i');
 execute f;
 end loop;
end $$;
create or replace function private.coordinator_membership_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles u join public.projects p on p.id=new.project_id join public.teams t on t.id=u.team_id where u.id=new.profile_id and u.is_active and u.team_id=p.team_id and (u.role::text='project_coordinator' or (u.role::text in ('associate_lead','team_lead') and (t.team_type::text in ('flow_force','project_coordination') or lower(trim(t.name)) in ('flow force','project coordinators'))))) then raise exception 'Choose an active coordinator or coordinator lead in the mapped project team';end if;
 return new;
end $$;
create or replace function private.initial_assignee(eid uuid,tid uuid) returns uuid language sql stable security definer set search_path='' as $$
 select p.id from public.employees e join public.profiles p on p.id=e.profile_id and p.is_active join public.teams t on t.id=p.team_id and t.is_active
 where e.id=eid and e.is_active and p.team_id=tid and private.is_manager()
 and (p.role::text='project_coordinator' or (p.role::text in ('associate_lead','team_lead') and (t.team_type::text in ('flow_force','project_coordination') or lower(trim(t.name)) in ('flow force','project coordinators'))))
$$;
create or replace function public.project_coordinator_options() returns table(id uuid,profile_id uuid,full_name text,employee_code text,team_id uuid)
language sql stable security definer set search_path='' as $$
 select distinct on (u.id) e.id,u.id,u.full_name::text,e.employee_code::text,u.team_id
 from public.profiles viewer join public.profiles u on u.is_active
 join public.teams t on t.id=u.team_id and t.is_active join public.employees e on e.profile_id=u.id and e.is_active
 where viewer.id=auth.uid() and viewer.is_active
 and (u.role::text='project_coordinator' or (u.role::text in ('associate_lead','team_lead') and (t.team_type::text in ('flow_force','project_coordination') or lower(trim(t.name)) in ('flow force','project coordinators'))))
 and (viewer.role::text in ('admin','manager','director') or (viewer.role::text in ('associate_lead','team_lead') and viewer.team_id=u.team_id and (t.team_type::text in ('flow_force','project_coordination') or lower(trim(t.name)) in ('flow force','project coordinators'))) or (viewer.role::text='project_coordinator' and viewer.id=u.id)) order by u.id,e.id
$$;
-- Assignment-only directory. Never includes contacts, birth dates or HR details.
create function public.task_artist_options() returns table(id uuid,profile_id uuid,employee_code text,full_name text,team_id uuid,team_name text,account_role text,is_active boolean)
language sql stable security definer set search_path='' as $$
 select distinct on(e.id) e.id,p.id,e.employee_code::text,p.full_name::text,coalesce(p.team_id,e.team_id),t.name::text,p.role::text,true
 from public.employees e join public.profiles p on p.id=e.profile_id and p.is_active join auth.users a on a.id=p.id left join public.teams t on t.id=coalesce(p.team_id,e.team_id)
 where e.is_active and exists(select 1 from public.profiles v where v.id=auth.uid() and v.is_active and v.role::text in ('admin','manager','director','project_coordinator','associate_lead','team_lead')) and private.visible_worker(e.id) and exists(select 1 from public.profiles v left join public.teams vt on vt.id=v.team_id where v.id=auth.uid() and (v.role::text in ('admin','manager','director','project_coordinator') or coalesce(p.team_id,e.team_id)=v.team_id or vt.team_type::text in ('flow_force','project_coordination') or lower(trim(vt.name)) in ('flow force','project coordinators'))) order by e.id
$$;
create or replace function public.team_pc_workers() returns table(id uuid,full_name text,team_id uuid,is_active boolean,team_type text)
language sql stable security definer set search_path='' as $$
 select w.id,w.full_name,w.team_id,w.is_active,t.team_type::text from public.task_artist_options() w left join public.teams t on t.id=w.team_id where exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('admin','manager','director','associate_lead','team_lead')) order by w.full_name,w.id
$$;
revoke all on function private.project_delete_guard() from public,anon,authenticated;
revoke all on function public.set_project_active(uuid,boolean),public.task_artist_options() from public,anon;
grant execute on function public.set_project_active(uuid,boolean),public.task_artist_options() to authenticated;
notify pgrst,'reload schema';commit;
