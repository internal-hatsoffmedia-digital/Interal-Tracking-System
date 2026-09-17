-- Additive migration against the supplied public.profiles/projects/notifications schema.
-- Sales does not require project_members or either project migration.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create table public.sales_permissions (
  profile_id uuid primary key references public.profiles(id),
  access_level text not null check(access_level in ('viewer','member','manager')),
  granted_by uuid not null references public.profiles(id),
  granted_at timestamptz not null default now()
);
create table public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(trim(name))>0),
  company text not null default '',
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  source text not null check(source in ('Cold Call','Cold DM','Field Visit','Website','Digital Mktg')),
  campaign text not null default '',
  owner_id uuid not null references public.profiles(id),
  stage text not null default 'lead' check(stage in ('lead','prospect','proposal','won','lost')),
  deal_value numeric(14,2) not null default 0 check(deal_value>=0),
  next_follow_up date,
  notes text not null default '',
  project_id uuid references public.projects(id),
  won_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check((stage='won')=(won_at is not null))
);
create index sales_leads_owner on public.sales_leads(owner_id);
create index sales_leads_followup on public.sales_leads(next_follow_up) where stage not in ('won','lost');
create index sales_leads_created on public.sales_leads(created_at);
create table public.sales_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.sales_leads(id),
  actor_id uuid not null references public.profiles(id),
  kind text not null check(kind in ('call','message','visit','meeting','email','note','system')),
  notes text not null check(length(trim(notes))>0),
  occurred_at timestamptz not null default now()
);
create index sales_activities_lead on public.sales_activities(lead_id,occurred_at desc);
create table public.sales_targets (
  month date primary key check(extract(day from month)=1),
  amount numeric(14,2) not null check(amount>=0),
  updated_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now()
);

create function private.sales_level(uid uuid default auth.uid()) returns text language sql stable security definer set search_path='' as $$
  select case when p.role::text='admin' then 'admin' else s.access_level end
  from public.profiles p left join public.sales_permissions s on s.profile_id=p.id
  where p.id=uid and p.is_active
$$;
create function private.sales_view(lid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.sales_leads l where l.id=lid and (
    private.sales_level() in ('admin','manager','viewer') or (private.sales_level()='member' and l.owner_id=auth.uid())))
$$;
-- Sales can be installed independently: don't depend on unverified profile UPDATE policies
-- to protect the administrator role that authorizes sales access.
create function private.sales_guard_identity() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is not null and private.sales_level() is distinct from 'admin' then
    if TG_OP='INSERT' then
      if new.id<>auth.uid() or new.role::text<>'employee' then raise exception 'Only administrators can provision privileged accounts'; end if;
    elsif new.id is distinct from old.id or new.role is distinct from old.role or new.is_active is distinct from old.is_active then
      raise exception 'Only administrators can change account access';
    end if;
  end if;
  return new;
end $$;
create trigger sales_guard_identity before insert or update on public.profiles for each row execute function private.sales_guard_identity();
revoke insert,update,delete on public.profiles from public,anon;
create function private.sales_edit(lid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.sales_leads l where l.id=lid and (
    private.sales_level() in ('admin','manager') or (private.sales_level()='member' and l.owner_id=auth.uid())))
$$;
alter table public.sales_permissions enable row level security;
alter table public.sales_leads enable row level security;
alter table public.sales_activities enable row level security;
alter table public.sales_targets enable row level security;
create policy sales_permission_read on public.sales_permissions for select to authenticated using(profile_id=auth.uid() or private.sales_level()='admin');
create policy sales_lead_read on public.sales_leads for select to authenticated using(
  private.sales_level() in ('admin','manager','viewer') or (private.sales_level()='member' and owner_id=auth.uid()));
create policy sales_activity_read on public.sales_activities for select to authenticated using(private.sales_view(lead_id));
-- Organization target is shown only to users with organization-wide sales visibility.
create policy sales_target_read on public.sales_targets for select to authenticated using(private.sales_level() in ('admin','manager','viewer'));
revoke all on public.sales_permissions,public.sales_leads,public.sales_activities,public.sales_targets from public,anon,authenticated;
grant select on public.sales_permissions,public.sales_leads,public.sales_activities,public.sales_targets to authenticated;

create function public.sales_people() returns table(id uuid,full_name text,access_level text)
language sql stable security definer set search_path='' as $$
  select p.id,p.full_name::text,private.sales_level(p.id) from public.profiles p
  where p.is_active and private.sales_level() is not null and (
    private.sales_level()='admin' or
    (private.sales_level() in ('manager','viewer') and private.sales_level(p.id) is not null) or p.id=auth.uid())
  order by p.full_name
$$;
create function public.sales_my_access() returns text language sql stable security definer set search_path='' as $$
  select private.sales_level()
$$;
create function public.sales_grant_access(p_profile_id uuid,p_access_level text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if private.sales_level() is distinct from 'admin' then raise exception 'Only administrators can grant sales access'; end if;
  if p_access_level is null then delete from public.sales_permissions where profile_id=p_profile_id;
  else
    if p_access_level not in ('viewer','member','manager') then raise exception 'Invalid sales access level'; end if;
    insert into public.sales_permissions(profile_id,access_level,granted_by) values(p_profile_id,p_access_level,auth.uid())
    on conflict(profile_id) do update set access_level=excluded.access_level,granted_by=auth.uid(),granted_at=now();
  end if;
end $$;

create function public.sales_save_lead(p_id uuid,p_input jsonb,p_expected_updated_at timestamptz default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare existing public.sales_leads; result public.sales_leads; owner uuid; target_stage text; event text;
begin
  if private.sales_level() is null or private.sales_level()='viewer' then raise exception 'Sales editing is not authorized'; end if;
  if p_id is not null then
    select * into existing from public.sales_leads where id=p_id for update;
    if not found or not private.sales_edit(p_id) then raise exception 'Lead unavailable or access denied'; end if;
    if p_expected_updated_at is null or existing.updated_at<>p_expected_updated_at then raise exception 'This lead changed. Refresh before saving.'; end if;
  end if;
  owner:=coalesce(nullif(p_input->>'owner_id','')::uuid,existing.owner_id,auth.uid());
  if private.sales_level()='member' and owner<>auth.uid() then raise exception 'Only managers can reassign leads'; end if;
  if private.sales_level(owner) is null or private.sales_level(owner)='viewer' then raise exception 'Select an active sales owner with editing access'; end if;
  target_stage:=coalesce(p_input->>'stage',existing.stage,'lead');
  if p_id is null then
    insert into public.sales_leads(name,company,contact_name,email,phone,source,campaign,owner_id,stage,deal_value,next_follow_up,notes,created_by,won_at)
    values(trim(p_input->>'name'),coalesce(p_input->>'company',''),coalesce(p_input->>'contact_name',''),coalesce(p_input->>'email',''),
      coalesce(p_input->>'phone',''),p_input->>'source',coalesce(p_input->>'campaign',''),owner,target_stage,
      coalesce((p_input->>'deal_value')::numeric,0),nullif(p_input->>'next_follow_up','')::date,coalesce(p_input->>'notes',''),auth.uid(),
      case when target_stage='won' then now() else null end) returning * into result;
    event:='Lead created';
  else
    update public.sales_leads set name=trim(p_input->>'name'),company=coalesce(p_input->>'company',''),
      contact_name=coalesce(p_input->>'contact_name',''),email=coalesce(p_input->>'email',''),phone=coalesce(p_input->>'phone',''),
      source=p_input->>'source',campaign=coalesce(p_input->>'campaign',''),owner_id=owner,stage=target_stage,
      deal_value=coalesce((p_input->>'deal_value')::numeric,0),next_follow_up=nullif(p_input->>'next_follow_up','')::date,
      notes=coalesce(p_input->>'notes',''),won_at=case when target_stage='won' then coalesce(existing.won_at,now()) else null end,
      updated_at=clock_timestamp() where id=p_id returning * into result;
    event:=case when existing.stage<>target_stage then 'Stage changed: ' || existing.stage || ' → ' || target_stage
      when existing.owner_id<>owner then 'Lead reassigned' else 'Lead details updated' end;
  end if;
  insert into public.sales_activities(lead_id,actor_id,kind,notes) values(result.id,auth.uid(),'system',event);
  if owner<>auth.uid() and (p_id is null or existing.owner_id<>owner) then
    insert into public.notifications(user_id,title,message,type,entity_type,entity_id)
    values(owner,'Sales lead assigned',result.name,'sales_assignment','sales_lead',result.id);
  end if;
  return result.id;
end $$;

create function public.sales_log_activity(p_lead_id uuid,p_kind text,p_notes text,p_follow_up date default null,p_complete_follow_up boolean default false) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform 1 from public.sales_leads where id=p_lead_id for update;
  if not private.sales_edit(p_lead_id) then raise exception 'Activity editing is not authorized'; end if;
  if p_kind='system' then raise exception 'System history cannot be authored manually'; end if;
  insert into public.sales_activities(lead_id,actor_id,kind,notes) values(p_lead_id,auth.uid(),p_kind,trim(p_notes));
  if p_complete_follow_up or p_follow_up is not null then
    update public.sales_leads set next_follow_up=p_follow_up,updated_at=clock_timestamp() where id=p_lead_id;
  end if;
end $$;
create function public.sales_set_target(p_month date,p_amount numeric) returns void
language plpgsql security definer set search_path='' as $$
begin
  if private.sales_level() is null or private.sales_level() not in ('admin','manager') then raise exception 'Only sales managers can edit targets'; end if;
  insert into public.sales_targets(month,amount,updated_by) values(p_month,p_amount,auth.uid())
  on conflict(month) do update set amount=excluded.amount,updated_by=auth.uid(),updated_at=clock_timestamp();
end $$;
-- Sales assignment notifications use the existing notifications table. These boundaries
-- cannot widen any legacy policy; they prevent stale sales access through old notifications.
alter table public.notifications enable row level security;
create policy sales_notification_boundary on public.notifications as restrictive for select to public
using(entity_type is distinct from 'sales_lead' or (user_id=auth.uid() and private.sales_view(entity_id)));
create policy sales_notification_read on public.notifications for select to authenticated
using(entity_type='sales_lead' and user_id=auth.uid() and private.sales_view(entity_id));
create policy sales_notification_insert_boundary on public.notifications as restrictive for insert to public
with check(entity_type is distinct from 'sales_lead');
create policy sales_notification_update_boundary on public.notifications as restrictive for update to public
using(entity_type is distinct from 'sales_lead') with check(entity_type is distinct from 'sales_lead');
create function public.sales_read_notification(p_id uuid) returns void language sql security definer set search_path='' as $$
  update public.notifications set is_read=true,read_at=coalesce(read_at,now())
  where id=p_id and user_id=auth.uid() and entity_type='sales_lead' and private.sales_view(entity_id)
$$;
revoke all on function private.sales_level(uuid),private.sales_view(uuid),private.sales_edit(uuid) from public,anon;
revoke all on function private.sales_guard_identity() from public,anon,authenticated;
grant execute on function private.sales_level(uuid),private.sales_view(uuid),private.sales_edit(uuid) to authenticated;
revoke all on function public.sales_people(),public.sales_my_access(),public.sales_grant_access(uuid,text),
  public.sales_save_lead(uuid,jsonb,timestamptz),public.sales_log_activity(uuid,text,text,date,boolean),public.sales_set_target(date,numeric),public.sales_read_notification(uuid) from public,anon;
grant execute on function public.sales_people(),public.sales_my_access(),public.sales_grant_access(uuid,text),
  public.sales_save_lead(uuid,jsonb,timestamptz),public.sales_log_activity(uuid,text,text,date,boolean),public.sales_set_target(date,numeric),public.sales_read_notification(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
