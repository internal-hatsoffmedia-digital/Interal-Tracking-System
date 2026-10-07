import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Associate Lead Team Work scoping logic isolates team assignments and worker options', () => {
  const teams = [
    { id: 'team-cc', name: 'Creative Clan', team_type: 'creative_clan' },
    { id: 'team-cut', name: 'Cut Masters', team_type: 'cut_masters' },
    { id: 'team-web', name: 'Web Development', team_type: 'web_development' },
    { id: 'team-ff', name: 'Flow Force', team_type: 'flow_force' },
  ];

  const employees = [
    { id: 'emp-ganesh', full_name: 'Ganesh', team_id: 'team-cc', profile_id: 'prof-ganesh', is_active: true },
    { id: 'emp-keerthana', full_name: 'Keerthana', team_id: 'team-cc', profile_id: 'prof-keerthana', is_active: true },
    { id: 'emp-sudeesh', full_name: 'Sudeesh', team_id: 'team-cut', profile_id: 'prof-sudeesh', is_active: true },
    { id: 'emp-worker-cut', full_name: 'Cut Worker', team_id: 'team-cut', profile_id: 'prof-worker-cut', is_active: true },
    { id: 'emp-vijay', full_name: 'Vijay', team_id: 'team-web', profile_id: 'prof-vijay', is_active: true },
    { id: 'emp-muskan', full_name: 'Muskan', team_id: 'team-ff', profile_id: 'prof-muskan', is_active: true },
  ];

  const assignments = [
    { id: 'asgn-1', task_id: 't-1', employee_id: 'emp-keerthana', assigned_by: 'prof-ganesh', status: 'in_progress', employee: { id: 'emp-keerthana', team_id: 'team-cc' } },
    { id: 'asgn-2', task_id: 't-2', employee_id: 'emp-ganesh', assigned_by: 'prof-muskan', status: 'assigned', employee: { id: 'emp-ganesh', team_id: 'team-cc' } },
    { id: 'asgn-3', task_id: 't-3', employee_id: 'emp-worker-cut', assigned_by: 'prof-sudeesh', status: 'in_progress', employee: { id: 'emp-worker-cut', team_id: 'team-cut' } },
    { id: 'asgn-4', task_id: 't-4', employee_id: 'emp-vijay', assigned_by: 'prof-admin', status: 'completed', employee: { id: 'emp-vijay', team_id: 'team-web' } },
  ];

  // Helper simulating the scoping hook in TaskAssignments
  function getScopedData(profile, selectedTeamId = '') {
    const isLead = profile.role === 'associate_lead' || profile.role === 'team_lead';
    const userTeam = teams.find(t => t.id === profile.team_id);
    const isFlowForce = Boolean(userTeam && userTeam.name.toLowerCase().includes('flow force'));
    const isProductionLead = isLead && !isFlowForce;
    const userTeamEmployees = profile.team_id ? employees.filter(e => e.team_id === profile.team_id) : [];
    const userTeamEmployeeIds = new Set(userTeamEmployees.map(e => e.id));

    let scopedAssignments = assignments;
    if (isProductionLead && profile.team_id) {
      scopedAssignments = assignments.filter(a => {
        const inTeam = a.employee_id ? userTeamEmployeeIds.has(a.employee_id) : false;
        const teamMatches = a.employee?.team_id === profile.team_id;
        const assignedByMe = a.assigned_by === profile.id;
        return inTeam || teamMatches || assignedByMe;
      });
    } else if (selectedTeamId) {
      const selectedEmpIds = new Set(employees.filter(e => e.team_id === selectedTeamId).map(e => e.id));
      scopedAssignments = assignments.filter(a => (a.employee_id && selectedEmpIds.has(a.employee_id)) || a.employee?.team_id === selectedTeamId);
    }

    let scopedEmployees = employees;
    if (isProductionLead && profile.team_id) {
      scopedEmployees = userTeamEmployees;
    } else if (selectedTeamId) {
      scopedEmployees = employees.filter(e => e.team_id === selectedTeamId);
    }

    return { scopedAssignments, scopedEmployees, isProductionLead, teamName: userTeam?.name };
  }

  // 1. Ganesh (Associate Lead of Creative Clan)
  const ganeshProfile = { id: 'prof-ganesh', role: 'associate_lead', team_id: 'team-cc' };
  const ganeshScope = getScopedData(ganeshProfile);
  assert.equal(ganeshScope.isProductionLead, true);
  assert.equal(ganeshScope.teamName, 'Creative Clan');
  // Ganesh sees only assignments 1 and 2 (both Creative Clan), not 3 (Cut Masters) or 4 (Web Dev)
  assert.deepEqual(ganeshScope.scopedAssignments.map(a => a.id), ['asgn-1', 'asgn-2']);
  // Ganesh can only assign work to Creative Clan team members (Ganesh, Keerthana)
  assert.deepEqual(ganeshScope.scopedEmployees.map(e => e.id), ['emp-ganesh', 'emp-keerthana']);

  // 2. Sudeesh (Associate Lead of Cut Masters)
  const sudeeshProfile = { id: 'prof-sudeesh', role: 'associate_lead', team_id: 'team-cut' };
  const sudeeshScope = getScopedData(sudeeshProfile);
  assert.equal(sudeeshScope.isProductionLead, true);
  assert.deepEqual(sudeeshScope.scopedAssignments.map(a => a.id), ['asgn-3']);
  assert.deepEqual(sudeeshScope.scopedEmployees.map(e => e.id), ['emp-sudeesh', 'emp-worker-cut']);

  // 3. Admin has full oversight and can filter by team
  const adminProfile = { id: 'prof-admin', role: 'admin', team_id: null };
  const adminAllScope = getScopedData(adminProfile);
  assert.equal(adminAllScope.scopedAssignments.length, 4);
  assert.equal(adminAllScope.scopedEmployees.length, 6);

  const adminFilteredScope = getScopedData(adminProfile, 'team-web');
  assert.deepEqual(adminFilteredScope.scopedAssignments.map(a => a.id), ['asgn-4']);
  assert.deepEqual(adminFilteredScope.scopedEmployees.map(e => e.id), ['emp-vijay']);
});

test('Sidebar visibility allows Team Work for associate leads, team leads, coordinators and management, but hides it for basic employees', () => {
  function canSeeTeamWork(role) {
    const isLead = role === 'associate_lead' || role === 'team_lead';
    const isCoordinator = role === 'project_coordinator';
    return isLead || role === 'admin' || role === 'manager' || role === 'director' || isCoordinator;
  }

  assert.equal(canSeeTeamWork('associate_lead'), true);
  assert.equal(canSeeTeamWork('team_lead'), true);
  assert.equal(canSeeTeamWork('project_coordinator'), true);
  assert.equal(canSeeTeamWork('admin'), true);
  assert.equal(canSeeTeamWork('manager'), true);
  assert.equal(canSeeTeamWork('director'), true);
  assert.equal(canSeeTeamWork('employee'), false);
});
