begin;
-- QC is optional. Delivery managers retain existing project scope and credit checks.
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
  if new.status::text='completed' and new.monthly_team_project then
   if current_user<>(select pg_get_userbyid(relowner) from pg_class where oid='public.projects'::regclass) or not private.project_delivery_manager(old.id) then raise exception 'Use monthly team completion';end if;
   if new.sales_credit_team_id is null or new.completed_by_profile_id is not null then raise exception 'Choose one team for the full monthly rate';end if;
   if new.rate is null or new.rate<0 or new.client_id is null or coalesce(cardinality(new.production_team_ids),0)=0 or nullif(new.invoice_status::text,'') is null then raise exception 'Fill the required monthly project details';end if;
   return new;
  end if;
  if new.status::text='completed' and old.status::text<>'completed' then
   if current_user<>(select pg_get_userbyid(relowner) from pg_class where oid='public.projects'::regclass) then raise exception 'Use coordinator completion to credit the employee';end if;
   if not private.project_delivery_manager(old.id) then raise exception 'Only project coordinators or managers can complete projects';end if;
   if new.completed_by_profile_id is null then raise exception 'Select the completing employee';end if;
   if not exists(select 1 from jsonb_array_elements(public.project_completion_people(old.id)) p where p->>'id'=new.completed_by_profile_id::text) then raise exception 'Choose an employee who submitted work for this project';end if;
   if new.client_id is null or nullif(btrim(new.name),'') is null or coalesce(cardinality(new.production_team_ids),0)=0 or new.rate is null or new.rate<0 or new.rate::text in ('NaN','Infinity','-Infinity') or nullif(new.invoice_status::text,'') is null then raise exception 'Fill the required project details before completion';end if;
  end if;
 end if;return new;
end $$;

create or replace function public.qc_route_review(p_review uuid,p_action text,p_body text default '',p_recipient uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare r public.qc_reviews;begin
 select * into r from public.qc_reviews where id=p_review for update;
 if r.id is null or r.coordinator_released_at is null or not private.project_delivery_manager(r.project_id) then raise exception 'Project coordinator access required';end if;
 if p_action='client_review' then
  update public.projects set status='client_review' where id=r.project_id;
 elsif p_action='internal_correction' then
  if length(trim(coalesce(p_body,''))) not between 1 and 5000 or not exists(select 1 from jsonb_array_elements(private.qc_artist_people(r.project_id,r.task_id)) p where p->>'id'=p_recipient::text) then raise exception 'Select an assigned employee and describe the correction';end if;
  insert into public.qc_notes(review_id,author_id,recipient_id,body) values(r.id,auth.uid(),p_recipient,trim(p_body));
  update public.qc_reviews set state='corrections',updated_at=now() where id=r.id;
  insert into public.qc_notifications(review_id,recipient_id,message) values(r.id,p_recipient,'Your coordinator requested internal corrections.');
 else raise exception 'Invalid QC route';end if;
 perform private.record_event(r.project_id,'QC route: '||p_action,jsonb_build_object('review',r.id));
end $$;

-- Remove the current queue from active views, retaining reviews and notes as history.
-- Fresh employee confirmations or coordinator submissions can release reviews again.
alter table public.qc_reviews add column if not exists prelaunch_released_at timestamptz;
update public.qc_reviews set prelaunch_released_at=coalesce(prelaunch_released_at,coordinator_released_at),coordinator_released_at=null where coordinator_released_at is not null;
create or replace function public.qc_activity_data(p_from date,p_through date) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('admin','manager','director')) then raise exception 'Leadership access required';end if;
 if p_from is null or p_through is null or p_through<p_from or p_through-p_from>366 then raise exception 'Choose a valid date range of up to one year';end if;
 return coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
 select e.id,e.review_id,e.action,e.previous_state,e.state,e.note,e.created_at,u.full_name as actor,p.name as project,p.project_code as code,c.name as client,t.title as task,ru.full_name as reviewer
 from public.qc_events e join public.qc_reviews r on r.id=e.review_id join public.projects p on p.id=r.project_id
 left join public.clients c on c.id=p.client_id left join public.tasks t on t.id=r.task_id
 left join public.profiles u on u.id=e.actor_id left join public.profiles ru on ru.id=e.reviewer_id
 where r.coordinator_released_at is not null and e.created_at>=r.coordinator_released_at and e.created_at>=p_from::timestamp at time zone 'Asia/Kolkata' and e.created_at<(p_through+1)::timestamp at time zone 'Asia/Kolkata'
 order by e.created_at desc limit 1000)x),'[]'::jsonb);
end $$;
notify pgrst,'reload schema';
commit;
