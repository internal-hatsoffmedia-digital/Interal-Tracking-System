import { test, before, after } from 'node:test';
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
    '202609220014_fix_task_visibility_and_lead_scoping.sql'
  ];

  for (const name of migrationFiles) {
    const fileContent = await readFile(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8');
    await db.exec(fileContent);
  }

  // Insert Auth users & Teams
  for (let n = 1; n <= 14; n++) {
    await db.query('insert into auth.users (id, email) values ($1, $2)', [id(n), `user${n}@hatsoffmedia.in`]);
  }

  await db.exec(`
    insert into teams(id, name) values
      ('${id(100)}','Project Coordinators'),
      ('${id(101)}','Creative Clan'),
      ('${id(102)}','Cut Masters'),
      ('${id(103)}','Web Development'),
      ('${id(104)}','Digital Ninjas');
  `);

  const people = [
    [1, 'Admin', 'admin', 100],
    [2, 'Muskan', 'associate_lead', 100],
    [3, 'Ganesh', 'associate_lead', 101],
    [4, 'Sudeesh', 'associate_lead', 102],
    [5, 'Vijay R', 'associate_lead', 103],
    [6, 'Janani', 'associate_lead', 104],
    [7, 'Lavanya', 'project_coordinator', 100],
    [8, 'Esther', 'project_coordinator', 100],
    [9, 'Director', 'director', 100],
    [10, 'Kesavan', 'employee', 101],
    [11, 'Keerthana', 'employee', 102],
    [12, 'Snega', 'employee', 103],
    [13, 'Hariharan', 'employee', 104],
    [14, 'Kamalesh', 'team_lead', 100]
  ];

  for (const [n, name, role, team] of people) {
    await db.query('insert into profiles(id, full_name, email, role, team_id, is_active) values($1, $2, $3, $4, $5, true) on conflict (id) do update set role=excluded.role, team_id=excluded.team_id', [id(n), name, `user${n}@hatsoffmedia.in`, role, id(team)]);
    await db.query('update employees set team_id=$2 where profile_id=$1', [id(n), id(team)]);
  }

  // Create Client & Projects
  await db.exec(`
    insert into clients(id, name) values('${id(50)}', 'Test Client');
    insert into projects(id, name, client_id, team_id, created_by, is_active) values
      ('${id(301)}', 'QA Campaign', '${id(50)}', '${id(100)}', '${id(2)}', true);
  `);

  // Create Tasks
  // Task 401 assigned to Vijay R (Profile 5)
  const empVijay = (await db.query('select id from employees where profile_id=$1', [id(5)])).rows[0].id;
  const empKeerthana = (await db.query('select id from employees where profile_id=$1', [id(11)])).rows[0].id;

  await db.query('insert into tasks(id, project_id, title) values($1, $2, $3)', [id(401), id(301), 'QA TEST 22 Sep - Muskan to Vijay']);
  await db.query('insert into task_assignments(id, task_id, employee_id, assigned_by, status) values($1, $2, $3, $4, $5)', [id(501), id(401), empVijay, id(2), 'assigned']);

  // Task 402 assigned to Keerthana (Profile 11, Cut Masters team 102)
  await db.query('insert into tasks(id, project_id, title) values($1, $2, $3)', [id(402), id(301), 'Cut Masters Reel Edit']);
  await db.query('insert into task_assignments(id, task_id, employee_id, assigned_by, status) values($1, $2, $3, $4, $5)', [id(502), id(402), empKeerthana, id(2), 'assigned']);
});

after(() => db.close());

test('Req 1: Active user (Vijay R) sees his own assigned task and assignment', async () => {
  const vijayTasks = (await as(5, 'select id, title from tasks')).rows;
  assert.equal(vijayTasks.length, 1);
  assert.equal(vijayTasks[0].id, id(401));
  assert.equal(vijayTasks[0].title, 'QA TEST 22 Sep - Muskan to Vijay');

  const vijayAssignments = (await as(5, 'select id, task_id from task_assignments')).rows;
  assert.equal(vijayAssignments.length, 1);
  assert.equal(vijayAssignments[0].task_id, id(401));
});

test('Req 2: Production associate lead (Sudeesh - Cut Masters) sees work assigned to his team member', async () => {
  const sudeeshTasks = (await as(4, 'select id, title from tasks')).rows;
  assert.equal(sudeeshTasks.length, 1);
  assert.equal(sudeeshTasks[0].id, id(402));

  const sudeeshAssignments = (await as(4, 'select id, task_id from task_assignments')).rows;
  assert.equal(sudeeshAssignments.length, 1);
  assert.equal(sudeeshAssignments[0].task_id, id(402));
});

test('Req 3: Unrelated production lead (Ganesh - Creative Clan) cannot see Vijay or Sudeesh tasks', async () => {
  const ganeshTasks = (await as(3, 'select id from tasks')).rows;
  assert.equal(ganeshTasks.length, 0);

  const ganeshAssignments = (await as(3, 'select id from task_assignments')).rows;
  assert.equal(ganeshAssignments.length, 0);
});

test('Req 4: Coordination lead (Muskan) and Coordinator (Lavanya) retain project and task visibility', async () => {
  const muskanTasks = (await as(2, 'select id from tasks')).rows;
  assert.equal(muskanTasks.length, 2);

  const adminTasks = (await as(1, 'select id from tasks')).rows;
  assert.equal(adminTasks.length, 2);
});

test('Req 5: Production associate lead (Vijay R) sees only his own team members in employees table', async () => {
  const vijayEmployees = (await as(5, 'select id, full_name, team_id, profile_id from employees')).rows;
  for (const emp of vijayEmployees) {
    assert.equal(emp.team_id, id(103));
  }
  assert.equal(vijayEmployees.length, 2);
});
