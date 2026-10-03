export type WorkspaceRole = 'admin' | 'director' | 'associate_lead' | 'project_coordinator' | 'team_lead' | 'employee';
export interface WorkspaceProfile {
  id: string;
  full_name: string;
  email: string;
  role: WorkspaceRole;
  team_id: string | null;
  is_active: boolean;
}
export function requireActiveProfile(profile: WorkspaceProfile | null): WorkspaceProfile {
  if (!profile) throw new Error('Your workspace profile is missing. Contact your administrator.');
  if (!profile.is_active) throw new Error('Your workspace access is inactive. Contact your administrator.');
  if (!['admin', 'director', 'associate_lead', 'project_coordinator', 'team_lead', 'employee'].includes(profile.role)) {
    throw new Error('Your account has an unsupported workspace role. Contact your administrator.');
  }
  return profile;
}
export function canManageWork(profile: WorkspaceProfile | null): boolean {
  return !!profile?.is_active && ['admin', 'associate_lead', 'project_coordinator'].includes(profile.role);
}
