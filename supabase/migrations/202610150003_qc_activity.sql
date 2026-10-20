begin;
create table public.qc_events(
 id uuid primary key default gen_random_uuid(),review_id uuid not null references public.qc_reviews(id) on delete cascade,
 actor_id uuid references public.profiles(id),reviewer_id uuid references public.profiles(id),action text not null,previous_state text,state text not null,
 note text,created_at timestamptz not null default now());
create index qc_events_time on public.qc_events(created_at desc);
alter table public.qc_events enable row level security;
revoke all on public.qc_events from public,anon,authenticated;
insert into public.qc_events(review_id,reviewer_id,action,state) select id,reviewer_id,'Existing review',state from public.qc_reviews;
create function private.qc_record_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then
 insert into public.qc_events(review_id,actor_id,reviewer_id,action,state) values(new.id,auth.uid(),new.reviewer_id,'Entered QC',new.state);
 elsif new.state is distinct from old.state or new.reviewer_id is distinct from old.reviewer_id then
 insert into public.qc_events(review_id,actor_id,reviewer_id,action,previous_state,state,note)
 values(new.id,auth.uid(),new.reviewer_id,case when new.reviewer_id is null and old.reviewer_id is not null then 'Reviewer released' else 'Review updated' end,old.state,new.state,
 (select body from public.qc_notes where review_id=new.id and author_id=auth.uid() and created_at=now() order by created_at desc limit 1));
 end if;return new;
end $$;
create trigger qc_record_event after insert or update on public.qc_reviews for each row execute function private.qc_record_event();
create function public.qc_activity_data(p_from date,p_through date) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('admin','manager','director')) then raise exception 'Leadership access required';end if;
 if p_from is null or p_through is null or p_through<p_from or p_through-p_from>366 then raise exception 'Choose a valid date range of up to one year';end if;
 return coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
 select e.id,e.review_id,e.action,e.previous_state,e.state,e.note,e.created_at,u.full_name as actor,p.name as project,p.project_code as code,c.name as client,t.title as task,ru.full_name as reviewer
 from public.qc_events e join public.qc_reviews r on r.id=e.review_id join public.projects p on p.id=r.project_id
 left join public.clients c on c.id=p.client_id left join public.tasks t on t.id=r.task_id
 left join public.profiles u on u.id=e.actor_id left join public.profiles ru on ru.id=e.reviewer_id
 where e.created_at>=p_from::timestamp at time zone 'Asia/Kolkata' and e.created_at<(p_through+1)::timestamp at time zone 'Asia/Kolkata'
 order by e.created_at desc limit 1000)x),'[]'::jsonb);
end $$;
revoke all on function private.qc_record_event() from public,anon,authenticated;
revoke all on function public.qc_activity_data(date,date) from public,anon;
grant execute on function public.qc_activity_data(date,date) to authenticated;
alter table public.member_page_access drop constraint member_page_access_page_check;
alter table public.member_page_access add constraint member_page_access_page_check check(page in ('dashboard','my-work','my-team','team-pc','task-assignments','tasks','planner','projects','clients','teams','employees','team-members','performance','reports','sales','settings','timesheet','user-guide','daily-desk','qc','qc-activity'));
create or replace function public.set_member_page_access(p_member uuid,p_rules jsonb) returns void language plpgsql security definer set search_path='' as $$
declare entry record;begin
 if not private.manages_page_access() then raise exception 'Leadership access required';end if;
 if not exists(select 1 from public.profiles where id=p_member) then raise exception 'Member not found';end if;
 if jsonb_typeof(p_rules)<>'object' or p_rules is null then raise exception 'Page rules must be an object';end if;
 for entry in select key,value from jsonb_each(p_rules) loop
 if entry.key not in ('dashboard','my-work','my-team','team-pc','task-assignments','tasks','planner','projects','clients','teams','employees','team-members','performance','reports','sales','settings','timesheet','user-guide','daily-desk','qc','qc-activity') or jsonb_typeof(entry.value) not in ('boolean','null') then raise exception 'Invalid page rule';end if;
 if entry.value='null'::jsonb then delete from public.member_page_access where profile_id=p_member and page=entry.key;
 else insert into public.member_page_access(profile_id,page,allowed,updated_by) values(p_member,entry.key,(entry.value::text)::boolean,auth.uid()) on conflict(profile_id,page) do update set allowed=excluded.allowed,updated_by=auth.uid(),updated_at=now();end if;
 end loop;
end $$;
notify pgrst,'reload schema';
commit;
