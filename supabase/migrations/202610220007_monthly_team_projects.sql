begin;
alter table public.projects add column monthly_team_project boolean not null default false;
alter table public.projects add column billing_month date;
alter table public.projects add column sales_credit_team_id uuid references public.teams(id);
create function private.monthly_project_rules() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.monthly_team_project is distinct from old.monthly_team_project then raise exception 'Project billing type cannot be changed';end if;
 if not new.monthly_team_project then
  if new.billing_month is not null or new.sales_credit_team_id is not null then raise exception 'Monthly fields require a monthly team project';end if;return new;
 end if;
 if new.rate is not null and (new.rate<0 or new.rate::text in ('NaN','Infinity','-Infinity')) then raise exception 'Enter a valid monthly rate';end if;
 if new.billing_month is null or extract(day from new.billing_month)<>1 then raise exception 'Choose a billing month';end if;
 if coalesce(cardinality(new.production_team_ids),0)=0 or exists(select 1 from unnest(new.production_team_ids) tid where not exists(select 1 from public.teams t where t.id=tid and t.is_active and t.name in ('Digital Ninjas - M','Digital Ninjas - W'))) then raise exception 'Monthly projects require Digital Ninjas - M or Digital Ninjas - W';end if;
 if new.sales_credit_team_id is not null and not new.sales_credit_team_id=any(new.production_team_ids) then raise exception 'Select one of the project production teams';end if;
 if new.completed_by_profile_id is not null then raise exception 'Monthly projects credit a team, not an employee';end if;
 new.start_date:=new.billing_month;new.target_deadline:=(new.billing_month+interval '1 month - 1 day')::date;
 return new;
end $$;
create trigger monthly_project_rules before insert or update on public.projects for each row execute function private.monthly_project_rules();
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
  if new.status::text='completed' and new.monthly_team_project then
   if current_user<>(select pg_get_userbyid(relowner) from pg_class where oid='public.projects'::regclass) or not private.project_delivery_manager(old.id) then raise exception 'Use monthly team completion';end if;
   if new.sales_credit_team_id is null or new.completed_by_profile_id is not null then raise exception 'Choose one team for the full monthly rate';end if;
   if old.status::text<>'completed' and (not exists(select 1 from public.qc_reviews where project_id=old.id and coordinator_released_at is not null) or exists(select 1 from public.qc_reviews where project_id=old.id and coordinator_released_at is not null and state<>'approved')) then raise exception 'Finish Internal QC before completing the monthly project';end if;
   if new.rate is null or new.rate<0 or new.client_id is null or coalesce(cardinality(new.production_team_ids),0)=0 or nullif(new.invoice_status::text,'') is null then raise exception 'Fill the required monthly project details';end if;
   return new;
  end if;
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

create or replace function public.complete_monthly_project_work(p_project uuid,p_team uuid,p_patch jsonb default '{}'::jsonb) returns void language plpgsql security definer set search_path='' as $$
declare project public.projects;assignments text;begin
 if not private.project_delivery_manager(p_project) then raise exception 'Project coordinator access required';end if;
 select * into project from public.projects where id=p_project and is_active for update;
 if not found or not project.monthly_team_project then raise exception 'Choose a monthly team project';end if;
 if exists(select 1 from public.project_sales_credits where project_id=p_project and amount>0) then raise exception 'Employee credits already exist; resolve them before team completion';end if;
 if jsonb_typeof(p_patch)<>'object' or exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('client_id','name','description','category','final_link','remarks','production_team_ids','rate','start_date','target_deadline','health','invoice_status','series_title','started_at','ended_at','total_assets_required','completed_assets','pending_assets','billing_month')) then raise exception 'Unsupported project fields';end if;
 select string_agg(format('%I=(jsonb_populate_record(null::public.projects,$1)).%I',k,k),',') into assignments from jsonb_object_keys(p_patch) k;
 if assignments is not null then execute format('update public.projects set %s where id=$2',assignments) using p_patch,p_project;end if;
 update public.projects set sales_credit_team_id=p_team,completed_by_profile_id=null,status='completed' where id=p_project;
 select * into project from public.projects where id=p_project;
 perform private.record_event(p_project,'Monthly project completed and team credited',jsonb_build_object('team',p_team));
end $$;


create or replace function private.project_solo_sales_trigger() returns trigger language plpgsql security definer set search_path='' as $$
begin if not new.monthly_team_project and new.status::text='completed' and new.completed_by_profile_id is null then perform private.credit_solo_project(new.id);end if;return new;end $$;
create function private.monthly_personal_credit_guard() returns trigger language plpgsql security definer set search_path='' as $$begin if exists(select 1 from public.projects where id=new.project_id and monthly_team_project) then raise exception 'Monthly projects credit one team, not employees';end if;return new;end $$;
create trigger monthly_personal_credit_guard before insert or update on public.project_sales_credits for each row execute function private.monthly_personal_credit_guard();
revoke all on function private.monthly_personal_credit_guard() from public,anon,authenticated;
revoke all on function private.monthly_project_rules() from public,anon,authenticated;
revoke all on function public.complete_monthly_project_work(uuid,uuid,jsonb) from public,anon;
grant execute on function public.complete_monthly_project_work(uuid,uuid,jsonb) to authenticated;
create or replace function public.team_sales_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.team_sales_access() then raise exception 'Sales is restricted to Admin, Managers, Directors and the coordinator Associate Lead'; end if;
 return jsonb_build_object(
 'projects',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'project_code',p.project_code,'name',p.name,
 'client_id',p.client_id,'client_name',c.name,'status',p.status::text,'rate',p.rate,'created_at',p.created_at,
 'monthly_team_project',p.monthly_team_project,'billing_month',p.billing_month,'sales_credit_team_id',p.sales_credit_team_id,'sales_completed_at',p.sales_completed_at,'is_active',p.is_active,'can_edit',false,'team_id',p.team_id,'production_team_ids',p.production_team_ids) order by p.project_code)
 from public.projects p join public.clients c on c.id=p.client_id),'[]'::jsonb),
 'clients',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name) from public.clients),'[]'::jsonb),
 'teams',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name) from public.teams where is_active),'[]'::jsonb),
 'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('creator_name',p.full_name)) from public.project_finance_items i join public.profiles p on p.id=i.created_by),'[]'::jsonb));
end $$;
create or replace function public.project_finance_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.project_finance_access() then raise exception 'Project finance access is unavailable'; end if;
 with visible as (
  select p.id,p.project_code,p.name,p.client_id,c.name as client_name,p.status::text,p.rate,
   p.created_at,p.sales_completed_at,p.is_active,p.team_id,p.production_team_ids,p.monthly_team_project,p.billing_month,p.sales_credit_team_id,private.finance_edit_project(p.id) as can_edit
  from public.projects p join public.clients c on c.id=p.client_id
  where private.team_sales_project(p.id) or
   (private.role_of(auth.uid())::text='project_coordinator' and private.can_view_project(p.id))
 )
 select jsonb_build_object(
  'projects',coalesce((select jsonb_agg(to_jsonb(v) order by v.project_code) from visible v),'[]'::jsonb),
  'teams',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name) from public.teams where is_active),'[]'::jsonb),
 'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('creator_name',p.full_name) order by i.created_at)
   from public.project_finance_items i join visible v on v.id=i.project_id join public.profiles p on p.id=i.created_by),'[]'::jsonb)
 ) into result;
 return result;
end;
$$;
create or replace function public.team_daily_overview(p_from date,p_through date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare viewer public.profiles;begin
 select * into viewer from public.profiles where id=auth.uid() and is_active;
 if viewer.id is null or viewer.role::text not in ('associate_lead','team_lead') or viewer.team_id is null then raise exception 'An active team lead with a linked team is required';end if;
 if p_from is null or p_through is null or p_from>p_through or p_through-p_from>366 then raise exception 'Choose a valid date range of up to one year';end if;
 return jsonb_build_object('team_name',(select name from public.teams where id=viewer.team_id),
 'people',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name) order by p.full_name) from public.profiles p where p.team_id=viewer.team_id and p.is_active),'[]'::jsonb),
 'sales',coalesce((select jsonb_agg(jsonb_build_object('profile_id',c.profile_id,'name',u.full_name,'project_id',p.id,'project_code',p.project_code,'project_name',p.name,'client_name',cl.name,'amount',c.amount,'completion_day',(p.sales_completed_at at time zone 'Asia/Kolkata')::date,'source',c.source) order by p.sales_completed_at desc)
 from public.project_sales_credits c join public.projects p on p.id=c.project_id join public.profiles u on u.id=c.profile_id left join public.clients cl on cl.id=p.client_id
 where c.team_id=viewer.team_id and c.amount>0 and p.status::text='completed' and (p.sales_completed_at at time zone 'Asia/Kolkata')::date between p_from and p_through),'[]'::jsonb),
 'monthly_sales',coalesce((select jsonb_agg(jsonb_build_object('profile_id',null,'name','Team project','project_id',p.id,'project_code',p.project_code,'project_name',p.name,'client_name',c.name,'amount',p.rate,'completion_day',(p.sales_completed_at at time zone 'Asia/Kolkata')::date,'source','team_completion')) from public.projects p left join public.clients c on c.id=p.client_id where p.monthly_team_project and p.sales_credit_team_id=viewer.team_id and p.status::text='completed' and (p.sales_completed_at at time zone 'Asia/Kolkata')::date between p_from and p_through),'[]'::jsonb),
 'work',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'profile_id',e.profile_id,'name',e.full_name,'task_title',t.title,'project_code',p.project_code,'status',a.status::text,'task_status',t.status::text,'assigned_at',a.assigned_at,'completed_at',a.completed_at,'deadline_at',a.deadline_at) order by a.assigned_at desc)
 from public.task_assignments a join public.employees e on e.id=a.employee_id join public.tasks t on t.id=a.task_id join public.projects p on p.id=t.project_id
 join public.profiles u on u.id=e.profile_id and u.team_id=viewer.team_id and u.is_active
 where e.is_active and t.archived_at is null and a.status::text<>'rejected' and (a.assigned_at at time zone 'Asia/Kolkata')::date<=p_through
 and (a.completed_at is null or (a.completed_at at time zone 'Asia/Kolkata')::date>=p_from)),'[]'::jsonb));
end $$;
notify pgrst,'reload schema';commit;
