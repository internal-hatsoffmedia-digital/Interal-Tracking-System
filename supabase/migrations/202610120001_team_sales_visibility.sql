begin;
-- Sales is a leadership view, independent of legacy CRM access grants.
create or replace function public.team_sales_access() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u where u.id=auth.uid() and u.is_active and
  (u.role::text in ('admin','director','manager') or
   (u.role::text in ('associate_lead','team_lead') and u.team_id is not null)))
$$;
create or replace function private.team_sales_project(pid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u join public.projects p on p.id=pid
 where u.id=auth.uid() and u.is_active and (
  u.role::text in ('admin','director','manager')
  or (u.role::text='associate_lead' and exists(select 1 from public.teams team where team.id=u.team_id
   and (team.team_type::text in ('flow_force','project_coordination') or lower(trim(team.name)) in ('flow force','project coordinators'))))
  or (u.role::text in ('associate_lead','team_lead') and u.team_id is not null and (
   p.team_id=u.team_id or exists(
    select 1 from public.tasks t join public.task_assignments a on a.task_id=t.id
    join public.employees e on e.id=a.employee_id and e.is_active
    join public.profiles worker on worker.id=e.profile_id and worker.is_active
    where t.project_id=p.id and a.status::text<>'rejected'
      and e.team_id=u.team_id and worker.team_id=u.team_id
   )
  ))
 ))
$$;
-- Keep coordinator cost entry available, without legacy CRM grants bypassing team scope.
create or replace function public.project_finance_access() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u where u.id=auth.uid() and u.is_active
  and u.role::text in ('admin','director','manager','project_coordinator','associate_lead','team_lead'))
$$;
create or replace function private.finance_all_projects() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u where u.id=auth.uid() and u.is_active and
  (u.role::text in ('admin','director','manager') or (u.role::text='associate_lead' and exists(
   select 1 from public.teams team where team.id=u.team_id and
   (team.team_type::text in ('flow_force','project_coordination') or lower(trim(team.name)) in ('flow force','project coordinators'))))))
$$;
create or replace function public.project_finance_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.project_finance_access() then raise exception 'Project finance access is unavailable'; end if;
 with visible as (
  select p.id,p.project_code,p.name,p.client_id,c.name as client_name,p.status::text,p.rate,
   p.created_at,p.is_active,private.finance_edit_project(p.id) as can_edit
  from public.projects p join public.clients c on c.id=p.client_id
  where private.team_sales_project(p.id) or
   (private.role_of(auth.uid())::text='project_coordinator' and private.can_view_project(p.id))
 )
 select jsonb_build_object(
  'projects',coalesce((select jsonb_agg(to_jsonb(v) order by v.project_code) from visible v),'[]'::jsonb),
  'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('creator_name',p.full_name) order by i.created_at)
   from public.project_finance_items i join visible v on v.id=i.project_id join public.profiles p on p.id=i.created_by),'[]'::jsonb)
 ) into result;
 return result;
end;
$$;
create or replace function public.team_sales_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.team_sales_access() then raise exception 'Sales is available only to directors, managers and team leadership'; end if;
 with visible as (
  select p.id,p.project_code,p.name,p.client_id,c.name as client_name,p.status::text,p.rate,
   p.created_at,p.is_active,false as can_edit
  from public.projects p join public.clients c on c.id=p.client_id
  where private.team_sales_project(p.id)
 )
 select jsonb_build_object(
  'projects',coalesce((select jsonb_agg(to_jsonb(v) order by v.project_code) from visible v),'[]'::jsonb),
  'clients',coalesce((select jsonb_agg(to_jsonb(c)) from (select distinct client_id as id,client_name as name from visible) c),'[]'::jsonb),
  'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('creator_name',p.full_name) order by i.created_at)
   from public.project_finance_items i join visible v on v.id=i.project_id join public.profiles p on p.id=i.created_by),'[]'::jsonb)
 ) into result;
 return result;
end;
$$;
revoke all on function private.team_sales_project(uuid) from public,anon,authenticated;
revoke all on function public.team_sales_access(),public.team_sales_data() from public,anon;
grant execute on function public.team_sales_access(),public.team_sales_data() to authenticated;
commit;
