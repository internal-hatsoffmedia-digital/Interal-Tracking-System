begin;
alter table public.workspace_announcements add column if not exists birthday_on date;
alter table public.workspace_announcements add column if not exists images text[];
create or replace function private.valid_announcement_images(images text[]) returns boolean
language sql immutable set search_path='' as $$
 select images is null or (cardinality(images) between 1 and 8 and
   not exists(select 1 from unnest(images) image where image is null or length(image)>2000000
     or image !~ '^data:image/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$')
   and (select sum(length(image)) from unnest(images) image)<=6000000);
$$;
revoke all on function private.valid_announcement_images(text[]) from public,anon;
grant execute on function private.valid_announcement_images(text[]) to authenticated;
alter table public.workspace_announcements add constraint announcement_images_valid check(private.valid_announcement_images(images));
-- Wishes use ephemeral WebSocket broadcasts, never a public comments/history table.
-- Realtime authorization permits only active colleagues, only on today's birthday topics.
create or replace function private.can_join_birthday_wishes(topic text) returns boolean
language sql stable security definer set search_path='' as $$
 select private.workspace_role() is not null and exists(
   select 1 from public.workspace_announcements a
   where a.birthday_on=(now() at time zone 'Asia/Kolkata')::date
     and topic='birthday-wishes:'||a.id::text||':'||a.birthday_on::text
 );
$$;
revoke all on function private.can_join_birthday_wishes(text) from public,anon;
grant execute on function private.can_join_birthday_wishes(text) to authenticated;
create policy birthday_wishes_receive on realtime.messages for select to authenticated
using (extension='broadcast' and private.can_join_birthday_wishes(realtime.topic()));
create policy birthday_wishes_send on realtime.messages for insert to authenticated
with check (extension='broadcast' and private.can_join_birthday_wishes(realtime.topic()));
commit;
