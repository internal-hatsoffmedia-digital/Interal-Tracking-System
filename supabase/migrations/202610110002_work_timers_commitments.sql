begin;
alter table public.task_assignments add column if not exists committed_at timestamptz;
alter table public.task_assignments add column if not exists commitment_confirmed boolean not null default false;
create function private.assignment_commitment_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
   if auth.uid() is not null and (new.committed_at is null or not new.commitment_confirmed or new.committed_at<=now()) then
     raise exception 'Discuss and confirm a future committed completion time with the assignee before assigning';
   end if;
   if new.committed_at is not null then new.deadline_at:=new.committed_at;end if;
 elsif new.committed_at is distinct from old.committed_at or new.commitment_confirmed is distinct from old.commitment_confirmed then
   raise exception 'Commitments are assignment snapshots; create a new assignment to reschedule';
 end if;
 return new;
end $$;
create trigger assignment_commitment_guard before insert or update on public.task_assignments for each row execute function private.assignment_commitment_guard();

create table public.work_timer_sessions(
 id uuid primary key default gen_random_uuid(),profile_id uuid not null references public.profiles(id),
 project_id uuid not null references public.projects(id) on delete cascade,
 assignment_id uuid references public.task_assignments(id) on delete set null,
 started_at timestamptz not null default now(),ended_at timestamptz,
 end_reason text check(end_reason in ('pause','finish','day_end','assignment_closed')),
 check(ended_at is null or ended_at>=started_at),check((ended_at is null)=(end_reason is null))
);
create unique index work_timer_one_running on public.work_timer_sessions(profile_id) where ended_at is null;
create index work_timer_daily on public.work_timer_sessions(profile_id,started_at);
alter table public.work_timer_sessions enable row level security;
revoke all on public.work_timer_sessions from public,anon,authenticated;

create function private.expire_work_timer() returns void language sql security definer set search_path='' as $$
 update public.work_timer_sessions set ended_at=((started_at at time zone 'Asia/Kolkata')::date+1)::timestamp at time zone 'Asia/Kolkata',end_reason='day_end'
 where profile_id=auth.uid() and ended_at is null and (started_at at time zone 'Asia/Kolkata')::date<(now() at time zone 'Asia/Kolkata')::date;
$$;
create function private.my_timer_project(pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.workspace_role() is not null and exists(select 1 from public.projects p where p.id=pid and p.is_active and p.status::text not in ('completed','cancelled')
 and private.can_view_project(p.id) and (
 p.created_by=auth.uid() or exists(select 1 from public.project_members m where m.project_id=p.id and m.profile_id=auth.uid() and m.access_kind='assignee')
 or exists(select 1 from public.employees e where e.profile_id=auth.uid() and e.is_active and e.id=p.lead_employee_id)
 or exists(select 1 from public.task_assignments a join public.employees e on e.id=a.employee_id join public.tasks t on t.id=a.task_id
 where t.project_id=p.id and t.archived_at is null and e.profile_id=auth.uid() and e.is_active and a.status::text not in ('completed','rejected'))));
$$;

create function public.workspace_work_timer(p_action text,p_project uuid default null,p_assignment uuid default null,p_session uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare running public.work_timer_sessions;
begin
 if private.workspace_role() is null then raise exception 'An active account is required';end if;
 if p_action not in ('start','pause','finish') or p_action is null then raise exception 'Invalid timer action';end if;
 if p_action='start' and p_assignment is not null then perform 1 from public.task_assignments where id=p_assignment for update;end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 perform private.expire_work_timer();
 select * into running from public.work_timer_sessions where profile_id=auth.uid() and ended_at is null;
 if p_action='start' then
   if p_project is null or not private.my_timer_project(p_project) then raise exception 'Choose a project assigned to you';end if;
   if p_assignment is not null and not exists(select 1 from public.task_assignments a join public.employees e on e.id=a.employee_id join public.tasks t on t.id=a.task_id
     where a.id=p_assignment and t.project_id=p_project and t.archived_at is null and e.profile_id=auth.uid() and e.is_active and a.status::text not in ('completed','rejected')) then raise exception 'Choose your own open assignment';end if;
   if running.id is not null then
     if running.project_id=p_project and running.assignment_id is not distinct from p_assignment then return;end if;
     raise exception 'Pause your current timer before starting another project';
   end if;
   insert into public.work_timer_sessions(profile_id,project_id,assignment_id) values(auth.uid(),p_project,p_assignment);
 else
   if running.id is null then return;end if;
   if p_session is null or running.id<>p_session then raise exception 'Timer changed in another tab. Refresh before pausing';end if;
   update public.work_timer_sessions set ended_at=now(),end_reason=p_action where id=running.id;
 end if;
end $$;

create function public.workspace_work_timer_data(p_day date default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare selected_day date:=coalesce(p_day,(now() at time zone 'Asia/Kolkata')::date);from_time timestamptz;to_time timestamptz;
begin
 if private.workspace_role() is null then raise exception 'An active account is required';end if;
 perform private.expire_work_timer();
 from_time:=selected_day::timestamp at time zone 'Asia/Kolkata';to_time:=(selected_day+1)::timestamp at time zone 'Asia/Kolkata';
 return jsonb_build_object('server_now',now(),'day',selected_day,
 'projects',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'code',p.project_code) order by p.name) from public.projects p where private.my_timer_project(p.id)),'[]'::jsonb),
 'assignments',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'project_id',t.project_id,'title',t.title,'committed_at',a.committed_at,'deadline_at',a.deadline_at))
 from public.task_assignments a join public.employees e on e.id=a.employee_id join public.tasks t on t.id=a.task_id
 where e.profile_id=auth.uid() and e.is_active and t.archived_at is null and a.status::text not in ('completed','rejected') and private.my_timer_project(t.project_id)),'[]'::jsonb),
 'running',(select to_jsonb(s) from public.work_timer_sessions s where s.profile_id=auth.uid() and s.ended_at is null),
 'sessions',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'project_id',s.project_id,'project_name',p.name,'assignment_id',s.assignment_id,'task_title',t.title,
 'started_at',greatest(s.started_at,from_time),'ended_at',least(coalesce(s.ended_at,now()),to_time),'end_reason',s.end_reason,
 'seconds',greatest(0,extract(epoch from least(coalesce(s.ended_at,now()),to_time)-greatest(s.started_at,from_time)))) order by s.started_at desc)
 from public.work_timer_sessions s join public.projects p on p.id=s.project_id left join public.task_assignments a on a.id=s.assignment_id left join public.tasks t on t.id=a.task_id
 where s.profile_id=auth.uid() and s.started_at<to_time and coalesce(s.ended_at,now())>from_time),'[]'::jsonb));
end $$;

create function private.stop_assignment_timer() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status::text in ('completed','rejected') then
   update public.work_timer_sessions set ended_at=least(now(),((started_at at time zone 'Asia/Kolkata')::date+1)::timestamp at time zone 'Asia/Kolkata'),end_reason='assignment_closed'
   where assignment_id=new.id and ended_at is null;
 end if;return new;
end $$;
create trigger stop_assignment_timer after update of status on public.task_assignments for each row execute function private.stop_assignment_timer();
revoke all on function private.expire_work_timer(),private.my_timer_project(uuid),private.assignment_commitment_guard(),private.stop_assignment_timer() from public,anon,authenticated;
revoke all on function public.workspace_work_timer(text,uuid,uuid,uuid),public.workspace_work_timer_data(date) from public,anon;
grant execute on function public.workspace_work_timer(text,uuid,uuid,uuid),public.workspace_work_timer_data(date) to authenticated;
commit;
