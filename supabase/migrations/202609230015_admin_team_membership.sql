begin;
create or replace function public.admin_team_accounts()
returns table(id uuid, full_name text, email text, team_id uuid, is_active boolean)
language plpgsql stable security definer set search_path='' as $$
begin
 if private.role_of(auth.uid()) is distinct from 'admin' then raise exception 'Administrator access required'; end if;
 return query select u.id,coalesce(p.full_name,u.email)::text,u.email::text,p.team_id,coalesce(p.is_active,true)
 from auth.users u left join public.profiles p on p.id=u.id order by u.email;
end $$;
create or replace function public.admin_assign_team_account(p_account uuid,p_team uuid)
returns void language plpgsql security definer set search_path='' as $$
declare account_email text; employee_count integer;
begin
 if private.role_of(auth.uid()) is distinct from 'admin' then raise exception 'Administrator access required'; end if;
 if not exists(select 1 from public.teams where id=p_team and is_active) then raise exception 'Choose an active team'; end if;
 select email into account_email from auth.users where id=p_account for update;
 if not found then raise exception 'Authentication account not found'; end if;
 insert into public.profiles(id,full_name,email,role,is_active) values(p_account,account_email,account_email,'employee',true) on conflict(id) do nothing;
 if not exists(select 1 from public.profiles where id=p_account and is_active) then raise exception 'Activate this account before assigning a team'; end if;
 select count(*) into employee_count from public.employees where profile_id=p_account;
 if employee_count>1 then raise exception 'Multiple employee records linked to this account'; end if;
 update public.profiles set team_id=p_team where id=p_account;
 if employee_count=0 then
 insert into public.employees(profile_id,employee_code,full_name,email,team_id,is_active)
 select id,'EMP-'||replace(id::text,'-',''),full_name,email,p_team,true from public.profiles where id=p_account;
 else update public.employees set team_id=p_team where profile_id=p_account; end if;
end $$;
revoke all on function public.admin_team_accounts(),public.admin_assign_team_account(uuid,uuid) from public,anon;
grant execute on function public.admin_team_accounts(),public.admin_assign_team_account(uuid,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
