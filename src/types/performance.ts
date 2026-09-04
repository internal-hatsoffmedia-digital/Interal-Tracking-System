/* =========================================================
   PERFORMANCE TYPES
========================================================= */

/*
 * Performance values are intentionally kept as strings.
 *
 * The PostgreSQL enum values in the database have not been
 * verified yet, so we should not hard-code database enum
 * values here.
 */

export type PerformanceStatus =
  | "green"
  | "orange"
  | "red";

/* =========================================================
   PERFORMANCE RECORD
========================================================= */

export interface PerformanceRecord {
  id: string;

  employee_id: string;

  task_id: string | null;

  period_start: string;

  period_end: string;

  tasks_completed: number;

  tasks_delayed: number;

  total_hours: number;

  average_task_hours: number;

  performance: string;

  remarks: string | null;

  created_at: string;

  updated_at: string;
}

/* =========================================================
   EMPLOYEE RELATION
========================================================= */

export interface PerformanceEmployee {
  id: string;

  full_name: string;

  employee_code: string;

  email: string;

  job_title: string | null;

  team_id: string | null;
}

/* =========================================================
   TASK RELATION
========================================================= */

export interface PerformanceTask {
  id: string;

  title: string;

  category: string;

  priority: string;

  status: string;

  estimated_hours: number;

  actual_hours: number;

  due_date: string | null;
}

/* =========================================================
   PERFORMANCE RECORD WITH RELATIONS
========================================================= */

export interface PerformanceRecordWithRelations
  extends PerformanceRecord {
  employee: PerformanceEmployee | null;

  task: PerformanceTask | null;
}

/* =========================================================
   CREATE PERFORMANCE RECORD
========================================================= */

export interface CreatePerformanceRecordInput {
  employee_id: string;

  task_id?: string | null;

  period_start: string;

  period_end: string;

  tasks_completed?: number;

  tasks_delayed?: number;

  total_hours?: number;

  average_task_hours?: number;

  performance: string;

  remarks?: string | null;
}

/* =========================================================
   UPDATE PERFORMANCE RECORD
========================================================= */

export interface UpdatePerformanceRecordInput {
  employee_id?: string;

  task_id?: string | null;

  period_start?: string;

  period_end?: string;

  tasks_completed?: number;

  tasks_delayed?: number;

  total_hours?: number;

  average_task_hours?: number;

  performance?: string;

  remarks?: string | null;
}

/* =========================================================
   EMPLOYEE PERFORMANCE SUMMARY
========================================================= */

export interface EmployeePerformanceSummary {
  employee_id: string;

  employee_name: string;

  employee_code: string;

  total_tasks: number;

  completed_tasks: number;

  delayed_tasks: number;

  total_hours: number;

  average_task_hours: number;

  completion_rate: number;

  performance: string;
}

/* =========================================================
   PERFORMANCE DASHBOARD SUMMARY
========================================================= */

export interface PerformanceDashboardSummary {
  totalEmployees: number;

  totalTasks: number;

  completedTasks: number;

  delayedTasks: number;

  totalHours: number;

  averageTaskHours: number;

  greenCount: number;

  orangeCount: number;

  redCount: number;

  completionRate: number;
}

/* =========================================================
   PERFORMANCE PERIOD
========================================================= */

export type PerformancePeriod =
  | "today"
  | "this_week"
  | "this_month"
  | "custom";

/* =========================================================
   PERFORMANCE FILTERS
========================================================= */

export interface PerformanceFilters {
  employeeId: string;

  performance: string;

  period: PerformancePeriod;

  startDate: string;

  endDate: string;

  search: string;
}

/* =========================================================
   PERFORMANCE FORM DATA
========================================================= */

export interface PerformanceFormData {
  employee_id: string;

  task_id: string;

  period_start: string;

  period_end: string;

  tasks_completed: string;

  tasks_delayed: string;

  total_hours: string;

  average_task_hours: string;

  performance: string;

  remarks: string;
}