begin;
create table public.sales_opening_periods (
 month date primary key check (extract(day from month)=1),
 target numeric(14,2) not null check(target>=0),
 tracking_starts_on date not null,
 source_note text not null
);
create table public.sales_opening_entries (
 month date not null references public.sales_opening_periods(month),
 category text not null,
 team_id uuid not null references public.teams(id),
 amount numeric(14,2) not null check(amount>=0),
 primary key(month,category)
);
alter table public.sales_opening_periods enable row level security;
alter table public.sales_opening_entries enable row level security;
revoke all on public.sales_opening_periods,public.sales_opening_entries from public,anon,authenticated;
create function public.opening_sales_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare full_access boolean;
begin
 if not public.team_sales_access() then raise exception 'Sales access is unavailable'; end if;
 full_access:=private.finance_all_projects();
 return jsonb_build_object(
  'opening_sales',coalesce((select jsonb_agg(jsonb_build_object(
    'month',e.month,'category',e.category,'team_name',t.name,'amount',e.amount,'salesperson','Unattributed') order by e.category)
   from public.sales_opening_entries e join public.teams t on t.id=e.team_id
   where full_access or e.team_id=(select p.team_id from public.profiles p where p.id=auth.uid())),'[]'::jsonb),
  'opening_periods',case when full_access then coalesce((select jsonb_agg(to_jsonb(p) order by p.month) from public.sales_opening_periods p),'[]'::jsonb) else '[]'::jsonb end
 );
end;
$$;
revoke all on function public.opening_sales_data() from public,anon;
grant execute on function public.opening_sales_data() to authenticated;
commit;
