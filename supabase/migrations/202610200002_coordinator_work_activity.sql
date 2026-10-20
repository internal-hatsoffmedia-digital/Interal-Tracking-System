begin;
-- Independent history survives removal from active lists. No private field values are copied.
create table public.coordinator_work_activity(
 id uuid primary key default gen_random_uuid(),actor_id uuid not null,
 project_id uuid,entity_id uuid not null,entity_type text not null,
 title text not null,action text not null,changed_fields text[] not null default '{}',
 created_at timestamptz not null default now());
create index coordinator_work_activity_time on public.coordinator_work_activity(created_at desc,id);
alter table public.coordinator_work_activity enable row level security;
revoke all on public.coordinator_work_activity from public,anon,authenticated;
create function private.record_coordinator_work() returns trigger language plpgsql security definer set search_path='' as $$
declare before_row jsonb;after_row jsonb;item jsonb;pid uuid;caption text;verb text;fields text[];
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and is_active) then return null;end if;
 if tg_op<>'INSERT' then before_row=to_jsonb(old);end if;
 if tg_op<>'DELETE' then after_row=to_jsonb(new);end if;
 item=coalesce(after_row,before_row);
 if tg_op='UPDATE' then
  select array_agg(k order by k) into fields from jsonb_object_keys(after_row) k where k not in ('updated_at','actual_hours') and after_row->k is distinct from before_row->k;
  if fields is null then return null;end if;
 end if;
 pid=case when tg_table_name='projects' then (item->>'id')::uuid else (item->>'project_id')::uuid end;
 caption=coalesce(item->>'title',item->>'name','Assignment');
 if tg_table_name='task_assignments' then select project_id,title into pid,caption from public.tasks where id=(item->>'task_id')::uuid;end if;
 verb=case tg_op when 'INSERT' then 'created' when 'DELETE' then 'deleted' else 'updated' end;
 if tg_op='UPDATE' and tg_table_name='projects' and 'is_active'=any(fields) then verb=case when (item->>'is_active')::boolean then 'restored' else 'deleted' end;end if;
 if tg_op='UPDATE' and tg_table_name='tasks' and 'archived_at'=any(fields) then verb=case when item->>'archived_at' is null then 'restored' else 'deleted' end;end if;
 insert into public.coordinator_work_activity(actor_id,project_id,entity_id,entity_type,title,action,changed_fields)
 values(auth.uid(),pid,(item->>'id')::uuid,tg_table_name,coalesce(caption,'Work item'),verb,coalesce(fields,'{}'));
 return null;
end $$;
revoke all on function private.record_coordinator_work() from public,anon,authenticated;
create trigger coordinator_project_activity after insert or update or delete on public.projects for each row execute function private.record_coordinator_work();
create trigger coordinator_task_activity after insert or update or delete on public.tasks for each row execute function private.record_coordinator_work();
create trigger coordinator_assignment_activity after insert or update or delete on public.task_assignments for each row execute function private.record_coordinator_work();
create trigger coordinator_client_activity after insert or update or delete on public.clients for each row execute function private.record_coordinator_work();
create function public.team_pc_work_activity() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare viewer public.profiles;
begin
 select * into viewer from public.profiles where id=auth.uid() and is_active;
 if viewer.id is null or viewer.role::text not in ('admin','manager','director','associate_lead','team_lead') then raise exception 'Supervisor access required';end if;
 return coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc,a.id) from public.coordinator_work_activity a where
 viewer.role::text in ('admin','manager','director') or
 (a.project_id is not null and private.full_project_access(a.project_id)) or
 (a.project_id is null and exists(select 1 from public.profiles actor where actor.id=a.actor_id and actor.team_id=viewer.team_id))),'[]'::jsonb);
end $$;
revoke all on function public.team_pc_work_activity() from public,anon;
grant execute on function public.team_pc_work_activity() to authenticated;
notify pgrst,'reload schema';
commit;
