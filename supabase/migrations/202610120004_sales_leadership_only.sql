begin;
-- Production leadership retains work oversight, but no Sales access.
create or replace function public.team_sales_access() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and (
 p.role::text in ('admin','manager','director') or
 (p.role::text='associate_lead' and exists(select 1 from public.teams t where t.id=p.team_id and t.is_active
 and (t.team_type::text in ('flow_force','project_coordination') or lower(trim(t.name)) in ('flow force','project coordinators'))))))
$$;
create or replace function private.team_sales_project(pid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select public.team_sales_access() and exists(select 1 from public.projects where id=pid)
$$;
create or replace function public.project_finance_access() returns boolean
language sql stable security definer set search_path='' as $$
 select public.team_sales_access() or exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text='project_coordinator')
$$;
create or replace function private.finance_edit_project(pid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select public.project_finance_access() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and
 (private.can_edit_project(pid) or (p.role::text in ('admin','manager','director') and private.can_view_project(pid))))
$$;
create or replace function public.team_sales_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.team_sales_access() then raise exception 'Sales is restricted to Admin, Managers, Directors and the coordinator Associate Lead'; end if;
 return jsonb_build_object(
 'projects',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'project_code',p.project_code,'name',p.name,
 'client_id',p.client_id,'client_name',c.name,'status',p.status::text,'rate',p.rate,'created_at',p.created_at,
 'is_active',p.is_active,'can_edit',false,'team_id',p.team_id,'production_team_ids',p.production_team_ids) order by p.project_code)
 from public.projects p join public.clients c on c.id=p.client_id),'[]'::jsonb),
 'clients',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name) from public.clients),'[]'::jsonb),
 'teams',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name) from public.teams where is_active),'[]'::jsonb),
 'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('creator_name',p.full_name)) from public.project_finance_items i join public.profiles p on p.id=i.created_by),'[]'::jsonb));
end $$;
-- Existing opening ledger follows the same tightened Sales gate.
commit;
