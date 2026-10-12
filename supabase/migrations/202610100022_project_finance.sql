begin;

create table public.project_finance_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null check(length(trim(label)) between 1 and 120),
  kind text not null check(kind in ('charge','expense')),
  amount numeric(12,2) not null check(amount >= 0),
  frequency text not null check(frequency in ('once','monthly')),
  start_month date not null check(extract(day from start_month)=1),
  end_month date check(end_month is null or (extract(day from end_month)=1 and end_month>=start_month)),
  notes text not null default '' check(length(notes)<=2000),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now(),
  check(frequency='monthly' or end_month is null)
);
create index project_finance_items_project_idx on public.project_finance_items(project_id);
alter table public.project_finance_items enable row level security;
revoke all on public.project_finance_items from public,anon,authenticated;

create function public.project_finance_access() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and
  (p.role::text in ('admin','manager','director','project_coordinator','associate_lead','team_lead') or private.sales_level() is not null))
$$;
create function private.finance_all_projects() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and
  (p.role::text in ('admin','manager','director') or private.sales_level() is not null))
$$;
create function private.finance_edit_project(pid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and
   (private.can_edit_project(pid) or (p.role::text in ('admin','manager','director') and private.can_view_project(pid))))
$$;

create function public.project_finance_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.project_finance_access() then raise exception 'Project finance access is unavailable'; end if;
 with visible as (
   select p.id,p.project_code,p.name,p.client_id,c.name as client_name,p.status::text,p.rate,
     p.created_at,p.is_active,private.finance_edit_project(p.id) as can_edit
   from public.projects p join public.clients c on c.id=p.client_id
   where private.finance_all_projects() or private.can_view_project(p.id)
 )
 select jsonb_build_object(
   'projects',coalesce((select jsonb_agg(to_jsonb(v) order by v.project_code) from visible v),'[]'::jsonb),
   'items',coalesce((select jsonb_agg(to_jsonb(i) || jsonb_build_object('creator_name',p.full_name) order by i.created_at)
     from public.project_finance_items i join visible v on v.id=i.project_id join public.profiles p on p.id=i.created_by),'[]'::jsonb)
 ) into result;
 return result;
end;
$$;

create function public.save_project_finance_item(
 p_project_id uuid,p_label text,p_kind text,p_amount numeric,p_frequency text,
 p_start_month date,p_end_month date default null,p_notes text default '',
 p_id uuid default null,p_expected_updated_at timestamptz default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare saved uuid;
begin
 if not private.finance_edit_project(p_project_id) then raise exception 'You cannot change finances for this project'; end if;
 if p_id is null then
   insert into public.project_finance_items(project_id,label,kind,amount,frequency,start_month,end_month,notes,created_by,updated_by)
   values(p_project_id,trim(p_label),p_kind,p_amount,p_frequency,p_start_month,p_end_month,coalesce(p_notes,''),auth.uid(),auth.uid()) returning id into saved;
 else
   update public.project_finance_items set label=trim(p_label),kind=p_kind,amount=p_amount,frequency=p_frequency,
     start_month=p_start_month,end_month=p_end_month,notes=coalesce(p_notes,''),updated_by=auth.uid(),updated_at=clock_timestamp()
   where id=p_id and project_id=p_project_id and updated_at=p_expected_updated_at returning id into saved;
   if saved is null then raise exception 'This entry changed. Refresh before saving.'; end if;
 end if;
 return saved;
end;
$$;
revoke all on function public.project_finance_access(),public.project_finance_data(),
 public.save_project_finance_item(uuid,text,text,numeric,text,date,date,text,uuid,timestamptz),
 private.finance_all_projects(),private.finance_edit_project(uuid) from public,anon,authenticated;
grant execute on function public.project_finance_access(),public.project_finance_data(),
 public.save_project_finance_item(uuid,text,text,numeric,text,date,date,text,uuid,timestamptz) to authenticated;
notify pgrst,'reload schema';
commit;
