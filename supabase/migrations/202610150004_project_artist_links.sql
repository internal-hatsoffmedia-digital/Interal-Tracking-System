begin;
create table public.project_artist_links(
 project_id uuid not null references public.projects(id) on delete cascade,
 profile_id uuid not null references public.profiles(id),
 coordinator_id uuid references public.profiles(id),
 source_artist text not null,source_coordinator text,
 linked_by uuid not null references public.profiles(id),linked_at timestamptz not null default now(),
 primary key(project_id,profile_id));
alter table public.project_artist_links enable row level security;
revoke all on public.project_artist_links from public,anon,authenticated;
create function public.project_artist_work(p_project uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare viewer public.profiles;begin
 select * into viewer from public.profiles where id=auth.uid() and is_active;
 if viewer.id is null then raise exception 'Active account required';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('project_id',p.id,'code',p.project_code,'project',p.name,'client',c.name,
 'profile_id',ep.id,'artist',ep.full_name,'source_artist',l.source_artist,'coordinator',coalesce(cp.full_name,l.source_coordinator),
 'coordinator_id',l.coordinator_id,'status',p.status::text,'started_at',p.started_at,'ended_at',p.ended_at,'deadline',p.target_deadline)
 order by p.project_code,ep.full_name)
 from public.project_artist_links l join public.projects p on p.id=l.project_id and p.is_active
 join public.profiles ep on ep.id=l.profile_id and ep.is_active left join public.profiles cp on cp.id=l.coordinator_id
 left join public.clients c on c.id=p.client_id
 where (p_project is null or p.id=p_project) and (
 viewer.role::text in ('admin','manager','director') or l.profile_id=viewer.id
 or (viewer.role::text in ('associate_lead','team_lead') and viewer.team_id is not null and
 (viewer.team_id=ep.team_id or viewer.team_id=any(p.production_team_ids) or viewer.team_id=p.team_id))
 or (viewer.role::text='project_coordinator' and (l.coordinator_id=viewer.id or exists(select 1 from public.project_members m where m.project_id=p.id and m.profile_id=viewer.id)))
 )),'[]'::jsonb);
end $$;
create or replace function private.qc_visible(pid uuid,tid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u join public.projects p on p.id=pid where u.id=auth.uid() and u.is_active and p.is_active and (
 private.qc_operator() or exists(select 1 from public.project_members m where m.project_id=pid and m.profile_id=u.id)
 or (u.role::text in ('associate_lead','team_lead') and u.team_id is not null and (u.team_id=any(p.production_team_ids) or u.team_id=p.team_id))
 or (tid is null and exists(select 1 from public.project_artist_links l where l.project_id=pid and (l.profile_id=u.id or l.coordinator_id=u.id)))
 or exists(select 1 from public.tasks t join public.task_assignments a on a.task_id=t.id and a.status::text<>'rejected'
 join public.employees e on e.id=a.employee_id and e.is_active where t.project_id=pid and (tid is null or t.id=tid) and e.profile_id=u.id)))
$$;
create function private.qc_artist_people(pid uuid,tid uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',u.id,'name',u.full_name) order by u.full_name),'[]'::jsonb)
 from public.profiles u where u.is_active and (
 exists(select 1 from public.tasks t join public.task_assignments a on a.task_id=t.id and a.status::text<>'rejected'
 join public.employees e on e.id=a.employee_id and e.is_active where t.project_id=pid and (tid is null or t.id=tid) and e.profile_id=u.id)
 or (tid is null and exists(select 1 from public.project_artist_links l where l.project_id=pid and l.profile_id=u.id)));
$$;
revoke all on function private.qc_artist_people(uuid,uuid) from public,anon,authenticated;
revoke all on function public.project_artist_work(uuid) from public,anon;
grant execute on function public.project_artist_work(uuid) to authenticated;
-- Existing QC functions are replaced below to accept verified project artists.
create or replace function public.qc_workspace() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 return jsonb_build_object('operator',private.qc_operator(),'admin',private.role_of(auth.uid())='admin',
 'reviewers',case when private.qc_operator() then coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name)) from public.qc_reviewers q join public.profiles p on p.id=q.profile_id where p.is_active),'[]'::jsonb) else '[]'::jsonb end,
 'members',case when private.role_of(auth.uid())='admin' then coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',full_name)) from public.profiles where is_active),'[]'::jsonb) else '[]'::jsonb end,
 'items',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'project',p.name,'code',p.project_code,'client',c.name,'task',t.title,'state',r.state,'reviewer_id',r.reviewer_id,'reviewer',u.full_name,'updated_at',r.updated_at,
 'can_resubmit',exists(select 1 from public.qc_notes n where n.review_id=r.id and n.recipient_id=auth.uid()),'file',t.footage_link,'assignees',private.qc_artist_people(p.id,r.task_id),
 'notes',coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'author',np.full_name,'recipient',rp.full_name,'body',n.body,'created_at',n.created_at) order by n.created_at) from public.qc_notes n join public.profiles np on np.id=n.author_id left join public.profiles rp on rp.id=n.recipient_id where n.review_id=r.id and (private.qc_operator() or private.role_of(auth.uid())<>'employee' or n.recipient_id=auth.uid() or n.author_id=auth.uid() or n.recipient_id is null)),'[]'::jsonb)) order by r.updated_at desc)
 from public.qc_reviews r join public.projects p on p.id=r.project_id left join public.clients c on c.id=p.client_id left join public.tasks t on t.id=r.task_id left join public.profiles u on u.id=r.reviewer_id
 where private.qc_visible(r.project_id,r.task_id) and (r.task_id is null or t.archived_at is null)),'[]'::jsonb));
end $$;

create or replace function public.qc_update(p_review uuid,p_action text,p_body text default '',p_recipient uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare r public.qc_reviews; next_state text; actor text;
begin
 select * into r from public.qc_reviews where id=p_review for update;
 if r.id is null or not private.qc_visible(r.project_id,r.task_id) then raise exception 'Review unavailable';end if;
 select full_name into actor from public.profiles where id=auth.uid();
 if p_action='resubmit' then
 if r.state<>'corrections' or not exists(select 1 from public.qc_notes where review_id=r.id and recipient_id=auth.uid()) then raise exception 'Only the correction recipient can resubmit';end if;
 next_state:='resubmitted';
 else
 if not private.qc_operator() then raise exception 'QC reviewer access required';end if;
 if p_action='claim' then
 if r.state not in ('waiting','resubmitted','corrections') or (r.reviewer_id is not null and r.reviewer_id<>auth.uid()) then raise exception 'This review is already claimed';end if;
 next_state:='checking';
 else
 if r.reviewer_id is distinct from auth.uid() or r.state not in ('checking','resubmitted') then raise exception 'Claim this review before checking it';end if;
 if p_action='corrections' then
 if p_recipient is null or not (exists(select 1 from public.tasks t join public.task_assignments a on a.task_id=t.id and a.status::text<>'rejected' join public.employees e on e.id=a.employee_id and e.is_active join public.profiles u on u.id=e.profile_id and u.is_active where t.project_id=r.project_id and (r.task_id is null or t.id=r.task_id) and e.profile_id=p_recipient) or (r.task_id is null and exists(select 1 from public.project_artist_links l join public.profiles ep on ep.id=l.profile_id and ep.is_active where l.project_id=r.project_id and l.profile_id=p_recipient))) then raise exception 'Select an active assigned employee';end if;
 next_state:='corrections';
 elsif p_action='approve' then next_state:='approved';
 else raise exception 'Invalid QC action';end if;end if;end if;
 if p_action<>'claim' then
 if length(trim(coalesce(p_body,''))) not between 1 and 5000 then raise exception 'Add a note (1–5000 characters)';end if;
 insert into public.qc_notes(review_id,author_id,recipient_id,body) values(r.id,auth.uid(),p_recipient,trim(p_body));end if;
 update public.qc_reviews set state=next_state,reviewer_id=case when p_action='claim' then auth.uid() else reviewer_id end,updated_at=now() where id=r.id;
 insert into public.qc_notifications(review_id,recipient_id,message)
 select r.id,u.id,coalesce(actor,'QC reviewer')||': '||replace(next_state,'_',' ') from public.profiles u join public.projects p on p.id=r.project_id where u.is_active and u.id<>auth.uid() and (
 u.id=p_recipient or u.id=r.reviewer_id or exists(select 1 from public.project_artist_links l where l.project_id=p.id and l.coordinator_id=u.id) or exists(select 1 from public.project_members m where m.project_id=p.id and m.profile_id=u.id)
 or (u.role::text in ('associate_lead','team_lead') and u.team_id is not null and (u.team_id=any(p.production_team_ids) or u.team_id=p.team_id)));
end $$;

notify pgrst,'reload schema';
commit;
