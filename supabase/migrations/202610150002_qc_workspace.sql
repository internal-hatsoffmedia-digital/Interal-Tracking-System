begin;
create table public.qc_reviewers(profile_id uuid primary key references public.profiles(id), added_by uuid not null references public.profiles(id));
create table public.qc_reviews(
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 task_id uuid references public.tasks(id) on delete cascade, reviewer_id uuid references public.profiles(id),
 state text not null default 'waiting' check(state in ('waiting','checking','corrections','resubmitted','approved')),
 updated_at timestamptz not null default now());
create unique index qc_task_once on public.qc_reviews(task_id) where task_id is not null;
create unique index qc_project_once on public.qc_reviews(project_id) where task_id is null;
create table public.qc_notes(id uuid primary key default gen_random_uuid(),review_id uuid not null references public.qc_reviews(id) on delete cascade,
 author_id uuid not null references public.profiles(id),recipient_id uuid references public.profiles(id),body text not null check(length(body) between 1 and 5000),created_at timestamptz not null default now());
create table public.qc_notifications(id uuid primary key default gen_random_uuid(),review_id uuid not null references public.qc_reviews(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id),message text not null,created_at timestamptz not null default now(),read_at timestamptz);
alter table public.qc_reviewers enable row level security;
alter table public.qc_reviews enable row level security;
alter table public.qc_notes enable row level security;
alter table public.qc_notifications enable row level security;
revoke all on public.qc_reviewers,public.qc_reviews,public.qc_notes,public.qc_notifications from public,anon,authenticated;
create function private.qc_operator() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and
 (p.role::text in ('admin','manager','director') or exists(select 1 from public.qc_reviewers q where q.profile_id=p.id)))
$$;
create function private.qc_visible(pid uuid,tid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles u join public.projects p on p.id=pid where u.id=auth.uid() and u.is_active and p.is_active and (
 private.qc_operator() or exists(select 1 from public.project_members m where m.project_id=pid and m.profile_id=u.id)
 or (u.role::text in ('associate_lead','team_lead') and u.team_id is not null and (u.team_id=any(p.production_team_ids) or u.team_id=p.team_id))
 or exists(select 1 from public.tasks t join public.task_assignments a on a.task_id=t.id and a.status::text<>'rejected'
 join public.employees e on e.id=a.employee_id and e.is_active where t.project_id=pid and (tid is null or t.id=tid) and e.profile_id=u.id)))
$$;
create function private.qc_enqueue() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status::text in ('internal_review','sent_for_internal_review') and (tg_op='INSERT' or old.status::text is distinct from new.status::text) then
 if tg_table_name='tasks' then
 insert into public.qc_reviews(project_id,task_id) values(new.project_id,new.id)
 on conflict(task_id) where task_id is not null do update set state='waiting',reviewer_id=null,updated_at=now();
 else
 insert into public.qc_reviews(project_id) values(new.id)
 on conflict(project_id) where task_id is null do update set state='waiting',reviewer_id=null,updated_at=now();
 end if;end if;return new;
end $$;
create trigger qc_task_review after insert or update of status on public.tasks for each row execute function private.qc_enqueue();
create trigger qc_project_review after insert or update of status on public.projects for each row execute function private.qc_enqueue();
insert into public.qc_reviews(project_id,task_id) select project_id,id from public.tasks where archived_at is null and status::text in ('internal_review','sent_for_internal_review');
insert into public.qc_reviews(project_id) select id from public.projects where is_active and status::text in ('internal_review','sent_for_internal_review');
create function public.qc_workspace() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active) then raise exception 'Active account required';end if;
 return jsonb_build_object('operator',private.qc_operator(),'admin',private.role_of(auth.uid())='admin',
 'reviewers',case when private.qc_operator() then coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name)) from public.qc_reviewers q join public.profiles p on p.id=q.profile_id where p.is_active),'[]'::jsonb) else '[]'::jsonb end,
 'members',case when private.role_of(auth.uid())='admin' then coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',full_name)) from public.profiles where is_active),'[]'::jsonb) else '[]'::jsonb end,
 'items',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'project',p.name,'code',p.project_code,'client',c.name,'task',t.title,'state',r.state,'reviewer_id',r.reviewer_id,'reviewer',u.full_name,'updated_at',r.updated_at,
 'can_resubmit',exists(select 1 from public.qc_notes n where n.review_id=r.id and n.recipient_id=auth.uid()),'file',t.footage_link,'assignees',coalesce((select jsonb_agg(distinct jsonb_build_object('id',ep.id,'name',ep.full_name)) from public.tasks tx join public.task_assignments a on a.task_id=tx.id and a.status::text<>'rejected' join public.employees e on e.id=a.employee_id and e.is_active join public.profiles ep on ep.id=e.profile_id and ep.is_active where tx.project_id=p.id and (r.task_id is null or tx.id=r.task_id)),'[]'::jsonb),
 'notes',coalesce((select jsonb_agg(jsonb_build_object('id',n.id,'author',np.full_name,'recipient',rp.full_name,'body',n.body,'created_at',n.created_at) order by n.created_at) from public.qc_notes n join public.profiles np on np.id=n.author_id left join public.profiles rp on rp.id=n.recipient_id where n.review_id=r.id and (private.qc_operator() or private.role_of(auth.uid())<>'employee' or n.recipient_id=auth.uid() or n.author_id=auth.uid() or n.recipient_id is null)),'[]'::jsonb)) order by r.updated_at desc)
 from public.qc_reviews r join public.projects p on p.id=r.project_id left join public.clients c on c.id=p.client_id left join public.tasks t on t.id=r.task_id left join public.profiles u on u.id=r.reviewer_id
 where private.qc_visible(r.project_id,r.task_id) and (r.task_id is null or t.archived_at is null)),'[]'::jsonb));
end $$;
create function public.qc_set_reviewer(p_profile uuid,p_enabled boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if private.role_of(auth.uid()) is distinct from 'admin' then raise exception 'Admin access required';end if;
 if p_enabled then
 if not exists(select 1 from public.profiles where id=p_profile and is_active) then raise exception 'Active member required';end if;
 insert into public.qc_reviewers values(p_profile,auth.uid()) on conflict do nothing;
 else delete from public.qc_reviewers where profile_id=p_profile;
 update public.qc_reviews set reviewer_id=null,state=case when state='corrections' then state else 'waiting' end,updated_at=now() where reviewer_id=p_profile and state<>'approved';end if;
end $$;
create function public.qc_update(p_review uuid,p_action text,p_body text default '',p_recipient uuid default null) returns void language plpgsql security definer set search_path='' as $$
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
 if p_recipient is null or not exists(select 1 from public.tasks t join public.task_assignments a on a.task_id=t.id and a.status::text<>'rejected' join public.employees e on e.id=a.employee_id and e.is_active join public.profiles u on u.id=e.profile_id and u.is_active where t.project_id=r.project_id and (r.task_id is null or t.id=r.task_id) and e.profile_id=p_recipient) then raise exception 'Select an active assigned employee';end if;
 next_state:='corrections';
 elsif p_action='approve' then next_state:='approved';
 else raise exception 'Invalid QC action';end if;end if;end if;
 if p_action<>'claim' then
 if length(trim(coalesce(p_body,''))) not between 1 and 5000 then raise exception 'Add a note (1–5000 characters)';end if;
 insert into public.qc_notes(review_id,author_id,recipient_id,body) values(r.id,auth.uid(),p_recipient,trim(p_body));end if;
 update public.qc_reviews set state=next_state,reviewer_id=case when p_action='claim' then auth.uid() else reviewer_id end,updated_at=now() where id=r.id;
 insert into public.qc_notifications(review_id,recipient_id,message)
 select r.id,u.id,coalesce(actor,'QC reviewer')||': '||replace(next_state,'_',' ') from public.profiles u join public.projects p on p.id=r.project_id where u.is_active and u.id<>auth.uid() and (
 u.id=p_recipient or u.id=r.reviewer_id or exists(select 1 from public.project_members m where m.project_id=p.id and m.profile_id=u.id)
 or (u.role::text in ('associate_lead','team_lead') and u.team_id is not null and (u.team_id=any(p.production_team_ids) or u.team_id=p.team_id)));
end $$;
create function public.qc_notification_data() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select n.id,n.review_id,n.message,n.created_at,n.read_at from public.qc_notifications n join public.qc_reviews r on r.id=n.review_id where n.recipient_id=auth.uid() and private.qc_visible(r.project_id,r.task_id) order by n.created_at desc limit 50)x
$$;
create function public.qc_read_notification(p_id uuid) returns void language sql security definer set search_path='' as $$
 update public.qc_notifications set read_at=now() where id=p_id and recipient_id=auth.uid()
$$;
revoke all on function private.qc_operator(),private.qc_visible(uuid,uuid),private.qc_enqueue() from public,anon,authenticated;
revoke all on function public.qc_workspace(),public.qc_set_reviewer(uuid,boolean),public.qc_update(uuid,text,text,uuid),public.qc_notification_data(),public.qc_read_notification(uuid) from public,anon;
grant execute on function public.qc_workspace(),public.qc_set_reviewer(uuid,boolean),public.qc_update(uuid,text,text,uuid),public.qc_notification_data(),public.qc_read_notification(uuid) to authenticated;
alter table public.member_page_access drop constraint member_page_access_page_check;
alter table public.member_page_access add constraint member_page_access_page_check check(page in ('dashboard','my-work','my-team','team-pc','task-assignments','tasks','planner','projects','clients','teams','employees','team-members','performance','reports','sales','settings','timesheet','user-guide','daily-desk','qc'));
create or replace function public.set_member_page_access(p_member uuid,p_rules jsonb) returns void language plpgsql security definer set search_path='' as $$
declare entry record;begin
 if not private.manages_page_access() then raise exception 'Leadership access required';end if;
 if not exists(select 1 from public.profiles where id=p_member) then raise exception 'Member not found';end if;
 if jsonb_typeof(p_rules)<>'object' or p_rules is null then raise exception 'Page rules must be an object';end if;
 for entry in select key,value from jsonb_each(p_rules) loop
 if entry.key not in ('dashboard','my-work','my-team','team-pc','task-assignments','tasks','planner','projects','clients','teams','employees','team-members','performance','reports','sales','settings','timesheet','user-guide','daily-desk','qc') or jsonb_typeof(entry.value) not in ('boolean','null') then raise exception 'Invalid page rule';end if;
 if entry.value='null'::jsonb then delete from public.member_page_access where profile_id=p_member and page=entry.key;
 else insert into public.member_page_access(profile_id,page,allowed,updated_by) values(p_member,entry.key,(entry.value::text)::boolean,auth.uid()) on conflict(profile_id,page) do update set allowed=excluded.allowed,updated_by=auth.uid(),updated_at=now();end if;
 end loop;
end $$;

notify pgrst,'reload schema';
commit;
