begin;
-- Same per-person/task visibility as the existing work insights report. No direct table grant.
create or replace function public.task_timer_report() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'assignment_id',a.id,'started_at',s.started_at,'ended_at',s.ended_at,'completed_at',a.completed_at) order by s.started_at)
 from public.work_timer_sessions s
 join public.task_assignments a on a.id=s.assignment_id
 join public.employees e on e.id=a.employee_id and e.profile_id=s.profile_id and e.is_active
 join public.tasks t on t.id=a.task_id and t.archived_at is null
 where private.can_view_task(t.id) and private.insight_person(s.profile_id,t.project_id)), '[]'::jsonb);
end $$;
revoke all on function public.task_timer_report() from public,anon;
grant execute on function public.task_timer_report() to authenticated;
create or replace function public.workspace_work_insights(p_from date,p_through date) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare start_at timestamptz;end_at timestamptz;begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 if p_from is null or p_through is null or p_through<p_from or p_through-p_from>366 then raise exception 'Choose an ordered date range up to 367 days';end if;
 start_at:=p_from::timestamp at time zone 'Asia/Kolkata';end_at:=least((p_through+1)::timestamp at time zone 'Asia/Kolkata',now());
 return jsonb_build_object('as_of',end_at-interval '1 microsecond',
 'people',coalesce((select jsonb_agg(jsonb_build_object('employee_id',e.id,'employee_code',e.employee_code,'name',e.full_name,'team_id',u.team_id,'team',tm.name) order by e.full_name) from public.employees e join public.profiles u on u.id=e.profile_id and u.is_active join public.profiles viewer on viewer.id=auth.uid() left join public.teams tm on tm.id=u.team_id where e.is_active and (u.id=auth.uid() or viewer.role::text in ('admin','manager','director','project_coordinator') or private.coordinator_lead() or (viewer.role::text in ('associate_lead','team_lead') and viewer.team_id is not null and u.team_id=viewer.team_id))),'[]'::jsonb),
 'assignments',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'employee_id',e.id,'employee_code',e.employee_code,'profile_id',e.profile_id,'name',e.full_name,'team_id',u.team_id,'team',tm.name,'task',t.title,'task_id',t.id,'project_id',p.id,'project',p.name,'project_code',p.project_code,'project_status',p.status::text,'status',a.status::text,'assigned_at',a.assigned_at,'committed_at',coalesce(a.committed_at,a.deadline_at),'completed_at',a.completed_at) order by a.assigned_at desc)
 from public.task_assignments a join public.employees e on e.id=a.employee_id and e.is_active join public.profiles u on u.id=e.profile_id join public.tasks t on t.id=a.task_id and t.archived_at is null join public.projects p on p.id=t.project_id left join public.teams tm on tm.id=u.team_id
 where start_at<end_at and a.status::text<>'rejected' and a.assigned_at<end_at and (a.completed_at is null or a.completed_at>=start_at) and private.can_view_task(t.id) and private.insight_person(e.profile_id,p.id)),'[]'::jsonb),
 'timers',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'employee_id',e.id,'employee_code',e.employee_code,'profile_id',s.profile_id,'name',e.full_name,'team_id',u.team_id,'team',tm.name,'project_id',p.id,'project',p.name,'project_code',p.project_code,'assignment_id',s.assignment_id,'day',(s.started_at at time zone 'Asia/Kolkata')::date,'hours',greatest(0,extract(epoch from (least(coalesce(s.ended_at,now()),end_at,((s.started_at at time zone 'Asia/Kolkata')::date+1)::timestamp at time zone 'Asia/Kolkata')-greatest(s.started_at,start_at)))/3600),'running',s.ended_at is null and now()<((s.started_at at time zone 'Asia/Kolkata')::date+1)::timestamp at time zone 'Asia/Kolkata') order by s.started_at desc)
 from public.work_timer_sessions s join public.employees e on e.profile_id=s.profile_id and e.is_active join public.profiles u on u.id=s.profile_id join public.projects p on p.id=s.project_id left join public.teams tm on tm.id=u.team_id
 where start_at<end_at and s.started_at<end_at and coalesce(s.ended_at,now())>start_at and private.insight_person(s.profile_id,p.id)),'[]'::jsonb),
 'projects',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'code',p.project_code,'status',p.status::text,'completed_at',p.sales_completed_at) order by p.name) from public.projects p where start_at<end_at and private.can_view_project(p.id) and p.created_at<end_at and (p.sales_completed_at is null or p.sales_completed_at>=start_at)),'[]'::jsonb));
end $$;
notify pgrst,'reload schema';
commit;
