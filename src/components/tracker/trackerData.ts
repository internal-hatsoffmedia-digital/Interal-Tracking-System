import { supabase } from '../../lib/supabase';
export const displayTime = (value?: string | null) => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-IN', {timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value)) : '—';
export const safeLink = (value?: string | null) => { try { const url = new URL(value ?? ''); return ['http:','https:'].includes(url.protocol) ? url.href : null; } catch { return null; } };
export async function readVisibleRows<T>(table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  for (let start=0;;start+=500) {
    const {data,error}=await supabase.from(table).select(columns).order('id').range(start,start+499);
    if(error)throw new Error(`Unable to load ${table}: ${error.message}`);
    rows.push(...data as unknown as T[]); if(data.length<500)return rows;
  }
}
export interface Team {id:string;name:string}
export interface WorkLog {id:string;task_id:string;employee_id:string;work_date:string;start_time:string;end_time:string|null;total_hours:number}
export function logTime(log:WorkLog, end=false) { const value=end?log.end_time:log.start_time; return value ? `${log.work_date} ${value.slice(0,5)}` : '—'; }
