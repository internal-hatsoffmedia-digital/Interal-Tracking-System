import { supabase } from './supabase';
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '../types';

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) throw new Error(`Unable to load employees: ${error.message}`);
  return (data ?? []) as Employee[];
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .insert({
      profile_id: input.profile_id,
      employee_code: input.employee_code,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone || null,
      job_title: input.job_title || null,
      team_id: input.team_id || null,
      joining_date: input.joining_date || null,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Unable to create employee: ${error.message}`);
  return data as Employee;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Unable to update employee: ${error.message}`);
  return data as Employee;
}
