-- Workspace UI support. Uses the supplied profiles/employees/tasks/notifications schema.
begin;
create schema if not exists private;
create or replace function private.workspace_role() returns text language sql stable security definer set search_path='' as $$
 select role::text from public.profiles where id=auth.uid() and is_active
$$;
revoke all on function private.workspace_role() from public;
grant usage on schema private to authenticated;
grant execute on function private.workspace_role() to authenticated;
create function private.workspace_identity_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and private.workspace_role() is distinct from 'admin' then
  if tg_op='INSERT' then
   if new.id<>auth.uid() or new.role::text<>'employee' then raise exception 'Only administrators can set account roles';end if;
  elsif new.id is distinct from old.id or new.role is distinct from old.role or new.is_active is distinct from old.is_active then
   raise exception 'Only administrators can change account access';
  end if;
 end if;return new;
end $$;
create trigger workspace_identity_guard before insert or update on public.profiles for each row execute function private.workspace_identity_guard();

alter table public.tasks add column if not exists archived_at timestamptz;
create function private.workspace_archive_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.archived_at is distinct from old.archived_at and auth.uid() is not null and coalesce(private.workspace_role(),'') not in ('admin','associate_lead','project_coordinator') then raise exception 'Only task managers can archive tasks';end if;
 return new;
end $$;
create trigger workspace_archive_guard before update on public.tasks for each row execute function private.workspace_archive_guard();
-- Invoker function preserves the existing task/project RLS; no DELETE and no cascading data loss.
create function public.workspace_archive_task(p_id uuid,p_archive boolean) returns void language plpgsql security invoker set search_path='' as $$
begin
 if coalesce(private.workspace_role(),'') not in ('admin','associate_lead','project_coordinator') then raise exception 'Only task managers can archive tasks';end if;
 update public.tasks set archived_at=case when p_archive then now() else null end where id=p_id;
 if not found then raise exception 'Task unavailable or access denied';end if;
end $$;
revoke all on function public.workspace_archive_task(uuid,boolean) from public,anon;
grant execute on function public.workspace_archive_task(uuid,boolean) to authenticated;

create table public.workspace_announcements(
 id uuid primary key default gen_random_uuid(),title text not null check(length(trim(title)) between 1 and 180),
 image_data text not null check(length(image_data)<=2000000 and image_data ~ '^data:image/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$'),
 created_by uuid not null references public.profiles(id) default auth.uid(),created_at timestamptz not null default now()
);
alter table public.workspace_announcements enable row level security;
revoke all on public.workspace_announcements from anon,authenticated;
grant select,insert,delete on public.workspace_announcements to authenticated;
create policy announcement_read on public.workspace_announcements for select to authenticated using(private.workspace_role() is not null);
create policy announcement_create on public.workspace_announcements for insert to authenticated with check(private.workspace_role()='admin' and created_by=auth.uid());
create policy announcement_remove on public.workspace_announcements for delete to authenticated using(private.workspace_role()='admin');

-- One event when a task is assigned or reassigned to a different employee.
create function private.workspace_assignment_notification() returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid;task_title text;
begin
 if tg_op='UPDATE' then
  if new.employee_id is not distinct from old.employee_id and new.task_id is not distinct from old.task_id then return new;end if;
 end if;
 select e.profile_id into recipient from public.employees e join public.profiles p on p.id=e.profile_id where e.id=new.employee_id and e.is_active and p.is_active;
 if recipient is null then return new;end if;
 select title into task_title from public.tasks where id=new.task_id;
 insert into public.notifications(user_id,title,message,type,entity_type,entity_id)
 values(recipient,'Task assigned',coalesce(task_title,'A task')||' has been assigned to you.','task_assignment','task',new.task_id);
 return new;
end $$;
create trigger workspace_assignment_notification after insert or update of employee_id,task_id on public.task_assignments for each row execute function private.workspace_assignment_notification();

create function private.workspace_notification_visible(n_user uuid,n_task uuid) returns boolean language sql stable security definer set search_path='' as $$
 select n_user=auth.uid() and private.workspace_role() is not null and exists(
 select 1 from public.task_assignments a join public.employees e on e.id=a.employee_id where a.task_id=n_task and e.profile_id=auth.uid() and e.is_active)
$$;
revoke all on function private.workspace_notification_visible(uuid,uuid) from public;
grant execute on function private.workspace_notification_visible(uuid,uuid) to authenticated;
alter table public.notifications enable row level security;
create policy workspace_task_notification_read on public.notifications for select to authenticated using(type='task_assignment' and private.workspace_notification_visible(user_id,entity_id));
create policy workspace_task_notification_boundary on public.notifications as restrictive for select to public using(type is distinct from 'task_assignment' or private.workspace_notification_visible(user_id,entity_id));
create policy workspace_task_notification_insert on public.notifications as restrictive for insert to public with check(type is distinct from 'task_assignment');
create policy workspace_task_notification_update on public.notifications as restrictive for update to public using(type is distinct from 'task_assignment') with check(type is distinct from 'task_assignment');
create function public.workspace_read_notification(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.notifications set is_read=true,read_at=coalesce(read_at,now()) where id=p_id and type='task_assignment' and private.workspace_notification_visible(user_id,entity_id);
 if not found then raise exception 'Notification unavailable';end if;
end $$;
revoke all on function public.workspace_read_notification(uuid) from public,anon;
grant execute on function public.workspace_read_notification(uuid) to authenticated;
revoke all on function private.workspace_identity_guard(),private.workspace_archive_guard(),private.workspace_assignment_notification() from public;
-- Supabase Realtime is optional in a local PostgreSQL fixture, present on the hosted database.
do $$ declare tbl text;begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  foreach tbl in array array['notifications','workspace_announcements','project_notifications'] loop
   if to_regclass('public.'||tbl) is not null and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=tbl) then
    execute format('alter publication supabase_realtime add table public.%I',tbl);
   end if;
  end loop;
 end if;
end $$;
notify pgrst,'reload schema';
commit;
