-- INTERNAL FORCE ONLY. Run this entire file in its Supabase SQL Editor.
-- Requires the existing Internal Force schema and coordinator access functions.
-- No records are deleted, no identities guessed, and no assignments moved.
begin;
create or replace function private.team_task_access(tid uuid,uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.task_assignments a
  join public.employees e on e.id=a.employee_id and e.is_active
  join public.profiles u on u.id=uid and u.is_active
  where a.task_id=tid and a.status::text<>'rejected'
  and (e.profile_id=uid or (
   u.role::text in ('associate_lead','team_lead')
   and not private.coordinator_lead(uid)
   and u.team_id is not null and e.team_id=u.team_id
  ))
 )
$$;
-- Only explicit account links may resolve the logged-in employee.
create or replace function public.get_current_employee_profile()
returns setof public.employees
language sql stable security definer set search_path='' as $$
 select e.* from public.employees e
 join public.profiles p on p.id=e.profile_id and p.is_active
 where e.profile_id=auth.uid() and e.is_active
$$;
revoke all on function public.get_current_employee_profile() from public,anon;
grant execute on function public.get_current_employee_profile() to authenticated;
notify pgrst, 'reload schema';
commit;
-- Read-only diagnosis: every assignee needs the correct active login linked.
-- If login_email is NULL, link the existing employee to the correct account in
-- Employees / Team Members. Do not create another employee or guess by name.
select e.id as employee_id,e.full_name,e.is_active as employee_active,
 p.id as account_id,p.email as login_email,p.role,p.is_active as account_active,
 count(a.id) filter(where a.status::text<>'rejected') as assignments
from public.employees e
left join public.profiles p on p.id=e.profile_id
left join public.task_assignments a on a.employee_id=e.id
group by e.id,e.full_name,e.is_active,p.id,p.email,p.role,p.is_active
order by e.full_name;
