begin;
update public.teams set name='Digital Ninjas - M',team_type='digital_marketing' where lower(trim(name)) in ('digital ninjas','digital ninjas - m','digital marketing');
update public.teams set name='Digital Ninjas - W',team_type='web_development' where lower(trim(name)) in ('web crafters','web development','digital ninjas - w');
alter table public.projects add column if not exists historical_artist text;
alter table public.projects add column if not exists historical_coordinator text;
alter table public.projects add column if not exists import_details jsonb;
notify pgrst,'reload schema';
commit;
