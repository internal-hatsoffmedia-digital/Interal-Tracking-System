begin;
create function private.project_creator_team() returns uuid
language sql stable security definer set search_path='' as $$
  select p.team_id
  from public.profiles p join public.teams t on t.id=p.team_id
  where p.id=auth.uid() and p.is_active
    and (p.role::text='project_coordinator' or (
      p.role::text='associate_lead' and t.is_active and (
        t.team_type::text in ('flow_force','project_coordination')
        or lower(trim(t.name)) in ('flow force','project coordinators')
      )
    ))
$$;
revoke all on function private.project_creator_team() from public,anon;
grant execute on function private.project_creator_team() to authenticated;

create function public.project_creation_access() returns boolean
language sql stable set search_path='' as $$
  select private.project_creator_team() is not null
$$;
revoke all on function public.project_creation_access() from public,anon;
grant execute on function public.project_creation_access() to authenticated;

alter policy project_create on public.projects with check (
  created_by=auth.uid() and team_id=private.project_creator_team()
);
alter policy coordinator_created_project_read on public.projects
  using (created_by=auth.uid() and team_id=private.project_creator_team());
create or replace function private.require_project_coordinator_on_insert() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is not null and private.project_creator_team() is null then
    raise exception 'Only project coordinators and their associate leads can create projects' using errcode='42501';
  end if;
  return new;
end
$$;
notify pgrst,'reload schema';
commit;
