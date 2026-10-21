export interface Project {
  completed_by_name?:string|null;
  completed_by_profile_id?:string|null;
  historical_artist?: string | null;
  historical_coordinator?: string | null;
  import_details?: Record<string, unknown> | null;
  production_team_ids?: string[];
  project_code?: string | null;
  category?: string | null;
  final_link?: string | null;
  remarks?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  rate?: number | null;

  id: string;

  client_id: string;

  name: string;

  series_title: string | null;

  description: string | null;

  total_assets_required: number;

  completed_assets: number;

  pending_assets: number;

  lead_employee_id: string | null;

  start_date: string | null;

  target_deadline: string | null;

  status: string;

  health: string;

  invoice_status: string;

  is_active: boolean;

  created_by: string | null;

  created_at: string;

  updated_at: string;
}


export interface ProjectWithRelations
  extends Project {
  creator_name?: string | null;
  creator?: {
    id: string;
    full_name: string;
    email?: string;
  } | null;

  client?: {
    id: string;
    name: string;
    short_name: string | null;
  } | null;

  lead_employee?: {
    id: string;
    full_name: string;
    employee_code: string;
  } | null;
}


export interface CreateProjectInput {
  production_team_ids?: string[];
  project_code?: string | null;
  category?: string | null;
  final_link?: string | null;
  remarks?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  rate?: number | null;

  client_id: string;

  name: string;

  series_title?: string | null;

  description?: string | null;

  total_assets_required?: number;

  completed_assets?: number;

  pending_assets?: number;

  lead_employee_id?: string | null;

  start_date?: string | null;

  target_deadline?: string | null;

  status: string;

  health: string;

  invoice_status: string;
}


export interface UpdateProjectInput {
  completed_by_profile_id?:string|null;
  production_team_ids?: string[];
  project_code?: string | null;
  category?: string | null;
  final_link?: string | null;
  remarks?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  rate?: number | null;

  client_id?: string;

  name?: string;

  series_title?: string | null;

  description?: string | null;

  total_assets_required?: number;

  completed_assets?: number;

  pending_assets?: number;

  lead_employee_id?: string | null;

  start_date?: string | null;

  target_deadline?: string | null;

  status?: string;

  health?: string;

  invoice_status?: string;

  is_active?: boolean;
}