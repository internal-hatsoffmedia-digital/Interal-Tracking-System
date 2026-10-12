begin;
-- Assignment options only: no contact details or employee-management access.
create function public.project_coordinator_options()
returns table(id uuid,profile_id uuid,full_name text,employee_code text,team_id uuid)
language sql stable security definer set search_path='' as $$
 select distinct on (u.id) e.id,u.id,u.full_name::text,e.employee_code::text,u.team_id
 from public.profiles viewer
 join public.profiles u on u.is_active and u.role::text='project_coordinator'
 join public.teams t on t.id=u.team_id and t.is_active
 join public.employees e on e.profile_id=u.id and e.is_active
 where viewer.id=auth.uid() and viewer.is_active and (
 viewer.role::text in ('admin','manager','director')
 or (viewer.role::text in ('associate_lead','team_lead') and viewer.team_id=u.team_id
 and (t.team_type::text in ('flow_force','project_coordination') or lower(trim(t.name)) in ('flow force','project coordinators')))
 or (viewer.role::text='project_coordinator' and viewer.id=u.id)
 ) order by u.id,e.id
$$;
revoke all on function public.project_coordinator_options() from public,anon;
grant execute on function public.project_coordinator_options() to authenticated;
notify pgrst,'reload schema';
commit;
