begin;
-- Explicit employee confirmation is the QC entry action. Unconfirmed historical reviews stay hidden.
create or replace function public.submit_project_work(p_project uuid) returns void language plpgsql security definer set search_path='' as $$
declare current_status text;begin
 if not private.project_contributor(p_project,auth.uid()) then raise exception 'Only assigned contributors can submit project work';end if;
 select status::text into current_status from public.projects where id=p_project and is_active for update;
 if not found or current_status not in ('planning','in_progress','on_hold','client_correction','awaiting_coordinator') then raise exception 'This project is not open for submission';end if;
 insert into public.project_work_submissions(project_id,profile_id) values(p_project,auth.uid()) on conflict(project_id,profile_id) do update set submitted_at=now();
 update public.projects set status='internal_review',ended_at=case when started_at is not null then greatest(now(),started_at) else ended_at end where id=p_project;
 insert into public.qc_reviews(project_id,coordinator_released_at) values(p_project,now()) on conflict(project_id) where task_id is null do update set state='waiting',reviewer_id=null,updated_at=now(),coordinator_released_at=now();
 perform private.record_event(p_project,'Work confirmed complete and submitted to QC',jsonb_build_object('employee',auth.uid()));
end $$;


create or replace function public.submit_task_work(p_assignment uuid) returns void language plpgsql security definer set search_path='' as $$
declare tid uuid;pid uuid;begin
 select a.task_id,t.project_id into tid,pid from public.task_assignments a join public.employees e on e.id=a.employee_id and e.is_active join public.profiles u on u.id=e.profile_id and u.is_active join public.tasks t on t.id=a.task_id and t.archived_at is null join public.projects p on p.id=t.project_id and p.is_active where a.id=p_assignment and e.profile_id=auth.uid() and a.status::text not in ('rejected','completed') for update of a;
 if tid is null then raise exception 'Only the assigned employee can confirm unfinished work';end if;
 update public.task_assignments set status='completed',completed_at=now() where id=p_assignment;
 update public.tasks set status='internal_review',updated_at=now() where id=tid;
 insert into public.qc_reviews(project_id,task_id,coordinator_released_at) values(pid,tid,now()) on conflict(task_id) where task_id is not null do update set state='waiting',reviewer_id=null,updated_at=now(),coordinator_released_at=now();
 perform private.record_event(pid,'Task confirmed complete and submitted to QC',jsonb_build_object('assignment',p_assignment,'employee',auth.uid()));
end $$;
create or replace function public.project_completion_people(p_project uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.project_delivery_manager(p_project) then raise exception 'Project coordinator access required';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name,'employee_code',e.employee_code) order by p.full_name) from public.profiles p join public.employees e on e.profile_id=p.id and e.is_active where private.project_contributor(p_project,p.id)),'[]'::jsonb);
end $$;
create or replace function public.complete_project_work(p_project uuid,p_employee uuid,p_patch jsonb default '{}'::jsonb) returns void language plpgsql security definer set search_path='' as $$
declare project public.projects;worker_team uuid;assignments text;begin
 if not private.project_delivery_manager(p_project) then raise exception 'Project coordinator access required';end if;
 select * into project from public.projects where id=p_project and is_active for update;
 if not found then raise exception 'Choose an active project';end if;
 if not exists(select 1 from jsonb_array_elements(public.project_completion_people(p_project)) p where p->>'id'=p_employee::text) then raise exception 'Select a verified project contributor';end if;
 if exists(select 1 from public.project_sales_credits where project_id=p_project and profile_id<>p_employee and amount>0) then raise exception 'Shared sales credits already exist. Ask Sales leadership to resolve them before selecting one employee';end if;
 if jsonb_typeof(p_patch)<>'object' or exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('client_id','name','description','category','final_link','remarks','production_team_ids','rate','start_date','target_deadline','health','invoice_status','series_title','started_at','ended_at','total_assets_required','completed_assets','pending_assets')) then raise exception 'Unsupported project fields';end if;
 select string_agg(format('%I=(jsonb_populate_record(null::public.projects,$1)).%I',k,k),',') into assignments from jsonb_object_keys(p_patch) k;
 if assignments is not null then execute format('update public.projects set %s where id=$2',assignments) using p_patch,p_project;end if;
 update public.projects set completed_by_profile_id=p_employee,status='completed' where id=p_project;
 select * into project from public.projects where id=p_project;
 select team_id into worker_team from public.profiles where id=p_employee;
 insert into public.project_sales_credits(project_id,profile_id,amount,credited_by,team_id,source) values(p_project,p_employee,project.rate,auth.uid(),worker_team,'manual') on conflict(project_id,profile_id) do update set amount=excluded.amount,credited_by=excluded.credited_by,team_id=excluded.team_id,source='manual',updated_at=now();
 perform private.record_event(p_project,'Project completed and employee credited',jsonb_build_object('employee',p_employee));
end $$;

-- Coordinators route QC feedback without gaining reviewer membership or cross-team access.
create or replace function public.qc_route_review(p_review uuid,p_action text,p_body text default '',p_recipient uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare r public.qc_reviews;begin
 select * into r from public.qc_reviews where id=p_review for update;
 if r.id is null or r.coordinator_released_at is null or not private.project_delivery_manager(r.project_id) then raise exception 'Project coordinator access required';end if;
 if p_action='client_review' then
  if r.state<>'approved' then raise exception 'QC must approve the work before client review';end if;
  update public.projects set status='client_review' where id=r.project_id;
 elsif p_action='internal_correction' then
  if length(trim(coalesce(p_body,''))) not between 1 and 5000 or not exists(select 1 from jsonb_array_elements(private.qc_artist_people(r.project_id,r.task_id)) p where p->>'id'=p_recipient::text) then raise exception 'Select an assigned employee and describe the correction';end if;
  insert into public.qc_notes(review_id,author_id,recipient_id,body) values(r.id,auth.uid(),p_recipient,trim(p_body));
  update public.qc_reviews set state='corrections',updated_at=now() where id=r.id;
  insert into public.qc_notifications(review_id,recipient_id,message) values(r.id,p_recipient,'Your coordinator requested internal corrections.');
 else raise exception 'Invalid QC route';end if;
 perform private.record_event(r.project_id,'QC route: '||p_action,jsonb_build_object('review',r.id));
end $$;
revoke all on function public.submit_task_work(uuid),public.qc_route_review(uuid,text,text,uuid) from public,anon;
grant execute on function public.submit_task_work(uuid),public.qc_route_review(uuid,text,text,uuid) to authenticated;
create or replace function public.qc_workspace() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 return jsonb_build_object('operator',private.qc_operator(),'admin',private.role_of(auth.uid())='admin',
 'reviewers',case when private.qc_operator() then coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name)) from public.qc_reviewers q join public.profiles p on p.id=q.profile_id where p.is_active),'[]'::jsonb) else '[]'::jsonb end,
 'members',case when private.role_of(auth.uid())='admin' then coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',full_name)) from public.profiles where is_active),'[]'::jsonb) else '[]'::jsonb end,
 'items',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'project',p.name,'code',p.project_code,'client',c.name,'task',t.title,'state',r.state,'reviewer_id',r.reviewer_id,'reviewer',u.full_name,'updated_at',r.updated_at,
 'can_route',private.project_delivery_manager(p.id),'can_resubmit',exists(select 1 from public.qc_notes n where n.review_id=r.id and n.recipient_id=auth.uid()),'file',t.footage_link,'assignees',private.qc_artist_people(p.id,r.task_id),
 'notes',coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'author',np.full_name,'recipient',rp.full_name,'body',n.body,'created_at',n.created_at) order by n.created_at) from public.qc_notes n join public.profiles np on np.id=n.author_id left join public.profiles rp on rp.id=n.recipient_id where n.review_id=r.id and (private.qc_operator() or private.role_of(auth.uid())<>'employee' or n.recipient_id=auth.uid() or n.author_id=auth.uid() or n.recipient_id is null)),'[]'::jsonb)) order by r.updated_at desc)
 from public.qc_reviews r join public.projects p on p.id=r.project_id left join public.clients c on c.id=p.client_id left join public.tasks t on t.id=r.task_id left join public.profiles u on u.id=r.reviewer_id
 where r.coordinator_released_at is not null and private.qc_visible(r.project_id,r.task_id) and (r.task_id is null or t.archived_at is null)),'[]'::jsonb));
end $$;

notify pgrst,'reload schema';commit;
