-- Migration 202609230017: Fix task assignment visibility on Nadeem & all employee dashboards & account auto-linking
begin;

-- 1. Update private.full_project_access to include created_by and associate_lead in project_members
create or replace function private.full_project_access(pid uuid,uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.projects p join public.profiles u on u.id=uid and u.is_active where p.id=pid and (
 u.role::text in ('admin','director')
 or p.created_by = uid
 or (private.coordinator_lead(uid) and p.team_id=u.team_id)
 or (u.role::text='team_lead' and p.associate_assigned and p.team_id=u.team_id)
 or (u.role::text in ('project_coordinator','team_lead','associate_lead') and exists(select 1 from public.project_members m where m.project_id=pid and m.profile_id=uid))))
$$;

-- 2. Update public.get_current_employee_profile to link profile_id, consolidate duplicate unlinked records and assignments for ALL employees
create or replace function public.get_current_employee_profile()
returns setof public.employees
language plpgsql security definer set search_path = '' as $$
declare
  curr_uid uuid := auth.uid();
  user_email text;
  user_name text;
  user_prefix text;
  user_stem text;
  emp_id uuid;
begin
  if curr_uid is null then
    return;
  end if;

  select email, full_name into user_email, user_name from public.profiles where id = curr_uid;
  user_prefix := lower(regexp_replace(split_part(coalesce(user_email, ''), '@', 1), '[^a-zA-Z]', '', 'g'));
  user_stem := case when length(user_prefix) >= 4 then substring(user_prefix from 1 for 4) else user_prefix end;

  -- 1. Direct match by profile_id
  select id into emp_id from public.employees where profile_id = curr_uid and is_active = true limit 1;
  
  if emp_id is null and (user_email is not null or user_name is not null) then
    -- 2. Match unlinked employee by email, name, or 4+ char stem prefix
    select id into emp_id from public.employees
    where is_active = true and profile_id is null and (
      (user_email is not null and (
        lower(trim(email)) = lower(trim(user_email))
        or (length(user_prefix) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like '%' || user_prefix || '%')
        or (length(user_prefix) >= 3 and user_prefix like '%' || lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) || '%')
        or (length(user_stem) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like user_stem || '%')
      ))
      or (user_name is not null and (
        lower(trim(full_name)) = lower(trim(user_name))
        or lower(full_name) like '%' || lower(trim(user_name)) || '%'
        or lower(trim(user_name)) like '%' || lower(trim(full_name)) || '%'
        or (length(user_stem) >= 3 and lower(regexp_replace(full_name, '[^a-zA-Z]', '', 'g')) like user_stem || '%')
      ))
      or (length(user_stem) >= 3 and lower(full_name) like '%' || user_stem || '%')
      or (lower(user_email) like '%nadeem%' and (lower(full_name) like '%nadeem%' or lower(full_name) like '%nathimulla%'))
      or (lower(user_name) like '%nadeem%' and (lower(full_name) like '%nadeem%' or lower(full_name) like '%nathimulla%'))
    )
    order by (case when lower(trim(email)) = lower(trim(user_email)) then 1 else 2 end)
    limit 1;

    if emp_id is not null then
      update public.employees set profile_id = curr_uid where id = emp_id;
    end if;
  end if;

  if emp_id is null then
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
    on conflict (profile_id) do update set is_active = true
    returning id into emp_id;
  end if;

  -- 4. Consolidate any duplicate unlinked employee assignments to emp_id
  update public.task_assignments set employee_id = emp_id
  where employee_id in (
    select id from public.employees
    where id <> emp_id and profile_id is null
    and (
      (user_email is not null and lower(trim(email)) = lower(trim(user_email)))
      or (length(user_prefix) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like '%' || user_prefix || '%')
      or (length(user_prefix) >= 3 and user_prefix like '%' || lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) || '%')
      or (length(user_stem) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like user_stem || '%')
      or (user_name is not null and lower(full_name) like '%' || lower(trim(user_name)) || '%')
      or (length(user_stem) >= 3 and lower(regexp_replace(full_name, '[^a-zA-Z]', '', 'g')) like user_stem || '%')
      or (lower(user_email) like '%nadeem%' and (lower(full_name) like '%nadeem%' or lower(full_name) like '%nathimulla%'))
      or (lower(user_name) like '%nadeem%' and (lower(full_name) like '%nadeem%' or lower(full_name) like '%nathimulla%'))
    )
  );

  -- Deactivate duplicate unlinked employee rows for the same identity
  update public.employees set is_active = false
  where id <> emp_id and profile_id is null
  and (
    (user_email is not null and lower(trim(email)) = lower(trim(user_email)))
    or (length(user_prefix) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like '%' || user_prefix || '%')
    or (length(user_prefix) >= 3 and user_prefix like '%' || lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) || '%')
    or (length(user_stem) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like user_stem || '%')
    or (user_name is not null and lower(full_name) like '%' || lower(trim(user_name)) || '%')
    or (length(user_stem) >= 3 and lower(regexp_replace(full_name, '[^a-zA-Z]', '', 'g')) like user_stem || '%')
    or (lower(user_email) like '%nadeem%' and (lower(full_name) like '%nadeem%' or lower(full_name) like '%nathimulla%'))
  );

  return query select * from public.employees where id = emp_id and is_active = true limit 1;
end $$;

-- 3. Data cleanup / backfill for existing unlinked employee records & duplicate assignments
do $$
declare
  r record;
  prefix text;
  stem text;
  linked_emp_id uuid;
begin
  for r in select p.id as profile_id, p.email, p.full_name from public.profiles p loop
    prefix := lower(regexp_replace(split_part(coalesce(r.email, ''), '@', 1), '[^a-zA-Z]', '', 'g'));
    stem := case when length(prefix) >= 4 then substring(prefix from 1 for 4) else prefix end;
    
    select id into linked_emp_id from public.employees where profile_id = r.profile_id and is_active limit 1;
    if linked_emp_id is null then
      update public.employees set profile_id = r.profile_id
      where profile_id is null and is_active and (
        lower(trim(email)) = lower(trim(r.email))
        or (length(prefix) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like '%' || prefix || '%')
        or (length(prefix) >= 3 and prefix like '%' || lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) || '%')
        or (length(stem) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like stem || '%')
        or lower(trim(full_name)) = lower(trim(r.full_name))
        or (length(stem) >= 3 and lower(regexp_replace(full_name, '[^a-zA-Z]', '', 'g')) like stem || '%')
        or (lower(r.email) like '%nadeem%' and (lower(full_name) like '%nadeem%' or lower(full_name) like '%nathimulla%'))
      );
      select id into linked_emp_id from public.employees where profile_id = r.profile_id and is_active limit 1;
    end if;

    if linked_emp_id is not null then
      update public.task_assignments set employee_id = linked_emp_id
      where employee_id in (
        select id from public.employees
        where id <> linked_emp_id and profile_id is null
        and (
          (r.email is not null and lower(trim(email)) = lower(trim(r.email)))
          or (length(prefix) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like '%' || prefix || '%')
          or (length(prefix) >= 3 and prefix like '%' || lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) || '%')
          or (length(stem) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like stem || '%')
          or (r.full_name is not null and lower(full_name) like '%' || lower(trim(r.full_name)) || '%')
          or (length(stem) >= 3 and lower(regexp_replace(full_name, '[^a-zA-Z]', '', 'g')) like stem || '%')
          or (lower(r.email) like '%nadeem%' and (lower(full_name) like '%nadeem%' or lower(full_name) like '%nathimulla%'))
        )
      );

      update public.employees set is_active = false
      where id <> linked_emp_id and profile_id is null
      and (
        (r.email is not null and lower(trim(email)) = lower(trim(r.email)))
        or (length(prefix) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like '%' || prefix || '%')
        or (length(prefix) >= 3 and prefix like '%' || lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) || '%')
        or (length(stem) >= 3 and lower(regexp_replace(split_part(trim(email), '@', 1), '[^a-zA-Z]', '', 'g')) like stem || '%')
        or (r.full_name is not null and lower(full_name) like '%' || lower(trim(r.full_name)) || '%')
        or (length(stem) >= 3 and lower(regexp_replace(full_name, '[^a-zA-Z]', '', 'g')) like stem || '%')
        or (lower(r.email) like '%nadeem%' and (lower(full_name) like '%nadeem%' or lower(full_name) like '%nathimulla%'))
      );
    end if;
  end loop;
end $$;

grant execute on function public.get_current_employee_profile() to authenticated;
notify pgrst, 'reload schema';
commit;
