export interface Client {
  id: string;
  name: string;
  short_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  assigned_coordinator_id?: string | null;
  assigned_coordinator?: {
    id: string;
    full_name: string;
    email?: string | null;
  } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  name: string;
  short_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  assigned_coordinator_id?: string | null;
}

export interface UpdateClientInput {
  name?: string;
  short_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  assigned_coordinator_id?: string | null;
  is_active?: boolean;
}

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

export interface ProjectWithRelations extends Project {
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

export interface TaskWithRelations extends Task {
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
  assignment?: {
    id: string;
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

export interface Employee {
  id: string;
  profile_id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  team_id: string | null;
  joining_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWithTeam extends Employee {
  team?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateEmployeeInput {
  profile_id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string | null;
  job_title?: string | null;
  team_id?: string | null;
  joining_date?: string | null;
}

export interface UpdateEmployeeInput {
  employee_code?: string;
  full_name?: string;
  email?: string;
  phone?: string | null;
  job_title?: string | null;
  team_id?: string | null;
  joining_date?: string | null;
  is_active?: boolean;
}

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

export interface TimesheetWithRelations extends Timesheet {
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

export interface PerformanceRecordWithRelations extends PerformanceRecord {
  employee?: {
    id: string;
    full_name: string;
    employee_code: string;
    email: string;
    job_title: string | null;
    team_id: string | null;
  } | null;
  task?: {
    id: string;
    title: string;
    category: string;
    priority: string;
    status: string;
    estimated_hours: number;
    actual_hours: number;
    due_date: string | null;
  } | null;
}

export type SalesSource = 'Cold Call' | 'Cold DM' | 'Field Visit' | 'Website' | 'Digital Mktg';
export type SalesStage = 'lead' | 'prospect' | 'proposal' | 'won' | 'lost';

export interface SalesLead {
  id: string;
  name: string;
  company: string;
  ownerId: string;
  ownerName: string;
  source: SalesSource;
  stage: SalesStage;
  createdOn: string;
  wonOn: string | null;
  revenue: number;
  nextFollowUp: string | null;
  contactName?: string;
  email?: string;
  phone?: string;
  campaign?: string;
  notes?: string;
  updatedAt?: string;
}

export interface SalesActivity {
  id: string;
  leadId: string;
  ownerId: string;
  occurredOn: string;
  kind?: string;
  notes?: string;
}

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
