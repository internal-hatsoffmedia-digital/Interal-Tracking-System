import { supabase } from './supabase';
import type { PerformanceRecordWithRelations } from '../types';

export async function getPerformanceRecords(): Promise<PerformanceRecordWithRelations[]> {
  const { data, error } = await supabase
    .from('performance_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback if view/table is named differently
    return [];
  }
  return (data ?? []) as PerformanceRecordWithRelations[];
}
