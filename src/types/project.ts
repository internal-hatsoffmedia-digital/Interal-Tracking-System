export interface Project {
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