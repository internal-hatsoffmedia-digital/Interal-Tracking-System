begin;
-- Keep full birth dates separate from the shared assignment directory.
create table public.employee_birth_dates (
 employee_id uuid primary key references public.employees(id) on delete cascade,
 date_of_birth date not null check(date_of_birth>=date '1900-01-01' and date_of_birth<=current_date),
 updated_by uuid not null references public.profiles(id),
 updated_at timestamptz not null default now()
);
alter table public.employee_birth_dates enable row level security;
create policy employee_birth_dates_admin on public.employee_birth_dates for select to authenticated
 using(exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text='admin'));
revoke all on public.employee_birth_dates from public,anon,authenticated;
grant select on public.employee_birth_dates to authenticated;
create function public.set_employee_birth_date(p_employee uuid,p_date date) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text='admin') then raise exception 'Only Admin can edit employee birth dates';end if;
 if not exists(select 1 from public.employees where id=p_employee) then raise exception 'Employee not found';end if;
 if p_date is null then delete from public.employee_birth_dates where employee_id=p_employee;
 else insert into public.employee_birth_dates(employee_id,date_of_birth,updated_by) values(p_employee,p_date,auth.uid()) on conflict(employee_id) do update set date_of_birth=excluded.date_of_birth,updated_by=auth.uid(),updated_at=now();end if;
end $$;
revoke all on function public.set_employee_birth_date(uuid,date) from public,anon;
grant execute on function public.set_employee_birth_date(uuid,date) to authenticated;
notify pgrst,'reload schema';
commit;
