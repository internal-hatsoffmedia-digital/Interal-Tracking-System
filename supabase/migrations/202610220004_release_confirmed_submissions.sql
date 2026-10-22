begin;
-- Recover confirmations made before automatic QC submission was installed.
-- Imported status labels alone are not proof of employee completion.
insert into public.qc_reviews(project_id,task_id,coordinator_released_at)
select t.project_id,t.id,now() from public.tasks t join public.projects p on p.id=t.project_id and p.is_active
where t.archived_at is null and t.status::text in ('internal_review','sent_for_internal_review')
and exists(select 1 from public.task_assignments a join public.employees e on e.id=a.employee_id and e.is_active join public.profiles u on u.id=e.profile_id and u.is_active where a.task_id=t.id and a.status::text='completed' and a.completed_at is not null)
on conflict(task_id) where task_id is not null do update set coordinator_released_at=coalesce(public.qc_reviews.coordinator_released_at,excluded.coordinator_released_at);
insert into public.qc_reviews(project_id,coordinator_released_at)
select p.id,now() from public.projects p where p.is_active and p.status::text='awaiting_coordinator' and exists(select 1 from public.project_work_submissions s where s.project_id=p.id)
on conflict(project_id) where task_id is null do update set coordinator_released_at=coalesce(public.qc_reviews.coordinator_released_at,excluded.coordinator_released_at);
update public.projects p set status='internal_review' where p.is_active and p.status::text='awaiting_coordinator' and exists(select 1 from public.project_work_submissions s where s.project_id=p.id);
notify pgrst,'reload schema';commit;
