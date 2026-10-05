import { supabase } from './supabase';
import type { PerformanceRecordWithRelations } from '../types';

export async function getPerformanceRecords(): Promise<PerformanceRecordWithRelations[]> {
  const { data, error } = await supabase
    .from('performance_records')
    .select('*,employee:employees(full_name,employee_code)')
    .order('created_at', { ascending: false });

  if (error) {
    // Surface schema and permission errors to the screen
    throw new Error(`Unable to load performance records: ${error.message}`);
  }
  return (data ?? []) as PerformanceRecordWithRelations[];
}
