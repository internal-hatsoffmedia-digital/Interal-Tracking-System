import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('getFlowForceCoordinators returns only Flow Force team members and excludes other teams and inactive accounts', async () => {
  const teams = [
    { id: 'team-ff', name: 'Project Coordinators (Flow Force)', team_type: 'flow_force' },
    { id: 'team-cc', name: 'Graphic Design Team (Creative Clan)', team_type: 'creative_clan' },
    { id: 'team-cut', name: 'Video Editing Team (Cut Masters)', team_type: 'cut_masters' },
    { id: 'team-mkt', name: 'Digital Marketing (Digital Ninjas)', team_type: 'digital_marketing' },
  ];

  const profiles = [
    { id: 'prof-muskan', role: 'associate_lead', team_id: 'team-ff', is_active: true },
    { id: 'prof-esther', role: 'project_coordinator', team_id: 'team-ff', is_active: true },
    { id: 'prof-lavanya', role: 'project_coordinator', team_id: 'team-ff', is_active: true },
    { id: 'prof-ganesh', role: 'associate_lead', team_id: 'team-cc', is_active: true },
    { id: 'prof-sudeesh', role: 'associate_lead', team_id: 'team-cut', is_active: true },
    { id: 'prof-janani', role: 'associate_lead', team_id: 'team-mkt', is_active: true },
    { id: 'prof-admin', role: 'admin', team_id: null, is_active: true },
    { id: 'prof-inactive-coord', role: 'project_coordinator', team_id: 'team-ff', is_active: false },
  ];

  const employees = [
    { id: 'emp-admin', profile_id: 'prof-admin', full_name: 'Admin', employee_code: 'EMP-ADMIN01', team_id: null, is_active: true },
    { id: 'emp-muskan', profile_id: 'prof-muskan', full_name: 'Muskan', employee_code: 'EMP-135E38', team_id: 'team-ff', is_active: true },
    { id: 'emp-esther', profile_id: 'prof-esther', full_name: 'Esther', employee_code: 'EMP-0360C6', team_id: 'team-ff', is_active: true },
    { id: 'emp-lavanya', profile_id: 'prof-lavanya', full_name: 'Lavanya', employee_code: 'EMP-FCE8BA', team_id: 'team-ff', is_active: true },
    { id: 'emp-ganesh', profile_id: 'prof-ganesh', full_name: 'Ganeshkanth', employee_code: 'EMP-52EFEE', team_id: 'team-cc', is_active: true },
    { id: 'emp-sudeesh', profile_id: 'prof-sudeesh', full_name: 'Sudeesh', employee_code: 'EMP-SUD01', team_id: 'team-cut', is_active: true },
    { id: 'emp-janani', profile_id: 'prof-janani', full_name: 'Janani', employee_code: 'EMP-D4D553', team_id: 'team-mkt', is_active: true },
    { id: 'emp-inactive', profile_id: 'prof-inactive-coord', full_name: 'Old Coordinator', employee_code: 'EMP-OLD', team_id: 'team-ff', is_active: false },
  ];

  const mockSupabase = {
    from(table) {
      if (table === 'teams') {
        return {
          select: () => Promise.resolve({ data: teams, error: null }),
        };
      }
      if (table === 'profiles') {
        return {
          select: () => Promise.resolve({ data: profiles, error: null }),
        };
      }
      if (table === 'employees') {
        return {
          select: () => ({
            order: () => Promise.resolve({ data: employees, error: null }),
          }),
        };
      }
      return { select: () => Promise.resolve({ data: [], error: null }) };
    },
    rpc() {
      return Promise.resolve({ data: [], error: null });
    },
  };

  const source = readFileSync(new URL('../src/services/clients/clients.service.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: () => ({ supabase: mockSupabase }),
    console,
  });

  const coordinators = await exports.getFlowForceCoordinators();

  assert.equal(coordinators.length, 3);
  assert.deepEqual(
    coordinators.map((c) => c.full_name),
    ['Muskan', 'Esther', 'Lavanya']
  );

  // Admin and other production/marketing teams should never appear
  assert.ok(!coordinators.some((c) => c.full_name === 'Admin'));
  assert.ok(!coordinators.some((c) => c.full_name === 'Ganeshkanth'));
  assert.ok(!coordinators.some((c) => c.full_name === 'Sudeesh'));
  assert.ok(!coordinators.some((c) => c.full_name === 'Janani'));
  assert.ok(!coordinators.some((c) => c.full_name === 'Old Coordinator'));

  // Ensure fields are populated
  assert.equal(coordinators[0].employee_code, 'EMP-135E38');
});
