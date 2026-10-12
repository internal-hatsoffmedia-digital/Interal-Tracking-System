begin;

-- Counters are shared across years so the requested month-only format remains unique.
create table public.project_id_counters (
  prefix text primary key,
  last_number bigint not null check (last_number > 0)
);
alter table public.project_id_counters enable row level security;
revoke all on public.project_id_counters from public, anon, authenticated;

create function private.next_project_code(project_time timestamptz)
returns text language plpgsql security definer set search_path = '' as $$
declare
  code_prefix text := 'HM' || (array['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'])[extract(month from project_time at time zone 'Asia/Kolkata')::integer];
  code_number bigint;
  candidate text;
begin
  loop
    insert into public.project_id_counters(prefix,last_number) values(code_prefix,1)
    on conflict(prefix) do update set last_number = public.project_id_counters.last_number + 1
    returning last_number into code_number;
    candidate := code_prefix || lpad(code_number::text,greatest(4,length(code_number::text)),'0');
    exit when not exists(select 1 from public.projects where lower(project_code)=lower(candidate));
  end loop;
  return candidate;
end;
$$;
revoke all on function private.next_project_code(timestamptz) from public, anon, authenticated;

-- Keep any previously issued codes; fill only projects that have no code.
do $$
declare p record;
begin
  for p in select id,created_at from public.projects where nullif(trim(project_code),'') is null order by created_at,id loop
    update public.projects set project_code=private.next_project_code(coalesce(p.created_at,now())) where id=p.id;
  end loop;
end;
$$;

create function private.fix_project_code() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.project_code := private.next_project_code(now());
  elsif new.project_code is distinct from old.project_code then
    raise exception 'Project ID is fixed and cannot be changed.';
  end if;
  return new;
end;
$$;
revoke all on function private.fix_project_code() from public, anon, authenticated;
create trigger projects_fixed_code before insert or update of project_code on public.projects
for each row execute function private.fix_project_code();
alter table public.projects alter column project_code set not null;
notify pgrst, 'reload schema';
commit;
