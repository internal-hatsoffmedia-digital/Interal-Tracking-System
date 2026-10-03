import { supabase } from './supabase';
import type { Timesheet, TimesheetWithRelations, CreateTimesheetInput } from '../types';

export async function getTimesheets(): Promise<TimesheetWithRelations[]> {
  const { data, error } = await supabase
    .from('timesheets')
    .select('*')
    .order('work_date', { ascending: false });

  if (error) throw new Error(`Unable to load timesheets: ${error.message}`);
  return (data ?? []) as TimesheetWithRelations[];
}

export async function createTimesheet(input: CreateTimesheetInput): Promise<Timesheet> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to log hours.');
  const hours = input.total_hours ?? 0;
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) throw new Error('Hours must be greater than zero and no more than 24.');

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id,is_active')
    .eq('profile_id', user?.id || '')
    .maybeSingle();
  if (employeeError) throw new Error(`Unable to load your employee record: ${employeeError.message}`);
  if (!employee?.id || !employee.is_active) throw new Error('Your account needs an active linked employee record to log hours.');

  const { data, error } = await supabase
    .from('timesheets')
    .insert({
      employee_id: employee.id,
      task_id: input.task_id,
      work_date: input.work_date,
      start_time: input.start_time,
      end_time: input.end_time || null,
      total_hours: input.total_hours || 0,
      delay_reason: input.delay_reason || null,
      performance: input.performance || 'green',
      notes: input.notes || null,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Unable to create timesheet: ${error.message}`);
  return data as Timesheet;
}
