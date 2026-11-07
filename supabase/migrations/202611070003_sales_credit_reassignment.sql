begin;
-- Explicit full-credit reassignment. Existing shares become zero, preserving
-- their rows, and the change is recorded in the project audit history.
create function public.reassign_project_sales_credit(p_project uuid,p_profile uuid,p_expected jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare project public.projects; worker_team uuid; current_shares jsonb; expected_shares jsonb;
begin
 if not public.team_sales_access() then raise exception 'Sales leadership access required';end if;
 select * into project from public.projects where id=p_project for update;
 if not found or not project.is_active or project.status::text<>'completed' or project.sales_completed_at is null or project.rate is null or project.rate<=0 then raise exception 'Choose an active completed project with a positive base rate';end if;
 if project.monthly_team_project or project.sales_credit_team_id is not null or private.team_credit_project(project.production_team_ids) then raise exception 'Team-credited projects cannot be allocated to employees';end if;
 select p.team_id into worker_team from public.profiles p
 join auth.users u on u.id=p.id
 where p.id=p_profile and p.is_active and exists(select 1 from public.employees e where e.profile_id=p.id and e.is_active);
 if not found then raise exception 'Choose a verified active employee';end if;
 if p_expected is null or jsonb_typeof(p_expected)<>'array' then raise exception 'Refresh the current allocations before reassigning';end if;
 select coalesce(jsonb_agg(jsonb_build_object('profile_id',profile_id,'amount',amount) order by profile_id),'[]'::jsonb) into current_shares from public.project_sales_credits where project_id=p_project and amount>0;
 select coalesce(jsonb_agg(jsonb_build_object('profile_id',(v->>'profile_id')::uuid,'amount',(v->>'amount')::numeric) order by (v->>'profile_id')::uuid),'[]'::jsonb) into expected_shares from jsonb_array_elements(p_expected) v;
 if current_shares<>expected_shares then raise exception 'Allocations changed. Refresh and review them before reassigning';end if;
 update public.project_sales_credits set amount=0,credited_by=auth.uid(),source='manual',updated_at=now() where project_id=p_project and amount<>0;
 insert into public.project_sales_credits(project_id,profile_id,amount,credited_by,team_id,source)
 values(p_project,p_profile,project.rate,auth.uid(),worker_team,'manual')
 on conflict(project_id,profile_id) do update set amount=excluded.amount,credited_by=excluded.credited_by,team_id=excluded.team_id,source='manual',updated_at=now();
 perform private.record_event(p_project,'Sales credit reassigned',jsonb_build_object('previous_shares',current_shares,'credited_employee',p_profile,'amount',project.rate));
end $$;
revoke all on function public.reassign_project_sales_credit(uuid,uuid,jsonb) from public,anon;
grant execute on function public.reassign_project_sales_credit(uuid,uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
