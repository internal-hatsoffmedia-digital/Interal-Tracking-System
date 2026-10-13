begin;
alter table public.project_sales_credits add column team_id uuid references public.teams(id);
alter table public.project_sales_credits add column source text not null default 'manual' check(source in ('manual','solo_completion'));
update public.project_sales_credits c set team_id=p.team_id from public.profiles p where p.id=c.profile_id;
create function private.credit_solo_project(pid uuid) returns void language plpgsql security definer set search_path='' as $$
declare project public.projects;worker uuid;worker_team uuid;actor uuid;workers integer;begin
 select * into project from public.projects where id=pid for update;
 if project.status::text is distinct from 'completed' or project.sales_completed_at is null or project.rate is null or project.rate<=0 then return;end if;
 if exists(select 1 from public.project_sales_credits where project_id=pid) then return;end if;
 select count(distinct e.profile_id),min(e.profile_id::text)::uuid into workers,worker
 from public.tasks t join public.task_assignments a on a.task_id=t.id join public.employees e on e.id=a.employee_id
 join public.profiles p on p.id=e.profile_id and p.is_active
 where t.project_id=pid and t.archived_at is null and a.status::text<>'rejected' and e.is_active;
 if workers<>1 then return;end if;
 select team_id into worker_team from public.profiles where id=worker;
 actor:=coalesce(auth.uid(),project.created_by,worker);
 insert into public.project_sales_credits(project_id,profile_id,amount,credited_by,team_id,source)
 values(pid,worker,project.rate,actor,worker_team,'solo_completion') on conflict do nothing;
end $$;
create function private.project_solo_sales_trigger() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status::text='completed' then perform private.credit_solo_project(new.id);end if;return new;
end $$;
create trigger project_solo_sales_credit after insert or update of status,rate on public.projects for each row execute function private.project_solo_sales_trigger();
revoke all on function private.credit_solo_project(uuid),private.project_solo_sales_trigger() from public,anon,authenticated;
-- Backfill using verified account links, never display names. Archived/rejected work is excluded.
do $$declare p record;begin for p in select id from public.projects where status::text='completed' loop perform private.credit_solo_project(p.id);end loop;end $$;
create or replace function public.set_project_sales_credit(p_project uuid,p_profile uuid,p_amount numeric) returns void
language plpgsql security definer set search_path='' as $$
declare rate_value numeric;allocated numeric;worker_team uuid;begin
 if not public.team_sales_access() then raise exception 'Sales leadership access required';end if;
 if p_amount is null or p_amount<0 or p_amount::text in ('NaN','Infinity','-Infinity') then raise exception 'Enter a valid non-negative amount';end if;
 select rate into rate_value from public.projects where id=p_project and status::text='completed' and sales_completed_at is not null for update;
 if not found or rate_value is null then raise exception 'Complete the project and set its base rate before crediting sales';end if;
 select team_id into worker_team from public.profiles where id=p_profile and is_active;
 if not found then raise exception 'Choose an active account';end if;
 select coalesce(sum(amount),0) into allocated from public.project_sales_credits where project_id=p_project and profile_id<>p_profile;
 if allocated+round(p_amount,2)>rate_value then raise exception 'Employee credits cannot exceed the project base rate';end if;
 insert into public.project_sales_credits(project_id,profile_id,amount,credited_by,team_id,source) values(p_project,p_profile,round(p_amount,2),auth.uid(),worker_team,'manual')
 on conflict(project_id,profile_id) do update set amount=excluded.amount,credited_by=excluded.credited_by,source='manual',updated_at=now();
end $$;
create function public.team_daily_overview(p_from date,p_through date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare viewer public.profiles;begin
 select * into viewer from public.profiles where id=auth.uid() and is_active;
 if viewer.id is null or viewer.role::text not in ('associate_lead','team_lead') or viewer.team_id is null then raise exception 'An active team lead with a linked team is required';end if;
 if p_from is null or p_through is null or p_from>p_through or p_through-p_from>366 then raise exception 'Choose a valid date range of up to one year';end if;
 return jsonb_build_object('team_name',(select name from public.teams where id=viewer.team_id),
 'people',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name) order by p.full_name) from public.profiles p where p.team_id=viewer.team_id and p.is_active),'[]'::jsonb),
 'sales',coalesce((select jsonb_agg(jsonb_build_object('profile_id',c.profile_id,'name',u.full_name,'project_id',p.id,'project_code',p.project_code,'project_name',p.name,'client_name',cl.name,'amount',c.amount,'completion_day',(p.sales_completed_at at time zone 'Asia/Kolkata')::date,'source',c.source) order by p.sales_completed_at desc)
 from public.project_sales_credits c join public.projects p on p.id=c.project_id join public.profiles u on u.id=c.profile_id left join public.clients cl on cl.id=p.client_id
 where c.team_id=viewer.team_id and c.amount>0 and p.status::text='completed' and (p.sales_completed_at at time zone 'Asia/Kolkata')::date between p_from and p_through),'[]'::jsonb),
 'work',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'profile_id',e.profile_id,'name',e.full_name,'task_title',t.title,'project_code',p.project_code,'status',a.status::text,'task_status',t.status::text,'assigned_at',a.assigned_at,'completed_at',a.completed_at,'deadline_at',a.deadline_at) order by a.assigned_at desc)
 from public.task_assignments a join public.employees e on e.id=a.employee_id join public.tasks t on t.id=a.task_id join public.projects p on p.id=t.project_id
 join public.profiles u on u.id=e.profile_id and u.team_id=viewer.team_id and u.is_active
 where e.is_active and t.archived_at is null and a.status::text<>'rejected' and (a.assigned_at at time zone 'Asia/Kolkata')::date<=p_through
 and (a.completed_at is null or (a.completed_at at time zone 'Asia/Kolkata')::date>=p_from)),'[]'::jsonb));
end $$;
revoke all on function public.team_daily_overview(date,date) from public,anon;
grant execute on function public.team_daily_overview(date,date) to authenticated;
notify pgrst,'reload schema';
commit;
