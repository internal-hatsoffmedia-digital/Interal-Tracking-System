begin;
-- My Work is assignment-based. Keep timer access for the owner of an open
-- assignment even after the parent project has been completed for billing.
create or replace function private.my_timer_project(pid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select private.workspace_role() is not null and exists (
  select 1 from public.projects p
  where p.id=pid and p.is_active and p.status::text not in ('cancelled','rejected')
  and (
   exists (
    select 1 from public.task_assignments a
    join public.employees e on e.id=a.employee_id
    join public.tasks t on t.id=a.task_id
    where t.project_id=p.id and t.archived_at is null
      and e.profile_id=auth.uid() and e.is_active
      and a.status::text not in ('completed','rejected')
   )
   or (p.status::text<>'completed' and private.can_view_project(p.id) and (
     p.created_by=auth.uid()
     or exists(select 1 from public.project_members m where m.project_id=p.id and m.profile_id=auth.uid() and m.access_kind='assignee')
     or exists(select 1 from public.employees e where e.profile_id=auth.uid() and e.is_active and e.id=p.lead_employee_id)
   ))
  )
 );
$$;
notify pgrst,'reload schema';
commit;
