begin;
create or replace function public.workspace_team_directory() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare viewer public.profiles;begin
 select * into viewer from public.profiles where id=auth.uid() and is_active;
 if viewer.id is null then raise exception 'Active account required';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'full_name',p.full_name,
 'email',case when viewer.role::text='admin' then p.email else '' end,'employee_code',coalesce(e.employee_code,''),
 'role',p.role::text,'job_title',coalesce(p.job_title,e.job_title),'team_id',p.team_id,'team_name',t.name,
 'is_active',p.is_active,'created_at',p.created_at) order by p.full_name)
 from public.profiles p left join lateral(select employee_code,job_title from public.employees where profile_id=p.id and is_active order by created_at limit 1)e on true
 left join public.teams t on t.id=p.team_id
 where exists(select 1 from auth.users a where a.id=p.id)
 and (viewer.role::text in ('admin','manager','director') or (viewer.team_id is not null and p.team_id=viewer.team_id))
 and (viewer.role::text='admin' or p.is_active)),'[]'::jsonb);
end $$;
create table public.project_sales_credits(
 project_id uuid not null references public.projects(id) on delete cascade,
 profile_id uuid not null references public.profiles(id),
 amount numeric(14,2) not null check(amount>=0),
 credited_by uuid not null references public.profiles(id),
 updated_at timestamptz not null default now(),
 primary key(project_id,profile_id)
);
alter table public.project_sales_credits enable row level security;
revoke all on public.project_sales_credits from public,anon,authenticated;
create function public.employee_sales_summary() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare month_start date:=(date_trunc('month',now() at time zone 'Asia/Kolkata'))::date;begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 return (select jsonb_build_object('month',to_char(month_start,'YYYY-MM'),'month_total',coalesce(sum(c.amount) filter(where (p.sales_completed_at at time zone 'Asia/Kolkata')::date>=month_start and (p.sales_completed_at at time zone 'Asia/Kolkata')::date<(month_start+interval '1 month')::date),0),
 'all_time_total',coalesce(sum(c.amount),0),'credited_projects',count(*) filter(where c.amount>0))
 from public.project_sales_credits c join public.projects p on p.id=c.project_id
 where c.profile_id=auth.uid() and p.status::text='completed' and p.sales_completed_at is not null);
end $$;
create function public.project_sales_credit_directory() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.team_sales_access() then raise exception 'Sales leadership access required';end if;
 return jsonb_build_object('people',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name,'team',t.name) order by p.full_name)
 from public.profiles p left join public.teams t on t.id=p.team_id where p.is_active and exists(select 1 from auth.users a where a.id=p.id)),'[]'::jsonb),
 'credits',coalesce((select jsonb_agg(jsonb_build_object('project_id',c.project_id,'profile_id',c.profile_id,'name',p.full_name,'amount',c.amount,'updated_at',c.updated_at))
 from public.project_sales_credits c join public.profiles p on p.id=c.profile_id),'[]'::jsonb));
end $$;
create function public.set_project_sales_credit(p_project uuid,p_profile uuid,p_amount numeric) returns void
language plpgsql security definer set search_path='' as $$
declare rate_value numeric;allocated numeric;begin
 if not public.team_sales_access() then raise exception 'Sales leadership access required';end if;
 if p_amount is null or p_amount<0 or p_amount::text in ('NaN','Infinity','-Infinity') then raise exception 'Enter a valid non-negative amount';end if;
 select rate into rate_value from public.projects where id=p_project and status::text='completed' and sales_completed_at is not null for update;
 if not found or rate_value is null then raise exception 'Complete the project and set its base rate before crediting sales';end if;
 if not exists(select 1 from public.profiles where id=p_profile and is_active) then raise exception 'Choose an active account';end if;
 select coalesce(sum(amount),0) into allocated from public.project_sales_credits where project_id=p_project and profile_id<>p_profile;
 if allocated+round(p_amount,2)>rate_value then raise exception 'Employee credits cannot exceed the project base rate';end if;
 insert into public.project_sales_credits(project_id,profile_id,amount,credited_by) values(p_project,p_profile,round(p_amount,2),auth.uid())
 on conflict(project_id,profile_id) do update set amount=excluded.amount,credited_by=excluded.credited_by,updated_at=now();
end $$;
revoke all on function public.workspace_team_directory(),public.employee_sales_summary(),public.project_sales_credit_directory(),public.set_project_sales_credit(uuid,uuid,numeric) from public,anon;
grant execute on function public.workspace_team_directory(),public.employee_sales_summary(),public.project_sales_credit_directory(),public.set_project_sales_credit(uuid,uuid,numeric) to authenticated;
notify pgrst,'reload schema';
commit;
