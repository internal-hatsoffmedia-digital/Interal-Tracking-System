begin;
-- Admin-selected Auth UUID is the identity; names never identify an account.
create or replace function public.admin_save_auth_employee(p_account uuid,p_name text)
returns void language plpgsql security definer set search_path='' as $$
declare account_email text; linked_count integer;
begin
 if private.role_of(auth.uid()) is distinct from 'admin' then raise exception 'Administrator access required'; end if;
 if p_name is null or length(trim(p_name))=0 then raise exception 'Enter the employee name'; end if;
 select email into account_email from auth.users where id=p_account for update;
 if not found or account_email is null or position('@' in account_email)=0 then raise exception 'Select an Authentication user with an email'; end if;
 -- Insert using email as initial name to avoid legacy name-based account linking.
 insert into public.profiles(id,full_name,email,role,is_active)
 values(p_account,account_email,account_email,'employee',true) on conflict(id) do nothing;
 select count(*) into linked_count from public.employees where profile_id=p_account;
 if linked_count>1 then raise exception 'Multiple employee records are linked to this account'; end if;
 update public.profiles set full_name=trim(p_name) where id=p_account;
 select count(*) into linked_count from public.employees where profile_id=p_account;
 if linked_count>1 then raise exception 'Multiple employee records are linked to this account'; end if;
 if linked_count=0 then
 insert into public.employees(profile_id,employee_code,full_name,email,team_id,is_active)
 select id,'EMP-'||replace(id::text,'-',''),trim(p_name),account_email,team_id,is_active from public.profiles where id=p_account;
 else
 update public.employees set full_name=trim(p_name),email=account_email where profile_id=p_account;
 end if;
end $$;
revoke all on function public.admin_save_auth_employee(uuid,text) from public,anon;
grant execute on function public.admin_save_auth_employee(uuid,text) to authenticated;
notify pgrst,'reload schema';
commit;
