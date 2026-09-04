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