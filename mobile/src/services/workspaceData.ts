import { supabase } from './supabase';
export async function workspaceRows(table: string, columns: string, filter?: {column:string;value:string}) {
  const rows:any[]=[];
  for(let start=0;;start+=500) {
    let query=supabase.from(table).select(columns).order('id').range(start,start+499);
    if(filter) query=query.eq(filter.column,filter.value);
    const {data,error}=await query;
    if(error) throw new Error(`Unable to load ${table}: ${error.message}`);
    rows.push(...(data || []));
    if(!data || data.length<500) return rows;
  }
}
export function localDate(date=new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function completed(status:string) { return ['approved_delivered','approved_and_delivered','completed'].includes(status); }
export function validDate(value:string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date=new Date(value+'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10)===value;
}
