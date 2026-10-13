begin;
create table public.birthday_messages (
 id uuid primary key default gen_random_uuid(),
 employee_id uuid not null references public.employees(id) on delete cascade,
 birthday_on date not null,
 author_id uuid not null references public.profiles(id),
 message text not null check(length(trim(message)) between 1 and 280),
 created_at timestamptz not null default now(),
 expires_at timestamptz generated always as ((created_at at time zone 'UTC' + interval '24 hours') at time zone 'UTC') stored
);
alter table public.birthday_messages enable row level security;
revoke all on public.birthday_messages from public,anon,authenticated;
create index birthday_messages_expiry on public.birthday_messages(expires_at);
create function public.workspace_birthdays() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare today date := (now() at time zone 'Asia/Kolkata')::date;begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 return jsonb_build_object('birthdays',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'name',e.full_name,'day',d.birthday_day) order by d.birthday_day,e.full_name)
 from public.employee_birth_dates b join public.employees e on e.id=b.employee_id and e.is_active join public.profiles p on p.id=e.profile_id and p.is_active
 cross join lateral (select s::date as birthday_day from generate_series(today-1,today+7,interval '1 day') s where to_char(s,'MM-DD')=to_char(b.date_of_birth,'MM-DD')) d),'[]'::jsonb),
 'messages',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'employee_id',m.employee_id,'day',m.birthday_on,'author',p.full_name,'message',m.message,'created_at',m.created_at,'expires_at',m.expires_at) order by m.created_at)
 from public.birthday_messages m join public.profiles p on p.id=m.author_id where m.expires_at>now()),'[]'::jsonb));
end $$;
create function public.send_birthday_message(p_employee uuid,p_message text) returns void language plpgsql security definer set search_path='' as $$
declare today date := (now() at time zone 'Asia/Kolkata')::date;begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 if not exists(select 1 from public.employee_birth_dates b join public.employees e on e.id=b.employee_id and e.is_active join public.profiles p on p.id=e.profile_id and p.is_active where e.id=p_employee and to_char(b.date_of_birth,'MM-DD')=to_char(today,'MM-DD')) then raise exception 'Wishes can be sent on the birthday date only';end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 if exists(select 1 from public.birthday_messages where author_id=auth.uid() and created_at>now()-interval '5 seconds') then raise exception 'Please wait a few seconds before sending another wish';end if;
 insert into public.birthday_messages(employee_id,birthday_on,author_id,message) values(p_employee,today,auth.uid(),trim(p_message));
end $$;
create function private.insight_person(person uuid,project uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles viewer join public.profiles worker on worker.id=person and worker.is_active where viewer.id=auth.uid() and viewer.is_active and private.can_view_project(project) and
 (worker.id=viewer.id or viewer.role::text in ('admin','manager','director') or private.coordinator_lead() or (viewer.role::text='project_coordinator' and private.full_project_access(project)) or (viewer.role::text in ('associate_lead','team_lead') and viewer.team_id is not null and worker.team_id=viewer.team_id)))
$$;
create function public.workspace_work_insights(p_from date,p_through date) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare start_at timestamptz;end_at timestamptz;begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 if p_from is null or p_through is null or p_through<p_from or p_through-p_from>366 then raise exception 'Choose an ordered date range up to 367 days';end if;
 start_at:=p_from::timestamp at time zone 'Asia/Kolkata';end_at:=least((p_through+1)::timestamp at time zone 'Asia/Kolkata',now());
 return jsonb_build_object('as_of',end_at-interval '1 microsecond',
 'people',coalesce((select jsonb_agg(jsonb_build_object('employee_id',e.id,'name',e.full_name,'team_id',u.team_id,'team',tm.name) order by e.full_name) from public.employees e join public.profiles u on u.id=e.profile_id and u.is_active join public.profiles viewer on viewer.id=auth.uid() left join public.teams tm on tm.id=u.team_id where e.is_active and (u.id=auth.uid() or viewer.role::text in ('admin','manager','director','project_coordinator') or private.coordinator_lead() or (viewer.role::text in ('associate_lead','team_lead') and viewer.team_id is not null and u.team_id=viewer.team_id))),'[]'::jsonb),
 'assignments',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'employee_id',e.id,'profile_id',e.profile_id,'name',e.full_name,'team_id',u.team_id,'team',tm.name,'task',t.title,'task_id',t.id,'project_id',p.id,'project',p.name,'project_code',p.project_code,'project_status',p.status::text,'status',a.status::text,'assigned_at',a.assigned_at,'committed_at',coalesce(a.committed_at,a.deadline_at),'completed_at',a.completed_at) order by a.assigned_at desc)
 from public.task_assignments a join public.employees e on e.id=a.employee_id and e.is_active join public.profiles u on u.id=e.profile_id join public.tasks t on t.id=a.task_id and t.archived_at is null join public.projects p on p.id=t.project_id left join public.teams tm on tm.id=u.team_id
 where start_at<end_at and a.status::text<>'rejected' and a.assigned_at<end_at and (a.completed_at is null or a.completed_at>=start_at) and private.can_view_task(t.id) and private.insight_person(e.profile_id,p.id)),'[]'::jsonb),
 'timers',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'employee_id',e.id,'profile_id',s.profile_id,'name',e.full_name,'team_id',u.team_id,'team',tm.name,'project_id',p.id,'project',p.name,'project_code',p.project_code,'assignment_id',s.assignment_id,'day',(s.started_at at time zone 'Asia/Kolkata')::date,'hours',greatest(0,extract(epoch from (least(coalesce(s.ended_at,now()),end_at,((s.started_at at time zone 'Asia/Kolkata')::date+1)::timestamp at time zone 'Asia/Kolkata')-greatest(s.started_at,start_at)))/3600),'running',s.ended_at is null and now()<((s.started_at at time zone 'Asia/Kolkata')::date+1)::timestamp at time zone 'Asia/Kolkata') order by s.started_at desc)
 from public.work_timer_sessions s join public.employees e on e.profile_id=s.profile_id and e.is_active join public.profiles u on u.id=s.profile_id join public.projects p on p.id=s.project_id left join public.teams tm on tm.id=u.team_id
 where start_at<end_at and s.started_at<end_at and coalesce(s.ended_at,now())>start_at and private.insight_person(s.profile_id,p.id)),'[]'::jsonb),
 'projects',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'code',p.project_code,'status',p.status::text,'completed_at',p.sales_completed_at) order by p.name) from public.projects p where start_at<end_at and private.can_view_project(p.id) and p.created_at<end_at and (p.sales_completed_at is null or p.sales_completed_at>=start_at)),'[]'::jsonb));
end $$;
revoke all on function private.insight_person(uuid,uuid) from public,anon,authenticated;
revoke all on function public.workspace_birthdays(),public.send_birthday_message(uuid,text),public.workspace_work_insights(date,date) from public,anon;
grant execute on function public.workspace_birthdays(),public.send_birthday_message(uuid,text),public.workspace_work_insights(date,date) to authenticated;
notify pgrst,'reload schema';
commit;

