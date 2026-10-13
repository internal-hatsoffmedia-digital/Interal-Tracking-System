begin;
create function public.workspace_delete_poll(p_poll uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if private.workspace_role() is distinct from 'admin' then raise exception 'Only Admin can delete a poll';end if;
 delete from public.workspace_polls where id=p_poll;
 if not found then raise exception 'Poll not found';end if;
end $$;
create function public.workspace_schedule_poll(p_poll uuid,p_closes_at timestamptz) returns void language plpgsql security definer set search_path='' as $$
declare poll public.workspace_polls;begin
 if private.workspace_role() is distinct from 'admin' then raise exception 'Only Admin can change a poll closing time';end if;
 select * into poll from public.workspace_polls where id=p_poll for update;
 if not found then raise exception 'Poll not found';end if;
 if poll.closed_at is not null or poll.closes_at<=now() then raise exception 'Closed polls cannot be reopened';end if;
 if p_closes_at is not null and p_closes_at<=now() then raise exception 'Choose a future closing time';end if;
 update public.workspace_polls set closes_at=p_closes_at where id=p_poll;
end $$;
revoke all on function public.workspace_delete_poll(uuid),public.workspace_schedule_poll(uuid,timestamptz) from public,anon;
grant execute on function public.workspace_delete_poll(uuid),public.workspace_schedule_poll(uuid,timestamptz) to authenticated;
notify pgrst,'reload schema';
commit;
