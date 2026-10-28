begin;
-- Keep editing within existing task/artist scope. Employee self-service cannot change ownership or commitments.
create function private.can_revise_task_assignment(tid uuid,eid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('admin','manager','director','associate_lead','team_lead','project_coordinator'))
 and private.can_view_task(tid) and exists(select 1 from public.task_artist_options() where id=eid)
$$;
create table public.task_assignment_revisions(
 id uuid primary key default gen_random_uuid(),assignment_id uuid not null,task_id uuid not null,
 actor_id uuid not null,old_employee_id uuid,new_employee_id uuid,old_committed_at timestamptz,new_committed_at timestamptz,
 created_at timestamptz not null default now());
alter table public.task_assignment_revisions enable row level security;
revoke all on public.task_assignment_revisions from public,anon,authenticated;
-- Audit is internal; Team PC Activity continues to show the acting person and changed fields.
create or replace function private.assignment_commitment_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
   if auth.uid() is not null and (new.committed_at is null or not new.commitment_confirmed or new.committed_at<=now()) then raise exception 'Discuss and confirm a future committed completion time with the assignee before assigning';end if;
   if new.committed_at is not null then new.deadline_at:=new.committed_at;end if;
 elsif new.committed_at is distinct from old.committed_at or new.commitment_confirmed is distinct from old.commitment_confirmed then
   if not private.can_revise_task_assignment(old.task_id,new.employee_id) then raise exception 'Task rescheduling is not authorized';end if;
   if new.committed_at is null or not new.commitment_confirmed then raise exception 'Confirm the corrected completion time with the assignee';end if;
   new.deadline_at:=new.committed_at;
 end if;
 return new;
end $$;
create or replace function private.assignment_delivery_timing() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then
   if new.deadline_at is null then select due_date into new.deadline_at from public.tasks where id=new.task_id;end if;
   if exists(select 1 from public.employees e join public.teams t on t.id=e.team_id where e.id=new.employee_id and t.team_type::text='cut_masters') and new.deadline_at is null then raise exception 'Set an exact task deadline before assigning Cut Masters video work';end if;
   if auth.uid() is not null then new.assigned_by:=auth.uid();new.assigned_at:=now();end if;
   if new.status::text='completed' then new.completed_at:=now();else new.completed_at:=null;end if;
 else
   if new.task_id is distinct from old.task_id then raise exception 'An assignment cannot be moved to another task';end if;
   if new.employee_id is distinct from old.employee_id or new.deadline_at is distinct from old.deadline_at then
     if not private.can_revise_task_assignment(old.task_id,new.employee_id) then raise exception 'Task reassignment or rescheduling is not authorized';end if;
     if new.deadline_at is distinct from new.committed_at or new.committed_at is null or not new.commitment_confirmed then raise exception 'Confirm the corrected completion time with the assignee';end if;
     insert into public.task_assignment_revisions(assignment_id,task_id,actor_id,old_employee_id,new_employee_id,old_committed_at,new_committed_at)
     values(old.id,old.task_id,auth.uid(),old.employee_id,new.employee_id,coalesce(old.committed_at,old.deadline_at),new.committed_at);
   end if;
   if new.employee_id is distinct from old.employee_id then
     -- Close the previous worker's running session without transferring their recorded hours.
     update public.work_timer_sessions set ended_at=greatest(started_at,least(now(),((started_at at time zone 'Asia/Kolkata')::date+1)::timestamp at time zone 'Asia/Kolkata')),end_reason='assignment_closed' where assignment_id=old.id and ended_at is null;
     new.status:='assigned';new.accepted_at:=null;new.completed_at:=null;
   elsif old.completed_at is not null then new.completed_at:=old.completed_at;
   elsif new.status::text='completed' and old.status::text<>'completed' then new.completed_at:=now();else new.completed_at:=old.completed_at;end if;
 end if;
 return new;
end $$;
-- Invoker security preserves all existing table RLS. A failed assignment edit rolls back the task edit too.
create function public.edit_task_with_assignment(p_task uuid,p_assignment uuid,p_patch jsonb,p_employee uuid,p_notes text,p_confirmed boolean) returns public.tasks language plpgsql security invoker set search_path='' as $$
declare t public.tasks;a public.task_assignments;candidate public.tasks;changed boolean;
begin
 select * into t from public.tasks where id=p_task for update;if not found then raise exception 'Task unavailable';end if;
 select * into a from public.task_assignments where id=p_assignment and task_id=p_task for update;if not found then raise exception 'Assignment unavailable';end if;
 if not private.can_revise_task_assignment(p_task,p_employee) then raise exception 'Task editing is not authorized';end if;
 if jsonb_typeof(p_patch)<>'object' or exists(select 1 from jsonb_object_keys(p_patch) k where not k=any(ARRAY['project_id','client_id','title','description','category','revision_status','priority','status','planned_date','start_date','due_date','estimated_hours','actual_hours','footage_link','special_notes','delay_reason'])) then raise exception 'Unsupported task fields';end if;
 candidate:=jsonb_populate_record(t,p_patch);
 if nullif(trim(candidate.title),'') is null then raise exception 'Task title is required';end if;
 changed:=p_employee is distinct from a.employee_id or candidate.due_date is distinct from coalesce(a.committed_at,a.deadline_at);
 if changed and (not coalesce(p_confirmed,false) or candidate.due_date is null) then raise exception 'Confirm the artist and corrected completion time';end if;
 update public.tasks set (project_id,client_id,title,description,category,revision_status,priority,status,planned_date,start_date,due_date,estimated_hours,actual_hours,footage_link,special_notes,delay_reason)=(select candidate.project_id,candidate.client_id,candidate.title,candidate.description,candidate.category,candidate.revision_status,candidate.priority,candidate.status,candidate.planned_date,candidate.start_date,candidate.due_date,candidate.estimated_hours,candidate.actual_hours,candidate.footage_link,candidate.special_notes,candidate.delay_reason) where id=p_task returning * into t;
 if not found then raise exception 'Task editing is not authorized';end if;
 update public.task_assignments set employee_id=p_employee,notes=nullif(trim(p_notes),''),committed_at=case when changed then candidate.due_date else committed_at end,commitment_confirmed=case when changed then true else commitment_confirmed end where id=p_assignment;
 if not found then raise exception 'Assignment editing is not authorized';end if;
 return t;
end $$;
revoke all on function private.can_revise_task_assignment(uuid,uuid) from public,anon;
grant execute on function private.can_revise_task_assignment(uuid,uuid) to authenticated;
revoke all on function public.edit_task_with_assignment(uuid,uuid,jsonb,uuid,text,boolean) from public,anon;
grant execute on function public.edit_task_with_assignment(uuid,uuid,jsonb,uuid,text,boolean) to authenticated;
notify pgrst,'reload schema';commit;
