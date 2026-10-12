begin;
create table public.workspace_polls(
 id uuid primary key default gen_random_uuid(),event_name text not null default 'Hatsoff Drive' check(length(trim(event_name)) between 1 and 100),
 question text not null check(length(trim(question)) between 1 and 300),options text[] not null,
 created_by uuid not null references public.profiles(id),created_at timestamptz not null default now(),
 closes_at timestamptz,closed_at timestamptz,
 check(cardinality(options) between 2 and 10)
);
create table public.workspace_poll_votes(
 poll_id uuid not null references public.workspace_polls(id) on delete cascade,
 voter_id uuid not null references public.profiles(id),option_index integer not null check(option_index between 0 and 9),
 updated_at timestamptz not null default now(),primary key(poll_id,voter_id)
);
alter table public.workspace_polls enable row level security;
alter table public.workspace_poll_votes enable row level security;
revoke all on public.workspace_polls,public.workspace_poll_votes from public,anon,authenticated;

create function public.workspace_create_poll(p_event text,p_question text,p_options text[],p_closes_at timestamptz default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; cleaned text[];
begin
 if private.workspace_role() is distinct from 'admin' then raise exception 'Only Admin can publish a poll';end if;
 if p_event is null or length(trim(p_event)) not between 1 and 100 or p_question is null or length(trim(p_question)) not between 1 and 300 then raise exception 'Enter an event name and question';end if;
 if p_options is null or cardinality(p_options) not between 2 and 10 then raise exception 'Enter 2 to 10 topics';end if;
 select array_agg(trim(value) order by ordinal) into cleaned from unnest(p_options) with ordinality as t(value,ordinal);
 if exists(select 1 from unnest(cleaned) v where v is null or length(v) not between 1 and 120)
 or (select count(distinct lower(v)) from unnest(cleaned) v)<>cardinality(cleaned) then raise exception 'Topics must be distinct and contain 1 to 120 characters';end if;
 if p_closes_at is not null and p_closes_at<=now() then raise exception 'Closing time must be in the future';end if;
 insert into public.workspace_polls(event_name,question,options,created_by,closes_at)
 values(trim(p_event),trim(p_question),cleaned,auth.uid(),p_closes_at) returning id into result;return result;
end $$;

create function public.workspace_vote_poll(p_poll uuid,p_option integer) returns void
language plpgsql security definer set search_path='' as $$
declare poll public.workspace_polls;
begin
 if private.workspace_role() is null then raise exception 'An active account is required';end if;
 -- Locking the poll makes closing and voting mutually exclusive.
 select * into poll from public.workspace_polls where id=p_poll for update;
 if not found then raise exception 'Poll not found';end if;
 if poll.closed_at is not null or poll.closes_at<=now() then raise exception 'Voting has closed';end if;
 if p_option is null or p_option<0 or p_option>=cardinality(poll.options) then raise exception 'Choose a valid topic';end if;
 insert into public.workspace_poll_votes(poll_id,voter_id,option_index) values(p_poll,auth.uid(),p_option)
 on conflict(poll_id,voter_id) do update set option_index=excluded.option_index,updated_at=now();
end $$;

create function public.workspace_close_poll(p_poll uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if private.workspace_role() is distinct from 'admin' then raise exception 'Only Admin can close a poll';end if;
 update public.workspace_polls set closed_at=coalesce(closed_at,now()) where id=p_poll;
 if not found then raise exception 'Poll not found';end if;
end $$;

create function public.workspace_poll_data() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if private.workspace_role() is null then raise exception 'An active account is required';end if;
 return jsonb_build_object('active_accounts',(select count(*) from public.profiles where is_active),
 'polls',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'event_name',p.event_name,'question',p.question,
 'options',p.options,'created_at',p.created_at,'closes_at',p.closes_at,'closed_at',p.closed_at,
 'my_option',(select v.option_index from public.workspace_poll_votes v where v.poll_id=p.id and v.voter_id=auth.uid()),
 'counts',(select jsonb_agg((select count(*) from public.workspace_poll_votes v where v.poll_id=p.id and v.option_index=i))
 from generate_series(0,cardinality(p.options)-1) i)) order by p.created_at desc)
 from (select * from public.workspace_polls order by created_at desc limit 12) p),'[]'::jsonb));
end $$;
revoke all on function public.workspace_create_poll(text,text,text[],timestamptz),public.workspace_vote_poll(uuid,integer),public.workspace_close_poll(uuid),public.workspace_poll_data() from public,anon;
grant execute on function public.workspace_create_poll(text,text,text[],timestamptz),public.workspace_vote_poll(uuid,integer),public.workspace_close_poll(uuid),public.workspace_poll_data() to authenticated;
commit;
