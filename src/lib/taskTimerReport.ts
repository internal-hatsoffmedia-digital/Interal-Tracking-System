export type TaskTimerSession={id:string;assignment_id:string|null;project_id?:string;project_code?:string;project_name?:string;employee_id?:string;employee_name?:string;employee_code?:string;started_at:string;ended_at:string|null;completed_at:string|null};
const istDay=(time:number)=>new Date(time+19800000).toISOString().slice(0,10);
export function taskTimerSummary(sessions:TaskTimerSession[],day='',now=Date.now()){
 const selected=sessions.filter(s=>!day||istDay(Date.parse(s.started_at))===day);
 let seconds=0;
 for(const s of selected){
  const start=Date.parse(s.started_at),midnight=Date.parse(istDay(start)+'T00:00:00+05:30')+86400000;
  const finish=Math.min(s.ended_at?Date.parse(s.ended_at):now,now,midnight);
  seconds+=Math.max(0,(finish-start)/1000);
 }
 return {start:selected.length?selected.reduce((a,s)=>a<s.started_at?a:s.started_at,selected[0].started_at):null,
  end:sessions.find(s=>s.completed_at)?.completed_at??null,hours:seconds/3600,count:selected.length};
}
export function projectFocusSummary(sessions:TaskTimerSession[],day='',now=Date.now()){
 const groups=new Map<string,TaskTimerSession[]>();
 for(const s of sessions){if(!s.project_id||!s.employee_id)continue;const key=s.project_id+':'+s.employee_id;groups.set(key,[...(groups.get(key)??[]),s]);}
 return [...groups.entries()].map(([key,rows])=>{const total=taskTimerSummary(rows,day,now);const task=taskTimerSummary(rows.filter(s=>s.assignment_id),day,now);const project=taskTimerSummary(rows.filter(s=>!s.assignment_id),day,now);return {key,projectId:rows[0].project_id!,code:rows[0].project_code,name:rows[0].project_name,employee:rows[0].employee_name,employeeCode:rows[0].employee_code,taskHours:task.hours,projectHours:project.hours,hours:total.hours,count:total.count};}).filter(r=>r.count).sort((a,b)=>(a.code??'').localeCompare(b.code??'')||(a.employee??'').localeCompare(b.employee??''));
}
