begin;
alter table public.projects add column sales_completed_at timestamptz;
create function private.project_sales_completion() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
  new.sales_completed_at:=case when new.status::text='completed' then now() else null end;
 elsif new.status::text='completed' and old.status::text<>'completed' then
  new.sales_completed_at:=now();
 elsif new.status::text<>'completed' then new.sales_completed_at:=null;
 else new.sales_completed_at:=old.sales_completed_at;
 end if;
 return new;
end $$;
revoke all on function private.project_sales_completion() from public,anon,authenticated;
create trigger project_sales_completion before insert or update on public.projects for each row execute function private.project_sales_completion();
create or replace function public.team_sales_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.team_sales_access() then raise exception 'Sales is restricted to Admin, Managers, Directors and the coordinator Associate Lead'; end if;
 return jsonb_build_object(
 'projects',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'project_code',p.project_code,'name',p.name,
 'client_id',p.client_id,'client_name',c.name,'status',p.status::text,'rate',p.rate,'created_at',p.created_at,
 'sales_completed_at',p.sales_completed_at,'is_active',p.is_active,'can_edit',false,'team_id',p.team_id,'production_team_ids',p.production_team_ids) order by p.project_code)
 from public.projects p join public.clients c on c.id=p.client_id),'[]'::jsonb),
 'clients',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name) from public.clients),'[]'::jsonb),
 'teams',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name) from public.teams where is_active),'[]'::jsonb),
 'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('creator_name',p.full_name)) from public.project_finance_items i join public.profiles p on p.id=i.created_by),'[]'::jsonb));
end $$;
create or replace function public.project_finance_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.project_finance_access() then raise exception 'Project finance access is unavailable'; end if;
 with visible as (
  select p.id,p.project_code,p.name,p.client_id,c.name as client_name,p.status::text,p.rate,
   p.created_at,p.sales_completed_at,p.is_active,private.finance_edit_project(p.id) as can_edit
  from public.projects p join public.clients c on c.id=p.client_id
  where private.team_sales_project(p.id) or
   (private.role_of(auth.uid())::text='project_coordinator' and private.can_view_project(p.id))
 )
 select jsonb_build_object(
  'projects',coalesce((select jsonb_agg(to_jsonb(v) order by v.project_code) from visible v),'[]'::jsonb),
  'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('creator_name',p.full_name) order by i.created_at)
   from public.project_finance_items i join visible v on v.id=i.project_id join public.profiles p on p.id=i.created_by),'[]'::jsonb)
 ) into result;
 return result;
end;
$$;
notify pgrst,'reload schema';
commit;
