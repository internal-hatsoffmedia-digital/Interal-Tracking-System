begin;
alter table public.projects add column production_team_ids uuid[] not null default '{}';
create function private.guard_project_production_teams() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.production_team_ids is distinct from old.production_team_ids
 and not (private.role_of(auth.uid())::text in ('admin','manager','director') or private.full_project_access(old.id)) then
  raise exception 'Only project managers can change production teams';
 end if;
 if cardinality(new.production_team_ids)>50 or exists(select 1 from unnest(new.production_team_ids) tid
  where tid is null or not exists(select 1 from public.teams where id=tid and is_active)) then
  raise exception 'Select active production teams';
 end if;
 return new;
end;
$$;
create trigger guard_project_production_teams before insert or update on public.projects
for each row execute function private.guard_project_production_teams();
create or replace function public.admin_access_directory() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if private.role_of(auth.uid()) is distinct from 'admin' then raise exception 'Administrator access required';end if;
 return jsonb_build_object('accounts',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'full_name',p.full_name,'email',p.email,'role',p.role::text,'team_id',p.team_id,'job_title',p.job_title,'is_active',p.is_active,'sales_access',s.access_level) order by p.full_name),'[]') from public.profiles p left join public.sales_permissions s on s.profile_id=p.id),
 'teams',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name) order by name),'[]') from public.teams where is_active));
end $$;
create function public.admin_set_access_profile(p_account uuid,p_role text,p_team uuid,p_sales text,p_expected jsonb,p_job_title text,p_expected_job_title text) returns void
language plpgsql security definer set search_path='' as $$
declare old_title text; title text:=nullif(trim(p_job_title),'');
begin
 if private.role_of(auth.uid()) is distinct from 'admin' then raise exception 'Administrator access required';end if;
 if length(title)>120 then raise exception 'Job title must be 120 characters or fewer';end if;
 select job_title into old_title from public.profiles where id=p_account for update;
 if not found then raise exception 'Account not found';end if;
 if old_title is distinct from p_expected_job_title then raise exception 'Job title changed. Refresh before saving';end if;
 perform public.admin_set_access(p_account,p_role,p_team,p_sales,p_expected);
 update public.profiles set job_title=title where id=p_account;
 update public.employees set job_title=title where profile_id=p_account;
 if old_title is distinct from title then
  insert into public.admin_access_history(actor_id,account_id,before_access,after_access)
  values(auth.uid(),p_account,jsonb_build_object('job_title',old_title),jsonb_build_object('job_title',title));
 end if;
end $$;
revoke all on function private.guard_project_production_teams() from public,anon,authenticated;
revoke all on function public.admin_set_access_profile(uuid,text,uuid,text,jsonb,text,text) from public,anon;
grant execute on function public.admin_set_access_profile(uuid,text,uuid,text,jsonb,text,text) to authenticated;
create or replace function private.team_sales_project(pid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u join public.projects p on p.id=pid
 where u.id=auth.uid() and u.is_active and (
  u.role::text in ('admin','director','manager')
  or (u.role::text='associate_lead' and exists(select 1 from public.teams team where team.id=u.team_id
   and (team.team_type::text in ('flow_force','project_coordination') or lower(trim(team.name)) in ('flow force','project coordinators'))))
  or (u.role::text in ('associate_lead','team_lead') and u.team_id is not null and (
   p.team_id=u.team_id or u.team_id=any(p.production_team_ids) or exists(
    select 1 from public.tasks t join public.task_assignments a on a.task_id=t.id
    join public.employees e on e.id=a.employee_id and e.is_active
    join public.profiles worker on worker.id=e.profile_id and worker.is_active
    where t.project_id=p.id and a.status::text<>'rejected'
      and e.team_id=u.team_id and worker.team_id=u.team_id
   )
  ))
 ))
$$;

commit;
