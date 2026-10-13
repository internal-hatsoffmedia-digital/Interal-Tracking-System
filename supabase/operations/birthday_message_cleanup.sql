-- Apply together with birthday messages. Messages are unreadable at their exact
-- 24-hour expiry; the minute job physically removes them within one minute.
create extension if not exists pg_cron;
select cron.schedule('birthday-messages-expiry','* * * * *',$$delete from public.birthday_messages where expires_at <= now()$$);
