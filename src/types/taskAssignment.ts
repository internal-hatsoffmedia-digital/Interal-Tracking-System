export type TaskAssignmentStatus =
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "rejected";

export interface TaskAssignment {
  id: string;
  task_id: string;
  employee_id: string;
  assigned_by: string;

  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;

  status: string;
  notes: string | null;
  created_at: string;
}

/* =========================================================
   RELATION TYPES
========================================================= */

export interface TaskAssignmentWithRelations
  extends TaskAssignment {
  task?: {
    id: string;
    title: string;
    project_id: string;
    client_id: string;
    category: string;
    priority: string;
    status: string;
    planned_date: string | null;
    due_date: string | null;
    estimated_hours: number;
  } | null;

  employee?: {
    id: string;
    full_name: string;
    employee_code: string;
    email: string;
    job_title: string | null;
    team_id: string | null;
  } | null;

  assigned_by_profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
  } | null;
}

/* =========================================================
   CREATE
========================================================= */

export interface CreateTaskAssignmentInput {
  task_id: string;
  employee_id: string;
  notes?: string | null;
}

/* =========================================================
   UPDATE
========================================================= */

export interface UpdateTaskAssignmentInput {
  employee_id?: string;
  status?: string;
  notes?: string | null;
}

/* =========================================================
   STATUS UPDATE
========================================================= */

export interface UpdateTaskAssignmentStatusInput {
  status: string;
  notes?: string | null;
}