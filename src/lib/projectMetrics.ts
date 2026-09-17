import type { ManagedProject } from '../types/projectAccess';

export const projectStatuses = ['planning', 'in_progress', 'on_hold', 'completed'];
export const isCompleted = (p: ManagedProject) => p.status === 'completed';
export const isOngoing = (p: ManagedProject) => p.is_active && !isCompleted(p);
export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const isOverdue = (p: ManagedProject, today = todayLocal()) =>
  isOngoing(p) && !!p.target_deadline && p.target_deadline < today;
export function missingFields(p: ManagedProject) {
  return [!p.name?.trim() && 'Project name', !p.client_id && 'Client',
    !p.project_members.some(m => m.access_kind === 'assignee') && 'Assignee',
    !p.target_deadline && 'Deadline', !p.start_date && 'Start date',
    !p.status && 'Status', !p.team_id && 'Team', !p.assigned_by && 'Assignment provenance']
    .filter((x): x is string => !!x);
}
export function summarizeProjects(projects: ManagedProject[]) {
  const completed = projects.filter(isCompleted).length;
  return { total: projects.length, ongoing: projects.filter(isOngoing).length, completed,
    onHold: projects.filter(p => p.is_active && p.status === 'on_hold').length,
    overdue: projects.filter(p => isOverdue(p)).length,
    incomplete: projects.filter(p => missingFields(p).length).length,
    completionRate: projects.length ? Math.round(completed / projects.length * 100) : 0 };
}
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  // Prevent spreadsheet formula execution, including whitespace-prefixed formulas.
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
