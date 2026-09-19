-- Auto-Provision Employees from Supabase Authentication & Sync Teams
begin;

-- 1. Create function to automatically handle new Auth users
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  user_name text;
  code_suffix text;
begin
  -- Resolve display name from metadata or email
  user_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    initcap(replace(split_part(new.email, '@', 1), '.', ' '))
  );

  code_suffix := upper(substring(replace(new.id::text, '-', '') from 1 for 6));

  -- Create Profile if not exists
  insert into public.profiles (id, full_name, email, role, is_active)
  values (new.id, user_name, new.email, 'employee', true)
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    is_active = true;

  -- Create Employee if not exists
  insert into public.employees (profile_id, employee_code, full_name, email, is_active)
  values (new.id, 'EMP-' || code_suffix, user_name, new.email, true)
  on conflict (profile_id) do update set
    email = excluded.email,
    full_name = coalesce(public.employees.full_name, excluded.full_name),
    is_active = true;

  return new;
end $$;

-- Bind trigger on auth.users for any newly registered auth user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_created();

-- 2. Trigger to keep profiles and employees in sync when team_id or role is updated
create or replace function private.sync_employee_team()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Prevent recursive trigger loops
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if TG_TABLE_NAME = 'profiles' then
    if new.team_id is distinct from old.team_id or new.full_name is distinct from old.full_name or new.email is distinct from old.email then
      update public.employees
      set team_id = new.team_id,
          full_name = new.full_name,
          email = new.email
      where profile_id = new.id;
    end if;
  elsif TG_TABLE_NAME = 'employees' and new.profile_id is not null then
    if new.team_id is distinct from old.team_id or new.full_name is distinct from old.full_name or new.email is distinct from old.email then
      update public.profiles
      set team_id = new.team_id,
          full_name = new.full_name,
          email = new.email
      where id = new.profile_id;
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_sync_profile_to_employee on public.profiles;
create trigger trg_sync_profile_to_employee
  after update of team_id, full_name, email on public.profiles
  for each row execute function private.sync_employee_team();

drop trigger if exists trg_sync_employee_to_profile on public.employees;
create trigger trg_sync_employee_to_profile
  after update of team_id, full_name, email on public.employees
  for each row execute function private.sync_employee_team();

-- 3. Backfill all existing auth.users in Supabase so every registered account has a linked employee
do $$
declare
  u record;
  user_name text;
  code_suffix text;
begin
  for u in select id, email, raw_user_meta_data from auth.users loop
    user_name := coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      initcap(replace(split_part(u.email, '@', 1), '.', ' '))
    );
    code_suffix := upper(substring(replace(u.id::text, '-', '') from 1 for 6));

    insert into public.profiles (id, full_name, email, role, is_active)
    values (u.id, user_name, u.email, 'employee', true)
    on conflict (id) do update set
      email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      is_active = true;

    insert into public.employees (profile_id, employee_code, full_name, email, is_active)
    values (u.id, 'EMP-' || code_suffix, user_name, u.email, true)
    on conflict (profile_id) do update set
      email = excluded.email,
      full_name = coalesce(public.employees.full_name, excluded.full_name),
      is_active = true;
  end loop;
end $$;

-- 4. RPC to securely fetch or self-provision current logged in user's employee record
create or replace function public.get_current_employee_profile()
returns setof public.employees
language plpgsql security definer set search_path = '' as $$
declare
  curr_uid uuid := auth.uid();
  user_email text;
  emp record;
begin
  if curr_uid is null then
    return;
  end if;

  -- 1. Direct match by profile_id
  select * into emp from public.employees where profile_id = curr_uid and is_active = true limit 1;
  if emp.id is not null then
    return query select * from public.employees where id = emp.id;
    return;
  end if;

  -- 2. Try match by email from profiles
  select email into user_email from public.profiles where id = curr_uid;
  if user_email is not null then
    select * into emp from public.employees where lower(trim(email)) = lower(trim(user_email)) and is_active = true limit 1;
    if emp.id is not null then
      update public.employees set profile_id = curr_uid where id = emp.id;
      return query select * from public.employees where id = emp.id;
      return;
    end if;
  end if;

  -- 3. Self-provision from profiles if absent
  insert into public.employees (profile_id, employee_code, full_name, email, is_active)
  select
    p.id,
    'EMP-' || upper(substring(replace(p.id::text, '-', '') from 1 for 6)),
    coalesce(p.full_name, split_part(p.email, '@', 1)),
    p.email,
    true
  from public.profiles p
  where p.id = curr_uid
  on conflict (profile_id) do update set is_active = true;

  return query select * from public.employees where profile_id = curr_uid and is_active = true limit 1;
end $$;

grant execute on function public.get_current_employee_profile() to authenticated;

-- 5. Fix team_employee_boundary RLS policy so employees can always view their own record
drop policy if exists team_employee_boundary on public.employees;
create policy team_employee_boundary on public.employees as restrictive for select to public using (
  private.role_of(auth.uid()) is not null and (
    private.role_of(auth.uid()) in ('admin', 'director', 'project_coordinator')
    or private.coordinator_lead()
    or profile_id = auth.uid()
    or (team_id is not null and team_id = (select team_id from public.profiles where id = auth.uid()))
  )
);

-- 6. Link employees with profiles by email if profile_id is null
update public.employees e
set profile_id = p.id
from public.profiles p
where e.profile_id is null
  and lower(trim(e.email)) = lower(trim(p.email));

-- Clean up unlinked orphaned employee records
delete from public.employees
where profile_id is null
   or profile_id not in (select id from public.profiles);

notify pgrst, 'reload schema';
commit;

