begin;
-- Minimal business directory for Team PC; no email, phone, salary or account credentials.
-- Reuse the existing worker boundary and supervisor role checks, without changing table RLS.
drop function if exists public.team_pc_workers();
create function public.team_pc_workers() returns table(id uuid,full_name text,team_id uuid,is_active boolean,team_type text)
language sql stable security definer set search_path='' as $$
 select e.id,e.full_name::text,e.team_id,e.is_active,t.team_type::text from public.employees e left join public.teams t on t.id=e.team_id
 where private.role_of(auth.uid()) in ('admin','associate_lead','team_lead')
 and private.visible_worker(e.id)
 order by e.full_name,e.id
$$;
revoke all on function public.team_pc_workers() from public,anon;
grant execute on function public.team_pc_workers() to authenticated;
notify pgrst,'reload schema';
commit;
