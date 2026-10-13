-- Historical one-time reset executed with user approval on 2026-10-13.
-- DO NOT run during deployment; rerunning deletes newly created data.
-- One-time sales reset. Requires explicit live deletion confirmation.
-- Preserve projects, tasks, clients, accounts, teams and permissions.
begin;
delete from public.project_sales_credits;
delete from public.project_finance_items;
delete from public.sales_opening_entries;
delete from public.sales_opening_periods;
delete from public.sales_activities;
delete from public.sales_leads;
delete from public.sales_targets;
update public.projects set rate = null where rate is not null;
commit;
