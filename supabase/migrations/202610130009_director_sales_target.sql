begin;
create function public.director_sales_target() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare target_month date:=(date_trunc('month',now() at time zone 'Asia/Kolkata'))::date;amount_value numeric;begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('director','admin')) then raise exception 'Director access required';end if;
 select amount into amount_value from public.sales_targets where month=target_month;
 if amount_value is null then select target into amount_value from public.sales_opening_periods where month=target_month;end if;
 return jsonb_build_object('month',target_month,'amount',amount_value);
end $$;
revoke all on function public.director_sales_target() from public,anon;
grant execute on function public.director_sales_target() to authenticated;
notify pgrst,'reload schema';
commit;
