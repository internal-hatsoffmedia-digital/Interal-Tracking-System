export type WorkAssignment={id:string;employee_id:string;profile_id:string;name:string;team_id:string|null;team:string|null;task:string;task_id:string;project_id:string;project:string;project_code:string;project_status:string;status:string;assigned_at:string;committed_at:string|null;completed_at:string|null};
export type WorkTimer={id:string;employee_id:string;profile_id:string;name:string;team_id:string|null;team:string|null;project_id:string;project:string;project_code:string;assignment_id:string|null;day:string;hours:number;running:boolean};
export type WorkProject={id:string;name:string;code:string;status:string;completed_at:string|null};
export type WorkInsights={as_of:string;people:{employee_id:string;name:string;team_id:string|null;team:string|null}[];assignments:WorkAssignment[];timers:WorkTimer[];projects:WorkProject[]};
export type WorkResult='on_time'|'late'|'hold'|'open'|'unconfirmed';
export function workResult(a:WorkAssignment,asOf:string):WorkResult{
 const limit=Date.parse(asOf);const completed=a.completed_at&&Date.parse(a.completed_at)<=limit?Date.parse(a.completed_at):null;const deadline=a.committed_at?Date.parse(a.committed_at):null;
 if(completed!==null)return deadline===null?'unconfirmed':completed<=deadline?'on_time':'late';
 if(a.status==='completed'&&!a.completed_at)return 'unconfirmed';
 if(a.project_status==='on_hold')return 'hold';
 return deadline!==null&&deadline<limit?'late':'open';
}
export const resultLabels:Record<WorkResult,string>={on_time:'Completed on time',late:'Deadline missed',hold:'Project on hold',open:'In progress / assigned',unconfirmed:'Completed · no commitment'};
export function employeeWorkSummary(rows:WorkAssignment[],timers:WorkTimer[],asOf:string){
 const people=new Map<string,{id:string;name:string;team:string;assigned:number;completed:number;onTime:number;late:number;hold:number;unconfirmed:number;hours:number}>();
 const ensure=(id:string,name:string,team:string|null)=>{if(!people.has(id))people.set(id,{id,name,team:team||'No team',assigned:0,completed:0,onTime:0,late:0,hold:0,unconfirmed:0,hours:0});return people.get(id)!;};
 for(const a of rows){const p=ensure(a.employee_id,a.name,a.team);p.assigned++;const status=workResult(a,asOf);if(a.completed_at&&Date.parse(a.completed_at)<=Date.parse(asOf))p.completed++;if(status==='on_time')p.onTime++;if(status==='late')p.late++;if(status==='hold')p.hold++;if(status==='unconfirmed')p.unconfirmed++;}
 for(const t of timers)ensure(t.employee_id,t.name,t.team).hours+=Number(t.hours);
 return [...people.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
