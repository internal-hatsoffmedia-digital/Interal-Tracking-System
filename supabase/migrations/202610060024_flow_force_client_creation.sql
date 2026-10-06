begin;
-- Allow active Flow Force members to create clients; retain existing role permissions.
create or replace function public.client_creation_allowed() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p left join public.teams t on t.id=p.team_id
 where p.id=auth.uid() and p.is_active and (
 (p.role::text in ('admin','director','associate_lead','team_lead','project_coordinator') and public.is_admin_or_coordinator())
 or t.team_type::text in ('flow_force','project_coordination') or lower(trim(t.name))='flow force'));
$$;
revoke all on function public.client_creation_allowed() from public;
grant execute on function public.client_creation_allowed() to authenticated;
drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients for insert to authenticated with check(public.client_creation_allowed());
create or replace function private.client_provenance() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
  if auth.uid() is not null then
   if not public.client_creation_allowed() then raise exception 'Your account cannot create clients'; end if;
   new.created_by:=auth.uid(); new.created_at:=now();
  end if;
 elsif new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
  raise exception 'Client creator and creation time cannot be changed';
 end if;
 return new;
end $$;
notify pgrst,'reload schema';
commit;
