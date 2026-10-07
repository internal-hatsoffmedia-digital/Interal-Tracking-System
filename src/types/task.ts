export interface Task {
  id: string;

  project_id: string;
  client_id: string;

  title: string;
  description: string | null;

  category: string;
  revision_status: string;
  priority: string;
  status: string;

  planned_date: string | null;

  start_date: string | null;
  due_date: string | null;

  estimated_hours: number;
  actual_hours: number;

  footage_link: string | null;
  special_notes: string | null;
  delay_reason: string | null;

  created_by: string | null;

  created_at: string;
  updated_at: string;
}


export interface TaskWithRelations
  extends Task {
  creator_name?: string | null;
  creator?: {
    id: string;
    full_name: string;
    email?: string;
  } | null;

  project?: {
    id: string;
    name: string;
    series_title: string | null;
    client_id?: string | null;
    client?: {
      id: string;
      name: string;
      short_name: string | null;
    } | null;
  } | null;

  client?: {
    id: string;
    name: string;
    short_name: string | null;
  } | null;

  assignment?: {
    id: string;
    assigned_by?: string | null;
    assigner_name?: string | null;
    status: string;
    notes: string | null;
    assigned_at: string;
    employee_id: string;
    employee?: {
      id: string;
      full_name: string;
      employee_code: string;
      email: string;
      job_title: string | null;
      team_id: string | null;
    } | null;
  } | null;
  assignments?: NonNullable<TaskWithRelations['assignment']>[];
}


export interface CreateTaskInput {
  project_id: string;
  client_id: string;

  title: string;

  description?: string | null;

  category: string;
  revision_status: string;
  priority: string;
  status: string;

  planned_date?: string | null;

  start_date?: string | null;
  due_date?: string | null;

  estimated_hours?: number;
  actual_hours?: number;

  footage_link?: string | null;

  special_notes?: string | null;

  delay_reason?: string | null;
}


export interface UpdateTaskInput {
  project_id?: string;
  client_id?: string;

  title?: string;

  description?: string | null;

  category?: string;
  revision_status?: string;
  priority?: string;
  status?: string;

  planned_date?: string | null;

  start_date?: string | null;
  due_date?: string | null;

  estimated_hours?: number;
  actual_hours?: number;

  footage_link?: string | null;

  special_notes?: string | null;

  delay_reason?: string | null;
}
