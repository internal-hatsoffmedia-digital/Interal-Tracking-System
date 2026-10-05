begin;
alter table public.clients add column if not exists created_by uuid references public.profiles(id);
alter table public.clients add column if not exists assigned_coordinator_id uuid references public.employees(id);
alter table public.task_assignments add column if not exists deadline_at timestamptz;
comment on column public.task_assignments.deadline_at is 'Assignment deadline snapshot. Historical unknown deadlines remain null. Monthly timing uses Asia/Kolkata deadline month.';

create or replace function private.client_provenance() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
   if auth.uid() is not null then
     if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role::text in ('admin','director','associate_lead','team_lead','project_coordinator')) then raise exception 'Your role cannot create clients'; end if;
     new.created_by:=auth.uid(); new.created_at:=now();
   end if;
 elsif new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
   raise exception 'Client creator and creation time cannot be changed';
 end if;
 return new;
end $$;
drop trigger if exists workspace_client_provenance on public.clients;
create trigger workspace_client_provenance before insert or update on public.clients for each row execute function private.client_provenance();

create or replace function private.assignment_delivery_timing() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
   if new.deadline_at is null then select t.due_date into new.deadline_at from public.tasks t where t.id=new.task_id; end if;
   if exists(select 1 from public.employees e join public.teams t on t.id=e.team_id where e.id=new.employee_id and t.team_type::text='cut_masters') and new.deadline_at is null then
     raise exception 'Set an exact task deadline before assigning Cut Masters video work';
   end if;
   if auth.uid() is not null then new.assigned_by:=auth.uid();new.assigned_at:=now();end if;
   if new.status::text='completed' then new.completed_at:=now();else new.completed_at:=null;end if;
 else
   if new.deadline_at is distinct from old.deadline_at then raise exception 'Assignment deadline snapshot cannot be changed; create a new assignment for rescheduled work';end if;
   if new.task_id is distinct from old.task_id or new.employee_id is distinct from old.employee_id then raise exception 'Create a new assignment when changing a task or employee';end if;
   if old.completed_at is not null then new.completed_at:=old.completed_at;
   elsif new.status::text='completed' and old.status::text<>'completed' then new.completed_at:=now();
   else new.completed_at:=old.completed_at;end if;
 end if;
 return new;
end $$;
drop trigger if exists workspace_assignment_delivery_timing on public.task_assignments;
create trigger workspace_assignment_delivery_timing before insert or update on public.task_assignments for each row execute function private.assignment_delivery_timing();
revoke all on function private.client_provenance(),private.assignment_delivery_timing() from public,anon,authenticated;
commit;
