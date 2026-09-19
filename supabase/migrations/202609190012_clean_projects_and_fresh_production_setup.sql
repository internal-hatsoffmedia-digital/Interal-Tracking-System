-- Clean Slate Project Setup & Fresh Production Deployment Migration
begin;

-- 1. Remove old test timesheets, task assignments, tasks, project members, activities, and projects
delete from public.timesheets;
delete from public.task_assignments;
delete from public.tasks;
delete from public.project_activity;
delete from public.project_notifications;
delete from public.project_members;
delete from public.projects;

-- 2. Ensure official Clients exist
insert into public.clients (id, name, short_name, contact_person, email, phone, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'Langhar Rice', 'Langhar', 'Langhar Rice Mills Ltd', 'contact@langhar.com', '+91 98765 43210', true),
  ('22222222-2222-2222-2222-222222222222', 'Hatsoff Media', 'Hatsoff', 'Hatsoff Media Internal', 'internal@hatsoffmedia.in', '+91 98765 43211', true),
  ('33333333-3333-3333-3333-333333333333', 'Vibe Wearables', 'Vibe', 'Vibe Tech Ltd', 'hello@vibewear.com', '+91 98765 43212', true)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  contact_person = excluded.contact_person,
  is_active = true;

-- 3. Insert fresh production projects for each operational team
do $$
declare
  client_langhar uuid := '11111111-1111-1111-1111-111111111111';
  client_hatsoff uuid := '22222222-2222-2222-2222-222222222222';
  client_vibe uuid := '33333333-3333-3333-3333-333333333333';

  team_flow_force uuid;
  team_cut_masters uuid;
  team_creative_clan uuid;
  team_digital_ninjas uuid;
  team_web_dev uuid;

  lead_sudeesh uuid;
  lead_ganesh uuid;
  lead_janani uuid;
  lead_vijay uuid;
  lead_muskan uuid;

  proj_video uuid := 'a1111111-1111-1111-1111-111111111111';
  proj_design uuid := 'b2222222-2222-2222-2222-222222222222';
  proj_digital uuid := 'c3333333-3333-3333-3333-333333333333';
  proj_web uuid := 'd4444444-4444-4444-4444-444444444444';

  emp_keerthana uuid;
  emp_kesavan uuid;
  emp_hariharan uuid;
  emp_nadeem uuid;
  
  task1 uuid := 'e5555555-5555-5555-5555-555555555555';
  task2 uuid := 'f6666666-6666-6666-6666-666666666666';
  task3 uuid := 'a7777777-7777-7777-7777-777777777777';
  task4 uuid := 'b8888888-8888-8888-8888-888888888888';
begin
  -- Resolve Team IDs
  select id into team_flow_force from public.teams where lower(name) like '%flow%' or lower(name) like '%coordinator%' limit 1;
  select id into team_cut_masters from public.teams where lower(name) like '%cut%' or lower(name) like '%video%' limit 1;
  select id into team_creative_clan from public.teams where lower(name) like '%creative%' or lower(name) like '%graphic%' limit 1;
  select id into team_digital_ninjas from public.teams where lower(name) like '%digital%' or lower(name) like '%marketing%' limit 1;
  select id into team_web_dev from public.teams where lower(name) like '%web%' limit 1;

  -- Resolve Lead Employee IDs
  select id into lead_sudeesh from public.employees where lower(full_name) like '%sudeesh%' limit 1;
  select id into lead_ganesh from public.employees where lower(full_name) like '%ganesh%' limit 1;
  select id into lead_janani from public.employees where lower(full_name) like '%janani%' limit 1;
  select id into lead_vijay from public.employees where lower(full_name) like '%vijay r%' or lower(full_name) = 'vijay r' limit 1;
  select id into lead_muskan from public.employees where lower(full_name) like '%muskan%' limit 1;

  -- Resolve Staff Employee IDs
  select id into emp_keerthana from public.employees where lower(full_name) like '%keerthana%' limit 1;
  select id into emp_kesavan from public.employees where lower(full_name) like '%kesavan%' limit 1;
  select id into emp_hariharan from public.employees where lower(full_name) like '%hari%' limit 1;
  select id into emp_nadeem from public.employees where lower(full_name) like '%nadeem%' or lower(full_name) like '%nathimulla%' limit 1;

  -- Create Production Project 1: Langhar Rice - Commercial Reel Campaign (Video Editing)
  insert into public.projects (id, name, client_id, team_id, lead_employee_id, status, priority, is_active, target_deadline)
  values (proj_video, 'Langhar Rice — Commercial Reel Campaign', client_langhar, team_cut_masters, lead_sudeesh, 'in_progress', 'high', true, current_date + interval '7 days');

  -- Create Production Project 2: Langhar Rice — Brand Identity & Social Creatives (Graphic Design)
  insert into public.projects (id, name, client_id, team_id, lead_employee_id, status, priority, is_active, target_deadline)
  values (proj_design, 'Langhar Rice — Brand Creatives & Packaging', client_langhar, team_creative_clan, lead_ganesh, 'in_progress', 'high', true, current_date + interval '10 days');

  -- Create Production Project 3: Vibe Wearables — Meta & Google Performance Ads (Digital Marketing)
  insert into public.projects (id, name, client_id, team_id, lead_employee_id, status, priority, is_active, target_deadline)
  values (proj_digital, 'Vibe Wearables — Ads Campaign & Growth', client_vibe, team_digital_ninjas, lead_janani, 'in_progress', 'high', true, current_date + interval '14 days');

  -- Create Production Project 4: Hatsoff Media — Internal Portal & Site Upgrade (Web Dev)
  insert into public.projects (id, name, client_id, team_id, lead_employee_id, status, priority, is_active, target_deadline)
  values (proj_web, 'Hatsoff Media — Corporate Website & Portal', client_hatsoff, team_web_dev, lead_vijay, 'in_progress', 'medium', true, current_date + interval '15 days');

  -- Insert Sample Tasks for Each Project
  insert into public.tasks (id, project_id, client_id, title, description, category, revision_status, priority, status, due_date)
  values
    (task1, proj_video, client_langhar, 'Episode 101 — Reel Final Edit & Color Grading', 'Edit 30s commercial reel with background score and color correction.', 'Shorts / Reels', 'New File', 'high', 'in_progress', current_date + interval '3 days'),
    (task2, proj_design, client_langhar, 'Product Poster Design & Social Banners', 'Design high-res posters and Instagram story carousels.', 'Graphic Design', 'New File', 'high', 'in_progress', current_date + interval '5 days'),
    (task3, proj_digital, client_vibe, 'Q4 Meta Ad Campaign Setup & Copywriting', 'Write reel scripts and configure targeted ad sets on Meta Ads Manager.', 'Ads Management', 'New File', 'high', 'in_progress', current_date + interval '7 days'),
    (task4, proj_web, client_hatsoff, 'Website Deployment & Custom Domain Setup', 'Deploy frontend updates, configure DNS, and test responsive pages.', 'Website Deployment', 'New File', 'medium', 'in_progress', current_date + interval '9 days');

  -- Create Task Assignments for Team Members
  if emp_keerthana is not null then
    insert into public.task_assignments (id, task_id, employee_id, status, assigned_at)
    values (gen_random_uuid(), task1, emp_keerthana, 'assigned', now());
  end if;

  if emp_kesavan is not null then
    insert into public.task_assignments (id, task_id, employee_id, status, assigned_at)
    values (gen_random_uuid(), task2, emp_kesavan, 'assigned', now());
  end if;

  if emp_hariharan is not null then
    insert into public.task_assignments (id, task_id, employee_id, status, assigned_at)
    values (gen_random_uuid(), task3, emp_hariharan, 'assigned', now());
  end if;

  if emp_nadeem is not null then
    insert into public.task_assignments (id, task_id, employee_id, status, assigned_at)
    values (gen_random_uuid(), task4, emp_nadeem, 'assigned', now());
  end if;

end $$;

-- 4. Re-verify profile to employee automatic linking
update public.employees e
set profile_id = p.id
from public.profiles p
where e.profile_id is null
  and (
    (p.email is not null and lower(trim(e.email)) = lower(trim(p.email)))
    or (p.full_name is not null and lower(trim(e.full_name)) = lower(trim(p.full_name)))
  );

update public.profiles p
set team_id = e.team_id
from public.employees e
where p.team_id is null
  and e.profile_id = p.id;

notify pgrst, 'reload schema';
commit;
