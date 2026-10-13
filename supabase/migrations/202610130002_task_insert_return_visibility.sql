-- Preserve the Flow Force read boundary while allowing INSERT ... RETURNING.
-- A stable helper that queries tasks cannot see the newly inserted task in that statement.
begin;
do $$ begin
 if exists(select 1 from pg_policy where polrelid='public.tasks'::regclass and polname='flow_force_task_read') then
  execute $policy$alter policy flow_force_task_read on public.tasks using (
   (not private.flow_force() or (
    exists(select 1 from public.projects p where p.id=tasks.project_id and private.production_team(p.team_id))
    and (not exists(select 1 from public.task_assignments a where a.task_id=tasks.id and a.status::text<>'rejected')
     or exists(select 1 from public.task_assignments a join public.employees e on e.id=a.employee_id where a.task_id=tasks.id and a.status::text<>'rejected' and private.production_team(e.team_id)))
   ))
   and (private.role_of(auth.uid())<>'project_coordinator' or created_by=auth.uid()
    or exists(select 1 from public.task_assignments where task_id=tasks.id and assigned_by=auth.uid()))
  )$policy$;
 end if;
end $$;
notify pgrst, 'reload schema';
commit;
