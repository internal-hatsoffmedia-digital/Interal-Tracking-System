begin;
alter table public.employees enable row level security;
-- Read access remains governed by existing assignment/team policies.
drop policy if exists employee_admin_insert_boundary on public.employees;
create policy employee_admin_insert_boundary on public.employees as restrictive for insert to authenticated with check(private.role_of(auth.uid())='admin');
drop policy if exists employee_admin_update_boundary on public.employees;
create policy employee_admin_update_boundary on public.employees as restrictive for update to authenticated using(private.role_of(auth.uid())='admin') with check(private.role_of(auth.uid())='admin');
drop policy if exists employee_admin_delete_boundary on public.employees;
create policy employee_admin_delete_boundary on public.employees as restrictive for delete to authenticated using(private.role_of(auth.uid())='admin');
notify pgrst,'reload schema';
commit;
