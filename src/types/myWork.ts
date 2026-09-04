export interface MyWorkItem {
  assignment_id: string;
  task_id: string;

  task_title: string;
  task_description: string | null;

  client_id: string | null;
  client_name: string | null;
  client_short_name: string | null;

  project_id: string | null;
  project_name: string | null;
  series_title: string | null;

  category: string;
  revision_status: string;
  priority: string;
  task_status: string;

  assignment_status: string;

  planned_date: string | null;
  start_date: string | null;
  due_date: string | null;

  estimated_hours: number;
  actual_hours: number;

  footage_link: string | null;
  special_notes: string | null;
  delay_reason: string | null;

  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;

  assignment_notes: string | null;
}

export interface MyWorkStats {
  total: number;
  assigned: number;
  accepted: number;
  inProgress: number;
  completed: number;
  overdue: number;
  estimatedHours: number;
  actualHours: number;
}