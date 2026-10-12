begin;
-- Hat Panel project tracker; existing row policies continue to govern access.
alter table public.projects
  add column if not exists project_code text,
  add column if not exists category text,
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists final_link text,
  add column if not exists remarks text,
  add column if not exists rate numeric(12,2);
create unique index if not exists projects_project_code_unique on public.projects (lower(project_code)) where project_code is not null;
alter table public.projects add constraint projects_tracker_rate_nonnegative check (rate is null or rate >= 0);
alter table public.projects add constraint projects_tracker_time_order check (ended_at is null or (started_at is not null and ended_at >= started_at));
alter table public.projects add constraint projects_tracker_final_link check (final_link is null or final_link ~* '^https?://');
notify pgrst, 'reload schema';

commit;
