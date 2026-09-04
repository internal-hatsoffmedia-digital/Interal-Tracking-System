/* =========================================================
   PERFORMANCE
========================================================= */

export type PerformanceStatus =
  | "green"
  | "orange"
  | "red";

/* =========================================================
   TIMESHEET
========================================================= */

export interface Timesheet {
  id: string;

  employee_id: string;

  task_id: string;

  work_date: string;

  start_time: string;

  end_time: string | null;

  total_hours: number;

  delay_reason: string | null;

  performance: string;

  notes: string | null;

  created_at: string;

  updated_at: string;
}

/* =========================================================
   TIMESHEET RELATIONS
========================================================= */

export interface TimesheetWithRelations
  extends Timesheet {
  employee?: {
    id: string;

    full_name: string;

    employee_code: string;

    email: string;
  } | null;

  task?: {
    id: string;

    title: string;

    client_id: string;

    project_id: string;

    category: string;

    priority: string;

    status: string;

    estimated_hours: number;

    due_date: string | null;
  } | null;

  client?: {
    id: string;

    name: string;

    short_name: string | null;
  } | null;

  project?: {
    id: string;

    name: string;

    series_title: string | null;
  } | null;
}

/* =========================================================
   CREATE TIMESHEET
========================================================= */

export interface CreateTimesheetInput {
  task_id: string;

  work_date: string;

  start_time: string;

  end_time?: string | null;

  total_hours?: number;

  delay_reason?: string | null;

  performance: string;

  notes?: string | null;
}

/* =========================================================
   UPDATE TIMESHEET
========================================================= */

export interface UpdateTimesheetInput {
  task_id?: string;

  work_date?: string;

  start_time?: string;

  end_time?: string | null;

  total_hours?: number;

  delay_reason?: string | null;

  performance?: string;

  notes?: string | null;
}

/* =========================================================
   TIMESHEET FORM
========================================================= */

export interface TimesheetFormData {
  task_id: string;

  work_date: string;

  start_time: string;

  end_time: string;

  performance: string;

  delay_reason: string;

  notes: string;
}

/* =========================================================
   TIMESHEET SUMMARY
========================================================= */

export interface TimesheetSummary {
  totalEntries: number;

  totalHours: number;

  averageHours: number;

  greenCount: number;

  orangeCount: number;

  redCount: number;
}