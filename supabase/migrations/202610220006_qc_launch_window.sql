begin;
-- QC operations begin at midnight IST on 22 October. Keep earlier records as history.
alter table public.qc_reviews add column if not exists prelaunch_released_at timestamptz;
update public.qc_reviews r
set prelaunch_released_at=coalesce(r.prelaunch_released_at,r.coordinator_released_at),coordinator_released_at=null
where r.coordinator_released_at is not null
and not (r.coordinator_id is not null and r.coordinator_released_at>=timestamptz '2026-10-22 00:00:00+05:30')
and not exists(select 1 from public.task_assignments a where a.task_id=r.task_id and a.status::text='completed' and a.completed_at>=timestamptz '2026-10-22 00:00:00+05:30')
and not (r.task_id is null and exists(select 1 from public.project_work_submissions s where s.project_id=r.project_id and s.submitted_at>=timestamptz '2026-10-22 00:00:00+05:30'));
create or replace function public.qc_activity_data(p_from date,p_through date) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and is_active and role::text in ('admin','manager','director')) then raise exception 'Leadership access required';end if;
 if p_from is null or p_through is null or p_through<p_from or p_through-p_from>366 then raise exception 'Choose a valid date range of up to one year';end if;
 return coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
 select e.id,e.review_id,e.action,e.previous_state,e.state,e.note,e.created_at,u.full_name as actor,p.name as project,p.project_code as code,c.name as client,t.title as task,ru.full_name as reviewer
 from public.qc_events e join public.qc_reviews r on r.id=e.review_id join public.projects p on p.id=r.project_id
 left join public.clients c on c.id=p.client_id left join public.tasks t on t.id=r.task_id
 left join public.profiles u on u.id=e.actor_id left join public.profiles ru on ru.id=e.reviewer_id
 where r.coordinator_released_at is not null and e.created_at>=timestamptz '2026-10-22 00:00:00+05:30' and e.created_at>=p_from::timestamp at time zone 'Asia/Kolkata' and e.created_at<(p_through+1)::timestamp at time zone 'Asia/Kolkata'
 order by e.created_at desc limit 1000)x),'[]'::jsonb);
end $$;
notify pgrst,'reload schema';commit;
