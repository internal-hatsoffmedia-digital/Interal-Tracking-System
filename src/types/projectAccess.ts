import type { ProjectWithRelations } from './project';
import type { UserRole } from './auth';

export interface ProjectMember {
  project_id: string;
  profile_id: string;
  access_kind: 'assignee' | 'shared';
  granted_by: string | null;
  granted_at: string | null;
}
export interface ProjectPerson {
  id: string;
  full_name: string | null;
  role: UserRole;
  team_id: string | null;
  is_active: boolean;
}
export interface ManagedProject extends ProjectWithRelations {
  team_id: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  associate_assigned: boolean;
  project_members: ProjectMember[];
}
export interface ProjectActivity {
  id: string;
  actor_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}
export interface ProjectNotification {
  entity_type?:'project'|'sales_lead'|'task';
  id: string;
  project_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
}
