-- Read only: identify real login accounts and their coordinator-team mappings.
select p.id as account_id,p.full_name,p.role::text as role,
       p.team_id,t.name as team,p.is_active,
       e.id as employee_id
from public.profiles p
left join public.teams t on t.id=p.team_id
left join public.employees e on e.profile_id=p.id
order by p.full_name;

-- Read only: find legacy project members that need reassignment.
select p.id as project_id,p.name as project,
       u.id as account_id,u.full_name,u.role::text as role,m.access_kind
from public.project_members m
join public.projects p on p.id=m.project_id
join public.profiles u on u.id=m.profile_id
where u.role::text<>'project_coordinator' or not u.is_active
   or u.team_id is distinct from p.team_id
order by p.name,u.full_name;
