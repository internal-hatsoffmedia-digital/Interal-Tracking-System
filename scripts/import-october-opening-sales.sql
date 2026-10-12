-- Confirmed aggregate import. No client, salesperson or daily attribution is inferred.
begin;
insert into public.sales_opening_periods values ('2026-10-01',1000000,'2026-10-14',
 'User-confirmed October 2026 opening totals from spreadsheet screenshot; client and daily details pending. Individual tracking starts 14 October.')
on conflict do nothing;
do $$
declare r record; matched uuid; matches integer;
begin
 for r in select * from (values
 ('Cut Masters',56800::numeric,'cut_masters','cut masters'),
 ('Creative Clan · Comics',10000::numeric,'creative_clan','creative clan'),
 ('Creative Clan · Design',2000::numeric,'creative_clan','creative clan'),
 ('Websites',135000::numeric,'web_development','web crafters'),
 ('Social media packages',158500::numeric,'digital_marketing','digital ninjas')
 ) x(category,amount,team_type,team_name) loop
  select count(*),(array_agg(id))[1] into matches,matched from public.teams
   where is_active and (team_type::text=r.team_type or lower(trim(name))=r.team_name);
  if matches<>1 then raise exception 'Expected one active team for %, found %',r.category,matches; end if;
  insert into public.sales_opening_entries values('2026-10-01',r.category,matched,r.amount) on conflict do nothing;
  if not exists(select 1 from public.sales_opening_entries where month='2026-10-01' and category=r.category and team_id=matched and amount=r.amount) then
   raise exception 'Existing opening entry differs for %',r.category;
  end if;
 end loop;
 if (select sum(amount) from public.sales_opening_entries where month='2026-10-01')<>362300
 or not exists(select 1 from public.sales_opening_periods where month='2026-10-01' and target=1000000 and tracking_starts_on='2026-10-14') then
  raise exception 'Opening totals or target do not match confirmed figures';
 end if;
end $$;
commit;
select sum(amount) as opening_sales,1000000-sum(amount) as remaining_target from public.sales_opening_entries where month='2026-10-01';
