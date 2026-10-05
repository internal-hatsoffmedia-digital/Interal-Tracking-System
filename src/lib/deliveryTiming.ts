export interface TimedDelivery {
  id: string; employee_id: string; status: string;
  deadline_at: string | null; completed_at: string | null;
}
export function deliveryMinutes(deadline: string | null, completion: string | null): number | null {
  if (!deadline || !completion) return null;
  const end = Date.parse(completion), due = Date.parse(deadline);
  return Number.isFinite(end) && Number.isFinite(due) ? (end - due) / 60000 : null;
}
export function indiaMonth(value: string | null): string | null {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  const parts = new Intl.DateTimeFormat('en', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit'}).formatToParts(new Date(value));
  return `${parts.find(p=>p.type==='year')?.value}-${parts.find(p=>p.type==='month')?.value}`;
}
export function monthlyTiming(rows: TimedDelivery[], month: string) {
  const totals = new Map<string,{employee_id:string;completed:number;lateMinutes:number;earlyMinutes:number;netMinutes:number;missing:number;pending:number;overdue:number}>();
  for (const row of rows) {
    // Attribute a delivery to its deadline month; month-boundary completions stay with their scheduled work.
    if (indiaMonth(row.deadline_at ?? row.completed_at) !== month) continue;
    const total = totals.get(row.employee_id) ?? {employee_id:row.employee_id,completed:0,lateMinutes:0,earlyMinutes:0,netMinutes:0,missing:0,pending:0,overdue:0};
    if (row.status !== 'completed') {
      if(row.status !== 'rejected') { total.pending++; if(row.deadline_at && Date.parse(row.deadline_at)<Date.now()) total.overdue++; }
    } else {
      total.completed++;
      const minutes = deliveryMinutes(row.deadline_at, row.completed_at);
      if(minutes===null)total.missing++;
      else {total.lateMinutes+=Math.max(0,minutes);total.earlyMinutes+=Math.max(0,-minutes);total.netMinutes+=minutes;}
    }
    totals.set(row.employee_id,total);
  }
  return [...totals.values()];
}
export function durationMinutes(value: number) {
  const minutes=Math.abs(value);
  return `${Math.floor(minutes/60)}h ${Number((minutes%60).toFixed(2))}m`;
}
