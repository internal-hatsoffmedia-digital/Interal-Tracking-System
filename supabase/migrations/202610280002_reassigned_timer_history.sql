begin;
-- Read recorded worker identity from the timer, even after an assignment is reassigned.
-- Existing insight scope remains authoritative; a former assignee can read their own recorded work.
create or replace function public.task_timer_report() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'assignment_id',s.assignment_id,'started_at',s.started_at,'ended_at',s.ended_at,'completed_at',case when a.employee_id=e.id then a.completed_at else null end,
 'project_id',p.id,'project_code',p.project_code,'project_name',p.name,'employee_id',e.id,'employee_name',e.full_name,'employee_code',e.employee_code) order by s.started_at)
 from public.work_timer_sessions s
 join public.projects p on p.id=s.project_id
 join public.employees e on e.profile_id=s.profile_id and e.is_active
 left join public.task_assignments a on a.id=s.assignment_id
 left join public.tasks t on t.id=a.task_id
 where private.insight_person(s.profile_id,s.project_id) and
 ((s.assignment_id is null and private.can_view_project(p.id)) or
 (a.id is not null and t.archived_at is null and (private.can_view_task(t.id) or s.profile_id=auth.uid())))), '[]'::jsonb);
end $$;
revoke all on function public.task_timer_report() from public,anon;
grant execute on function public.task_timer_report() to authenticated;
notify pgrst,'reload schema';commit;
