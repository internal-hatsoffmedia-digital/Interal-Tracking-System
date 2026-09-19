export interface TeamMember {
  id: string;
  full_name: string;
  email?: string;
  role?: string;
}

export interface Team {
  id: string;
  name: string;
  team_type: string;
  description: string | null;
  team_lead_id: string | null;
  team_lead_name?: string | null;
  members?: TeamMember[];
  member_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamInput {
  name: string;
  team_type: string;
  description?: string;
  team_lead_id?: string | null;
}

export interface UpdateTeamInput {
  name?: string;
  team_type?: string;
  description?: string;
  team_lead_id?: string | null;
  is_active?: boolean;
}