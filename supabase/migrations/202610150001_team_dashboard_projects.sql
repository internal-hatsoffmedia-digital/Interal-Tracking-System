begin;
-- Read-only dashboard metadata, restricted to the caller's active team.
-- Does not expose project rates, employee credits or editing permissions.
create or replace function public.team_dashboard_projects() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare viewer public.profiles;
begin
 select * into viewer from public.profiles where id=auth.uid() and is_active;
 if viewer.id is null or viewer.role::text not in ('associate_lead','team_lead') or viewer.team_id is null
  or not exists(select 1 from public.teams where id=viewer.team_id and is_active) then
  raise exception 'An active team lead with a linked team is required';
 end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'code',p.project_code,'name',p.name,
 'client',c.name,'status',p.status::text,'deadline',p.target_deadline,
 'task_states',coalesce((select jsonb_agg(distinct t.status::text) from public.tasks t
  join public.task_assignments a on a.task_id=t.id and a.status::text<>'rejected'
  join public.employees e on e.id=a.employee_id and e.is_active
  join public.profiles u on u.id=e.profile_id and u.is_active and u.team_id=viewer.team_id
  where t.project_id=p.id and t.archived_at is null),'[]'::jsonb)) order by p.project_code)
 from public.projects p left join public.clients c on c.id=p.client_id
 where p.is_active and p.status::text<>'cancelled' and (
  viewer.team_id=any(p.production_team_ids) or p.team_id=viewer.team_id or exists(
   select 1 from public.tasks t join public.task_assignments a on a.task_id=t.id and a.status::text<>'rejected'
   join public.employees e on e.id=a.employee_id and e.is_active
   join public.profiles u on u.id=e.profile_id and u.is_active and u.team_id=viewer.team_id
   where t.project_id=p.id and t.archived_at is null
  ))),'[]'::jsonb);
end $$;
revoke all on function public.team_dashboard_projects() from public,anon;
grant execute on function public.team_dashboard_projects() to authenticated;
notify pgrst,'reload schema';
commit;
