export type UserRole =
  | "admin"
  | "director"
  | "associate_lead"
  | "project_coordinator"
  | "team_lead"
  | "employee";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  team_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  job_title: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}
