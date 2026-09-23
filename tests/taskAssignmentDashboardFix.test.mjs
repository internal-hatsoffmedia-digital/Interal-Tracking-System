import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { suppliedSchema } from './supplied-schema-fixture.mjs';

const db = new PGlite();
const id = n => `${String(n).padStart(6, '0')}00-0000-0000-0000-${String(n).padStart(12, '0')}`;

async function as(n, sql, params = []) {
  await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(n)}',false)`);
  return db.query(sql, params);
}

before(async () => {
  await suppliedSchema(db);
  await db.exec(`
    alter table auth.users add column if not exists email text;
    alter table auth.users add column if not exists raw_user_meta_data jsonb;
    alter table employees enable row level security;
    create policy fixture_tasks_write on tasks for all to authenticated using(true) with check(true);
    create policy fixture_workers_write on employees for all to authenticated using(true) with check(true);
    create policy fixture_assignment_write on task_assignments for all to authenticated using(true) with check(true);
  `);

  const migrationFiles = [
    '202609050001_roles_and_statuses.sql',
    '202609050002_project_access.sql',
    '202609050003_sales_tracker.sql',
    '202609050004_workspace_updates.sql',
    '202609080005_coordinator_project_access.sql',
    '202609080006_team_access_admin.sql',
    '202609180007_coordinator_team_leads.sql',
    '202609180008_client_project_coordinator.sql',
    '202609190009_coordinator_project_creation.sql',
    '202609190010_active_task_projects_and_employee_linking.sql',
    '202609190011_team_employee_scoping.sql',
    '202609190013_reset_employees_and_auth_sync.sql',
    '202609220014_fix_task_visibility_and_lead_scoping.sql',
    '202609230015_admin_team_membership.sql',
    '202609230016_admin_auth_employee.sql',
    '202609230017_fix_nadeem_assignment_and_account_linking.sql'
  ];

  for (const name of migrationFiles) {
    const fileContent = await readFile(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8');
    await db.exec(fileContent);
  }

  // Set up auth users:
  // User 2: Muskan (associate_lead on Project Coordinators team 100)
  // User 11: Keerthana (employee on Video Editing team 102)
  // User 13: Hariharan (employee on Digital Marketing team 104)
  // User 15: Nadeem (employee on Web Development team 103)
  await db.query('insert into auth.users (id, email) values ($1, $2) on conflict (id) do update set email = excluded.email', [id(2), 'muskanchaudhary@hatsoffmedia.in']);
  await db.query('insert into auth.users (id, email) values ($1, $2) on conflict (id) do update set email = excluded.email', [id(11), 'keerthanavelayudham4@gmail.com']);
  await db.query('insert into auth.users (id, email) values ($1, $2) on conflict (id) do update set email = excluded.email', [id(13), 'harisk020903@gmail.com']);
  await db.query('insert into auth.users (id, email) values ($1, $2) on conflict (id) do update set email = excluded.email', [id(15), 'nadeemanalyst42@gmail.com']);

  await db.exec(`
    insert into teams(id, name) values
      ('${id(100)}','Project Coordinators'),
      ('${id(102)}','Video Editing Team'),
      ('${id(103)}','Website Development & Deployment'),
      ('${id(104)}','Digital Marketing')
    on conflict (id) do nothing;
  `);

  // Muskan profile & employee
  await db.query('insert into profiles(id, full_name, email, role, team_id, is_active) values($1, $2, $3, $4, $5, true) on conflict (id) do update set role=excluded.role, team_id=excluded.team_id',
    [id(2), 'Muskan Kumari S', 'muskanchaudhary@hatsoffmedia.in', 'associate_lead', id(100)]);
  await db.query('insert into employees(profile_id, employee_code, full_name, email, team_id, is_active) values($1, $2, $3, $4, $5, true) on conflict (profile_id) do update set team_id=excluded.team_id',
    [id(2), 'EMP-MUSKAN', 'Muskan Kumari S', 'muskanchaudhary@hatsoffmedia.in', id(100)]);

  // Add a project coordinator to team 100 so coordinator_lead(2) returns true
  await db.query('insert into auth.users (id, email) values ($1, $2) on conflict (id) do update set email = excluded.email', [id(7), 'lavanya@hatsoffmedia.in']);
  await db.query('insert into profiles(id, full_name, email, role, team_id, is_active) values($1, $2, $3, $4, $5, true) on conflict (id) do update set role=excluded.role, team_id=excluded.team_id',
    [id(7), 'Lavanya M', 'lavanya@hatsoffmedia.in', 'project_coordinator', id(100)]);

  // Profiles with personal emails:
  await db.query('insert into profiles(id, full_name, email, role, team_id, is_active) values($1, $2, $3, $4, $5, true) on conflict (id) do update set email=excluded.email, role=excluded.role, team_id=excluded.team_id',
    [id(11), 'Keerthana', 'keerthanavelayudham4@gmail.com', 'employee', id(102)]);
  await db.query('insert into profiles(id, full_name, email, role, team_id, is_active) values($1, $2, $3, $4, $5, true) on conflict (id) do update set email=excluded.email, role=excluded.role, team_id=excluded.team_id',
    [id(13), 'Hariharan', 'harisk020903@gmail.com', 'employee', id(104)]);
  await db.query('insert into profiles(id, full_name, email, role, team_id, is_active) values($1, $2, $3, $4, $5, true) on conflict (id) do update set email=excluded.email, role=excluded.role, team_id=excluded.team_id',
    [id(15), 'Nathimulla', 'nadeemanalyst42@gmail.com', 'employee', id(103)]);

  // Unlinked directory employee records created with official emails:
  await db.query('insert into employees(id, profile_id, employee_code, full_name, email, team_id, is_active) values($1, null, $2, $3, $4, $5, true) on conflict (id) do nothing',
    [id(211), 'EMP-KEERTHANA', 'Keerthana', 'keerthana@hatsoffmedia.in', id(102)]);
  await db.query('insert into employees(id, profile_id, employee_code, full_name, email, team_id, is_active) values($1, null, $2, $3, $4, $5, true) on conflict (id) do nothing',
    [id(213), 'EMP-HARI', 'Hariharan', 'hariharan@hatsoffmedia.in', id(104)]);
  await db.query('insert into employees(id, profile_id, employee_code, full_name, email, team_id, is_active) values($1, null, $2, $3, $4, $5, true) on conflict (id) do nothing',
    [id(215), 'EMP-NADEEM', 'Nathimulla', 'nadeem@hatsoffmedia.in', id(103)]);

  // Client
  await db.exec(`
    insert into clients(id, name) values('${id(50)}', 'Test Client') on conflict (id) do nothing;
  `);
});

test('Tasks assigned by Project Coordinator appear on any respective employee dashboard across teams', async () => {
  // Muskan creates a project on her team (100)
  await as(2, `insert into projects(id, name, client_id, team_id, created_by, is_active) values('${id(302)}', 'Multi Team Campaign', '${id(50)}', '${id(100)}', '${id(2)}', true)`);

  // Muskan creates tasks
  await as(2, `insert into tasks(id, project_id, title) values('${id(401)}', '${id(302)}', 'Edit Reel Video')`);
  await as(2, `insert into tasks(id, project_id, title) values('${id(402)}', '${id(302)}', 'Develop Landing Page')`);
  await as(2, `insert into tasks(id, project_id, title) values('${id(403)}', '${id(302)}', 'Run Ad Campaign')`);

  // Muskan assigns tasks to directory employee records: Keerthana (211), Nadeem (215), Hariharan (213)
  await as(2, `insert into task_assignments(id, task_id, employee_id, assigned_by, status) values('${id(501)}', '${id(401)}', '${id(211)}', '${id(2)}', 'assigned')`);
  await as(2, `insert into task_assignments(id, task_id, employee_id, assigned_by, status) values('${id(502)}', '${id(402)}', '${id(215)}', '${id(2)}', 'assigned')`);
  await as(2, `insert into task_assignments(id, task_id, employee_id, assigned_by, status) values('${id(503)}', '${id(403)}', '${id(213)}', '${id(2)}', 'assigned')`);

  // 1. Check Keerthana (User 11)
  const keerthanaEmp = (await as(11, 'select * from public.get_current_employee_profile()')).rows[0];
  const keerthanaAssignments = (await as(11, 'select * from task_assignments where employee_id = $1', [keerthanaEmp.id])).rows;
  const keerthanaTasks = (await as(11, 'select * from tasks where id = $1', [id(401)])).rows;
  assert.equal(keerthanaAssignments.length, 1, 'Keerthana sees her assigned work');
  assert.equal(keerthanaTasks.length, 1, 'Keerthana sees task under RLS');

  // 2. Check Nadeem (User 15)
  const nadeemEmp = (await as(15, 'select * from public.get_current_employee_profile()')).rows[0];
  const nadeemAssignments = (await as(15, 'select * from task_assignments where employee_id = $1', [nadeemEmp.id])).rows;
  const nadeemTasks = (await as(15, 'select * from tasks where id = $1', [id(402)])).rows;
  assert.equal(nadeemAssignments.length, 1, 'Nadeem sees his assigned work');
  assert.equal(nadeemTasks.length, 1, 'Nadeem sees task under RLS');

  // 3. Check Hariharan (User 13)
  const hariEmp = (await as(13, 'select * from public.get_current_employee_profile()')).rows[0];
  const hariAssignments = (await as(13, 'select * from task_assignments where employee_id = $1', [hariEmp.id])).rows;
  const hariTasks = (await as(13, 'select * from tasks where id = $1', [id(403)])).rows;
  assert.equal(hariAssignments.length, 1, 'Hariharan sees his assigned work');
  assert.equal(hariTasks.length, 1, 'Hariharan sees task under RLS');
});
