begin;
-- Legacy entries remain stored but require explicit coordinator confirmation.
alter table public.qc_reviews add column coordinator_released_at timestamptz;
alter table public.qc_reviews add column coordinator_id uuid references public.profiles(id);
create or replace function private.qc_enqueue() returns trigger language plpgsql security definer set search_path='' as $$
declare pid uuid;begin
 if tg_table_name='tasks' then pid=new.project_id;else pid=new.id;end if;
 if new.status::text not in ('internal_review','sent_for_internal_review') or not private.project_delivery_manager(pid) then return new;end if;
 if tg_table_name='tasks' then
  if tg_op='UPDATE' and old.status::text=new.status::text and exists(select 1 from public.qc_reviews where task_id=new.id and coordinator_released_at is not null) then return new;end if;
  insert into public.qc_reviews(project_id,task_id,coordinator_released_at,coordinator_id) values(pid,new.id,now(),auth.uid())
  on conflict(task_id) where task_id is not null do update set state='waiting',reviewer_id=null,updated_at=now(),coordinator_released_at=now(),coordinator_id=auth.uid();
 else
  if tg_op='UPDATE' and old.status::text=new.status::text and exists(select 1 from public.qc_reviews where project_id=pid and task_id is null and coordinator_released_at is not null) then return new;end if;
  insert into public.qc_reviews(project_id,coordinator_released_at,coordinator_id) values(pid,now(),auth.uid())
  on conflict(project_id) where task_id is null do update set state='waiting',reviewer_id=null,updated_at=now(),coordinator_released_at=now(),coordinator_id=auth.uid();
 end if;return new;
end $$;

create or replace function public.qc_workspace() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 return jsonb_build_object('operator',private.qc_operator(),'admin',private.role_of(auth.uid())='admin',
 'reviewers',case when private.qc_operator() then coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name)) from public.qc_reviewers q join public.profiles p on p.id=q.profile_id where p.is_active),'[]'::jsonb) else '[]'::jsonb end,
 'members',case when private.role_of(auth.uid())='admin' then coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',full_name)) from public.profiles where is_active),'[]'::jsonb) else '[]'::jsonb end,
 'items',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'project',p.name,'code',p.project_code,'client',c.name,'task',t.title,'state',r.state,'reviewer_id',r.reviewer_id,'reviewer',u.full_name,'updated_at',r.updated_at,
 'can_resubmit',exists(select 1 from public.qc_notes n where n.review_id=r.id and n.recipient_id=auth.uid()),'file',t.footage_link,'assignees',private.qc_artist_people(p.id,r.task_id),
 'notes',coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'author',np.full_name,'recipient',rp.full_name,'body',n.body,'created_at',n.created_at) order by n.created_at) from public.qc_notes n join public.profiles np on np.id=n.author_id left join public.profiles rp on rp.id=n.recipient_id where n.review_id=r.id and (private.qc_operator() or private.role_of(auth.uid())<>'employee' or n.recipient_id=auth.uid() or n.author_id=auth.uid() or n.recipient_id is null)),'[]'::jsonb)) order by r.updated_at desc)
 from public.qc_reviews r join public.projects p on p.id=r.project_id left join public.clients c on c.id=p.client_id left join public.tasks t on t.id=r.task_id left join public.profiles u on u.id=r.reviewer_id
 where r.coordinator_released_at is not null and private.qc_visible(r.project_id,r.task_id) and (r.task_id is null or t.archived_at is null)),'[]'::jsonb));
end $$;

create or replace function public.qc_update(p_review uuid,p_action text,p_body text default '',p_recipient uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare r public.qc_reviews; next_state text; actor text;
begin
 select * into r from public.qc_reviews where id=p_review for update;
 if r.id is null or r.coordinator_released_at is null or not private.qc_visible(r.project_id,r.task_id) then raise exception 'Review unavailable';end if;
 select full_name into actor from public.profiles where id=auth.uid();
 if p_action='resubmit' then
 if r.state<>'corrections' or not exists(select 1 from public.qc_notes where review_id=r.id and recipient_id=auth.uid()) then raise exception 'Only the correction recipient can resubmit';end if;
 next_state:='resubmitted';
 else
 if not private.qc_operator() then raise exception 'QC reviewer access required';end if;
 if p_action='claim' then
 if r.state not in ('waiting','resubmitted','corrections') or (r.reviewer_id is not null and r.reviewer_id<>auth.uid()) then raise exception 'This review is already claimed';end if;
 next_state:='checking';
 else
 if r.reviewer_id is distinct from auth.uid() or r.state not in ('checking','resubmitted') then raise exception 'Claim this review before checking it';end if;
 if p_action='corrections' then
 if p_recipient is null or not (exists(select 1 from public.tasks t join public.task_assignments a on a.task_id=t.id and a.status::text<>'rejected' join public.employees e on e.id=a.employee_id and e.is_active join public.profiles u on u.id=e.profile_id and u.is_active where t.project_id=r.project_id and (r.task_id is null or t.id=r.task_id) and e.profile_id=p_recipient) or (r.task_id is null and exists(select 1 from public.project_artist_links l join public.profiles ep on ep.id=l.profile_id and ep.is_active where l.project_id=r.project_id and l.profile_id=p_recipient))) then raise exception 'Select an active assigned employee';end if;
 next_state:='corrections';
 elsif p_action='approve' then next_state:='approved';
 else raise exception 'Invalid QC action';end if;end if;end if;
 if p_action<>'claim' then
 if length(trim(coalesce(p_body,''))) not between 1 and 5000 then raise exception 'Add a note (1–5000 characters)';end if;
 insert into public.qc_notes(review_id,author_id,recipient_id,body) values(r.id,auth.uid(),p_recipient,trim(p_body));end if;
 update public.qc_reviews set state=next_state,reviewer_id=case when p_action='claim' then auth.uid() else reviewer_id end,updated_at=now() where id=r.id;
 insert into public.qc_notifications(review_id,recipient_id,message)
 select r.id,u.id,coalesce(actor,'QC reviewer')||': '||replace(next_state,'_',' ') from public.profiles u join public.projects p on p.id=r.project_id where u.is_active and u.id<>auth.uid() and (
 u.id=p_recipient or u.id=r.reviewer_id or exists(select 1 from public.project_artist_links l where l.project_id=p.id and l.coordinator_id=u.id) or exists(select 1 from public.project_members m where m.project_id=p.id and m.profile_id=u.id)
 or (u.role::text in ('associate_lead','team_lead') and u.team_id is not null and (u.team_id=any(p.production_team_ids) or u.team_id=p.team_id)));
end $$;


create or replace function public.submit_project_work(p_project uuid) returns void language plpgsql security definer set search_path='' as $$
declare current_status text;begin
 if not private.project_contributor(p_project,auth.uid()) then raise exception 'Only assigned contributors can submit project work';end if;
 select status::text into current_status from public.projects where id=p_project and is_active for update;
 if not found or current_status not in ('planning','in_progress','on_hold','client_correction') then raise exception 'This project is not open for submission';end if;
 insert into public.project_work_submissions(project_id,profile_id) values(p_project,auth.uid()) on conflict(project_id,profile_id) do update set submitted_at=now();
 update public.projects set status='awaiting_coordinator',ended_at=case when started_at is not null then greatest(now(),started_at) else ended_at end where id=p_project;
 perform private.record_event(p_project,'Work submitted for coordinator review',jsonb_build_object('employee',auth.uid()));
end $$;

create or replace function private.project_required_workflow() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' and auth.uid() is not null then
  if new.client_id is null or nullif(btrim(new.name),'') is null or coalesce(cardinality(new.production_team_ids),0)=0 or new.rate is null or new.rate<0 or new.rate::text in ('NaN','Infinity','-Infinity') or nullif(new.invoice_status::text,'') is null or nullif(new.status::text,'') is null then raise exception 'Client, project name, production teams, rate, payment status and status are required';end if;
  if new.status::text='completed' then raise exception 'Create the project first, then complete it with a verified employee';end if;
  if new.completed_by_profile_id is not null then raise exception 'Select the completing employee only during final completion';end if;
 end if;
 if tg_op='UPDATE' and auth.uid() is not null then
  if new.completed_by_profile_id is distinct from old.completed_by_profile_id and current_user<>(select pg_get_userbyid(relowner) from pg_class where oid='public.projects'::regclass) then raise exception 'Use coordinator completion to select the employee';end if;
  if new.completed_by_profile_id is not null then select full_name into new.completed_by_name from public.profiles where id=new.completed_by_profile_id;else new.completed_by_name=null;end if;
  if new.status::text in ('client_review','client_correction') and new.status::text is distinct from old.status::text and not private.project_delivery_manager(old.id) then raise exception 'Only project coordinators or managers can change client review status';end if;
  if new.status::text='client_review' and old.status::text<>'client_review' and (not exists(select 1 from public.qc_reviews where project_id=old.id and coordinator_released_at is not null) or exists(select 1 from public.qc_reviews where project_id=old.id and coordinator_released_at is not null and state<>'approved')) then raise exception 'Finish Internal QC before sending work to Client Review';end if;
  if new.status::text='completed' and old.status::text<>'completed' then
   if current_user<>(select pg_get_userbyid(relowner) from pg_class where oid='public.projects'::regclass) then raise exception 'Use coordinator completion to credit the employee';end if;
   if not private.project_delivery_manager(old.id) then raise exception 'Only project coordinators or managers can complete projects';end if;
   if new.completed_by_profile_id is null then raise exception 'Select the completing employee';end if;
   if not exists(select 1 from jsonb_array_elements(public.project_completion_people(old.id)) p where p->>'id'=new.completed_by_profile_id::text) then raise exception 'Choose an employee who submitted work for this project';end if;
   if not exists(select 1 from public.qc_reviews where project_id=old.id and coordinator_released_at is not null) or exists(select 1 from public.qc_reviews where project_id=old.id and coordinator_released_at is not null and state<>'approved') then raise exception 'Finish Internal QC before completing the project';end if;
   if new.client_id is null or nullif(btrim(new.name),'') is null or coalesce(cardinality(new.production_team_ids),0)=0 or new.rate is null or new.rate<0 or new.rate::text in ('NaN','Infinity','-Infinity') or nullif(new.invoice_status::text,'') is null then raise exception 'Fill the required project details before completion';end if;
  end if;
 end if;return new;
end $$;

notify pgrst,'reload schema';commit;
