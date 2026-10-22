begin;
create or replace function private.credit_solo_project(pid uuid) returns void language plpgsql security definer set search_path='' as $$
declare project public.projects;worker uuid;worker_team uuid;actor uuid;workers integer;begin
 select * into project from public.projects where id=pid for update;
 if project.status::text is distinct from 'completed' or project.sales_completed_at is null or project.rate is null or project.rate<=0 then return;end if;
 if exists(select 1 from public.project_sales_credits where project_id=pid) then return;end if;
 select count(*),min(profile_id::text)::uuid into workers,worker from (
  select l.profile_id from public.project_artist_links l join public.profiles p on p.id=l.profile_id and p.is_active join public.employees e on e.profile_id=p.id and e.is_active where l.project_id=pid
  union
  select e.profile_id from public.tasks t join public.task_assignments a on a.task_id=t.id and a.status::text<>'rejected' join public.employees e on e.id=a.employee_id and e.is_active join public.profiles p on p.id=e.profile_id and p.is_active where t.project_id=pid and t.archived_at is null
 ) contributors;
 if workers<>1 then return;end if;
 select team_id into worker_team from public.profiles where id=worker;
 actor:=coalesce(auth.uid(),project.created_by,worker);
 insert into public.project_sales_credits(project_id,profile_id,amount,credited_by,team_id,source) values(pid,worker,project.rate,actor,worker_team,'solo_completion') on conflict do nothing;
 update public.projects set completed_by_profile_id=worker where id=pid and completed_by_profile_id is null;
end $$;
do $$declare p record;begin for p in select id from public.projects where status::text='completed' and is_active loop perform private.credit_solo_project(p.id);end loop;end $$;
notify pgrst,'reload schema';commit;
