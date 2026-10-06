begin;
-- Current Team PC directory contains only active employees linked to active login accounts.
-- Keep historical employees and their assignments intact; preserve existing oversight scope.
create or replace function public.team_pc_workers() returns table(id uuid,full_name text,team_id uuid,is_active boolean,team_type text)
language sql stable security definer set search_path='' as $$
 select e.id,p.full_name::text,e.team_id,e.is_active,t.team_type::text
 from public.employees e
 join public.profiles p on p.id=e.profile_id
 join auth.users u on u.id=p.id
 left join public.teams t on t.id=e.team_id
 where e.is_active and p.is_active
 and private.role_of(auth.uid()) in ('admin','director','associate_lead','team_lead')
 and private.visible_worker(e.id)
 order by p.full_name,e.id
$$;
revoke all on function public.team_pc_workers() from public,anon;
grant execute on function public.team_pc_workers() to authenticated;
notify pgrst,'reload schema';
commit;
