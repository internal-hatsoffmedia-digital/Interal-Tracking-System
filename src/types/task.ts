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
  project?: {
    id: string;
    name: string;
    series_title: string | null;
  } | null;

  client?: {
    id: string;
    name: string;
    short_name: string | null;
  } | null;
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