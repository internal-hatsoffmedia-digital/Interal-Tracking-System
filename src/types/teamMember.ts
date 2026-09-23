import type { UserRole } from "./auth";

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  employee_code: string;
  role: UserRole;
  job_title: string | null;
  team_id: string | null;
  team_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateTeamMemberInput {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  job_title?: string;
  team_id?: string;
  is_active?: boolean;
}

export interface UpdateTeamMemberInput {
  full_name: string;
  role: UserRole;
  job_title?: string;
  team_id?: string;
  is_active?: boolean;
}
