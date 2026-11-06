begin;
-- First completed month owns the sale, even while further work is in progress.
create or replace function private.project_sales_completion() returns trigger
language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
   new.sales_completed_at:=null;
 else
   new.sales_completed_at:=old.sales_completed_at;
 end if;
 if new.status::text='completed' and new.sales_completed_at is null then
   new.sales_completed_at:=now();
 end if;
 if new.status::text='rejected' then
   new.rate:=null;
 end if;
 return new;
end $$;

create or replace function public.employee_sales_summary() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare month_start date:=(date_trunc('month',now() at time zone 'Asia/Kolkata'))::date;begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 return (select jsonb_build_object('month',to_char(month_start,'YYYY-MM'),'month_total',coalesce(sum(c.amount) filter(where (p.sales_completed_at at time zone 'Asia/Kolkata')::date>=month_start and (p.sales_completed_at at time zone 'Asia/Kolkata')::date<(month_start+interval '1 month')::date),0),
 'all_time_total',coalesce(sum(c.amount),0),'credited_projects',count(*) filter(where c.amount>0))
 from public.project_sales_credits c join public.projects p on p.id=c.project_id
 where c.profile_id=auth.uid() and p.is_active and p.status::text not in ('rejected','cancelled') and p.sales_completed_at is not null);
end $$;

create or replace function public.team_daily_overview(p_from date,p_through date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare viewer public.profiles;begin
 select * into viewer from public.profiles where id=auth.uid() and is_active;
 if viewer.id is null or viewer.role::text not in ('associate_lead','team_lead') or viewer.team_id is null then raise exception 'An active team lead with a linked team is required';end if;
 if p_from is null or p_through is null or p_from>p_through or p_through-p_from>366 then raise exception 'Choose a valid date range of up to one year';end if;
 return jsonb_build_object('team_name',(select name from public.teams where id=viewer.team_id),
 'people',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name) order by p.full_name) from public.profiles p where p.team_id=viewer.team_id and p.is_active),'[]'::jsonb),
 'sales',coalesce((select jsonb_agg(jsonb_build_object('profile_id',c.profile_id,'name',u.full_name,'project_id',p.id,'project_code',p.project_code,'project_name',p.name,'client_name',cl.name,'amount',c.amount,'completion_day',(p.sales_completed_at at time zone 'Asia/Kolkata')::date,'source',c.source) order by p.sales_completed_at desc)
 from public.project_sales_credits c join public.projects p on p.id=c.project_id join public.profiles u on u.id=c.profile_id left join public.clients cl on cl.id=p.client_id
 where c.team_id=viewer.team_id and c.amount>0 and p.is_active and p.status::text not in ('rejected','cancelled') and (p.sales_completed_at at time zone 'Asia/Kolkata')::date between p_from and p_through),'[]'::jsonb),
 'monthly_sales',coalesce((select jsonb_agg(jsonb_build_object('profile_id',null,'name','Team project','project_id',p.id,'project_code',p.project_code,'project_name',p.name,'client_name',c.name,'amount',p.rate,'completion_day',(p.sales_completed_at at time zone 'Asia/Kolkata')::date,'source','team_completion')) from public.projects p left join public.clients c on c.id=p.client_id where p.sales_credit_team_id=viewer.team_id and p.is_active and p.status::text not in ('rejected','cancelled') and (p.sales_completed_at at time zone 'Asia/Kolkata')::date between p_from and p_through),'[]'::jsonb),
 'work',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'profile_id',e.profile_id,'name',e.full_name,'task_title',t.title,'project_code',p.project_code,'status',a.status::text,'task_status',t.status::text,'assigned_at',a.assigned_at,'completed_at',a.completed_at,'deadline_at',a.deadline_at) order by a.assigned_at desc)
 from public.task_assignments a join public.employees e on e.id=a.employee_id join public.tasks t on t.id=a.task_id join public.projects p on p.id=t.project_id
 join public.profiles u on u.id=e.profile_id and u.team_id=viewer.team_id and u.is_active
 where e.is_active and t.archived_at is null and a.status::text<>'rejected' and (a.assigned_at at time zone 'Asia/Kolkata')::date<=p_through
 and (a.completed_at is null or (a.completed_at at time zone 'Asia/Kolkata')::date>=p_from)),'[]'::jsonb));
end $$;

notify pgrst,'reload schema';
commit;
