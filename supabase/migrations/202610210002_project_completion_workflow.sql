begin;
alter table public.projects add column completed_by_profile_id uuid references public.profiles(id);
alter table public.projects add column completed_by_name text;
create table public.project_work_submissions(project_id uuid not null references public.projects(id) on delete cascade,profile_id uuid not null references public.profiles(id),submitted_at timestamptz not null default now(),primary key(project_id,profile_id));
alter table public.project_work_submissions enable row level security;
revoke all on public.project_work_submissions from public,anon,authenticated;
create function private.project_contributor(pid uuid,worker uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p join public.employees e on e.profile_id=p.id and e.is_active where p.id=worker and p.is_active and (
 exists(select 1 from public.project_artist_links l where l.project_id=pid and l.profile_id=worker) or exists(select 1 from public.tasks t join public.task_assignments a on a.task_id=t.id and a.employee_id=e.id and a.status::text<>'rejected' where t.project_id=pid and t.archived_at is null)))
$$;
create function private.project_delivery_manager(pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and (p.role::text in ('admin','manager','director') or (p.role::text='project_coordinator' and private.full_project_access(pid)) or private.can_manage_project(pid)))
$$;
create function public.project_completion_people(p_project uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.project_delivery_manager(p_project) then raise exception 'Project coordinator access required';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name) order by p.full_name) from public.profiles p where private.project_contributor(p_project,p.id) and (
 exists(select 1 from public.project_work_submissions s where s.project_id=p_project and s.profile_id=p.id) or
 exists(select 1 from public.tasks t join public.task_assignments a on a.task_id=t.id and a.status::text='completed' join public.employees e on e.id=a.employee_id and e.profile_id=p.id where t.project_id=p_project and t.archived_at is null))),'[]'::jsonb);
end $$;
create function public.my_project_submissions() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'code',p.project_code,'name',p.name,'status',p.status::text,'client',c.name,'submitted_at',s.submitted_at) order by p.project_code) from public.projects p left join public.clients c on c.id=p.client_id left join public.project_work_submissions s on s.project_id=p.id and s.profile_id=auth.uid() where p.is_active and private.project_contributor(p.id,auth.uid())),'[]'::jsonb);
end $$;
create function public.submit_project_work(p_project uuid) returns void language plpgsql security definer set search_path='' as $$
declare current_status text;begin
 if not private.project_contributor(p_project,auth.uid()) then raise exception 'Only assigned contributors can submit project work';end if;
 select status::text into current_status from public.projects where id=p_project and is_active for update;
 if not found or current_status not in ('planning','in_progress','on_hold','client_correction') then raise exception 'This project is not open for submission';end if;
 insert into public.project_work_submissions(project_id,profile_id) values(p_project,auth.uid()) on conflict(project_id,profile_id) do update set submitted_at=now();
 update public.projects set status='internal_review',ended_at=case when started_at is not null then greatest(now(),started_at) else ended_at end where id=p_project;
 perform private.record_event(p_project,'Work submitted to Internal QC',jsonb_build_object('employee',auth.uid()));
end $$;
create or replace function private.project_solo_sales_trigger() returns trigger language plpgsql security definer set search_path='' as $$
begin if new.status::text='completed' and new.completed_by_profile_id is null then perform private.credit_solo_project(new.id);end if;return new;end $$;
create function private.project_required_workflow() returns trigger language plpgsql security definer set search_path='' as $$
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
  if new.status::text='client_review' and old.status::text<>'client_review' and (not exists(select 1 from public.qc_reviews where project_id=old.id) or exists(select 1 from public.qc_reviews where project_id=old.id and state<>'approved')) then raise exception 'Finish Internal QC before sending work to Client Review';end if;
  if new.status::text='completed' and old.status::text<>'completed' then
   if current_user<>(select pg_get_userbyid(relowner) from pg_class where oid='public.projects'::regclass) then raise exception 'Use coordinator completion to credit the employee';end if;
   if not private.project_delivery_manager(old.id) then raise exception 'Only project coordinators or managers can complete projects';end if;
   if new.completed_by_profile_id is null then raise exception 'Select the completing employee';end if;
   if not exists(select 1 from jsonb_array_elements(public.project_completion_people(old.id)) p where p->>'id'=new.completed_by_profile_id::text) then raise exception 'Choose an employee who submitted work for this project';end if;
   if not exists(select 1 from public.qc_reviews where project_id=old.id) or exists(select 1 from public.qc_reviews where project_id=old.id and state<>'approved') then raise exception 'Finish Internal QC before completing the project';end if;
   if new.client_id is null or nullif(btrim(new.name),'') is null or coalesce(cardinality(new.production_team_ids),0)=0 or new.rate is null or new.rate<0 or new.rate::text in ('NaN','Infinity','-Infinity') or nullif(new.invoice_status::text,'') is null then raise exception 'Fill the required project details before completion';end if;
  end if;
 end if;return new;
end $$;
create trigger project_required_workflow before insert or update on public.projects for each row execute function private.project_required_workflow();
create function public.complete_project_work(p_project uuid,p_employee uuid,p_patch jsonb default '{}'::jsonb) returns void language plpgsql security definer set search_path='' as $$
declare project public.projects;worker_team uuid;assignments text;begin
 if not private.project_delivery_manager(p_project) then raise exception 'Project coordinator access required';end if;
 select * into project from public.projects where id=p_project and is_active for update;
 if not found or project.status::text='completed' then raise exception 'Choose an active, unfinished project';end if;
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
revoke all on function private.project_contributor(uuid,uuid),private.project_delivery_manager(uuid),private.project_required_workflow() from public,anon,authenticated;
revoke all on function public.project_completion_people(uuid),public.my_project_submissions(),public.submit_project_work(uuid),public.complete_project_work(uuid,uuid,jsonb) from public,anon;
grant execute on function public.project_completion_people(uuid),public.my_project_submissions(),public.submit_project_work(uuid),public.complete_project_work(uuid,uuid,jsonb) to authenticated;
notify pgrst,'reload schema';commit;
