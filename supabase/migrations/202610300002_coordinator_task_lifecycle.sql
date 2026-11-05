begin;
create function private.coordinator_task_editor(tid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.tasks t where t.id=tid and private.coordinator_task_writer(t.project_id))
$$;
revoke all on function private.coordinator_task_editor(uuid) from public,anon;
grant execute on function private.coordinator_task_editor(uuid) to authenticated;
create policy coordinator_lead_task_update on public.tasks for update to authenticated
 using(private.coordinator_task_writer(project_id)) with check(private.coordinator_task_writer(project_id));
create policy coordinator_lead_assignment_update on public.task_assignments for update to authenticated
 using(private.coordinator_task_editor(task_id)) with check(private.coordinator_assignment_writer(task_id,employee_id));

-- New editing rights must not let the acting lead rewrite the original creator/assigner.
create function private.coordinator_task_provenance_guard() returns trigger
language plpgsql security definer set search_path='' as $$
declare fields text[];k text;
begin
 if exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('associate_lead','team_lead')) then
  fields:=case when tg_table_name='tasks' then array['id','created_by','created_at'] else array['id','task_id','assigned_by','assigned_at','created_at'] end;
  foreach k in array fields loop
   if to_jsonb(new)->k is distinct from to_jsonb(old)->k then raise exception 'Original task and assignment provenance cannot be changed';end if;
  end loop;
 end if;
 return new;
end $$;
revoke all on function private.coordinator_task_provenance_guard() from public,anon,authenticated;
create trigger coordinator_task_provenance before update on public.tasks for each row execute function private.coordinator_task_provenance_guard();
create trigger coordinator_assignment_provenance before update on public.task_assignments for each row execute function private.coordinator_task_provenance_guard();

create function public.task_management_access() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u left join public.teams tm on tm.id=u.team_id
 where u.id=auth.uid() and u.is_active and (u.role::text in ('admin','project_coordinator')
 or (u.role::text='associate_lead' and tm.is_active and (tm.team_type::text in ('flow_force','project_coordination') or lower(trim(tm.name)) in ('flow force','project coordinators')))))
$$;
revoke all on function public.task_management_access() from public,anon;
grant execute on function public.task_management_access() to authenticated;
notify pgrst,'reload schema';
commit;
