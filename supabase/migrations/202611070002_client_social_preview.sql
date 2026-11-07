begin;
alter table public.clients
 add column if not exists lead_source text,
 add column if not exists facebook_link text,
 add column if not exists instagram_link text,
 add column if not exists youtube_link text;
alter table public.clients add constraint clients_social_http_links check (
 (facebook_link is null or private.valid_client_links(array[facebook_link])) and
 (instagram_link is null or private.valid_client_links(array[instagram_link])) and
 (youtube_link is null or private.valid_client_links(array[youtube_link]))
);
alter table public.clients add constraint clients_known_lead_source check (lead_source is null or lead_source in ('field','campaign','cold_call','message'));
create policy clients_leadership_read on public.clients for select to authenticated
 using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and p.role::text in ('admin','associate_lead','manager','director')));

-- Read-only identity lookup for already visible assigned work, without HR/contact fields.
create function public.assignment_display_people(p_assignments uuid[])
returns table(id uuid,full_name text,employee_code text,team_id uuid)
language sql stable security definer set search_path='' as $$
 select distinct e.id,coalesce(p.full_name,e.full_name)::text,e.employee_code::text,e.team_id
 from public.task_assignments a
 join public.employees e on e.id=a.employee_id
 left join public.profiles p on p.id=e.profile_id
 join public.profiles viewer on viewer.id=auth.uid() and viewer.is_active
 where a.id=any(p_assignments) and private.can_view_task(a.task_id)
   and (viewer.role::text<>'project_coordinator' or a.assigned_by=auth.uid())
   and (viewer.role::text<>'employee' or e.profile_id=auth.uid());
$$;
revoke all on function public.assignment_display_people(uuid[]) from public,anon;
grant execute on function public.assignment_display_people(uuid[]) to authenticated;

-- Narrow editing permission for links and lead source; core client fields
-- retain their existing admin/coordinator UPDATE policy.
create function public.set_client_links_and_source(p_client uuid,p_patch jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result public.clients;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('admin','project_coordinator','associate_lead','manager','director')) then raise exception 'Client link and source editing access required';end if;
 if p_patch is null or jsonb_typeof(p_patch)<>'object' or exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('facebook_link','instagram_link','youtube_link','links','lead_source')) then raise exception 'Only client links and lead source can be updated here';end if;
 if exists(select 1 from jsonb_each(p_patch) f where f.key<>'links' and jsonb_typeof(f.value) not in ('string','null')) then raise exception 'Client fields must be text or null';end if;
 if p_patch?'links' and (jsonb_typeof(p_patch->'links')<>'array' or exists(select 1 from jsonb_array_elements(p_patch->'links') l where jsonb_typeof(l)<>'string')) then raise exception 'Client links must be an array of URLs';end if;
 update public.clients c set
  facebook_link=case when p_patch?'facebook_link' then nullif(trim(p_patch->>'facebook_link'),'') else c.facebook_link end,
  instagram_link=case when p_patch?'instagram_link' then nullif(trim(p_patch->>'instagram_link'),'') else c.instagram_link end,
  youtube_link=case when p_patch?'youtube_link' then nullif(trim(p_patch->>'youtube_link'),'') else c.youtube_link end,
  lead_source=case when p_patch?'lead_source' then nullif(trim(p_patch->>'lead_source'),'') else c.lead_source end,
  links=case when p_patch?'links' then array(select jsonb_array_elements_text(p_patch->'links')) else c.links end
 where c.id=p_client returning c.* into result;
 if not found then raise exception 'Client not found';end if;
 return to_jsonb(result);
end $$;
revoke all on function public.set_client_links_and_source(uuid,jsonb) from public,anon;
grant execute on function public.set_client_links_and_source(uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
