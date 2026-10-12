type Worker={id:string;team_id:string|null};
type Work={employee_id:string;assigned_by:string;task_id:string;status:string};
type Task={id:string;project_id:string};
export function filterTeamAssignments<T extends Work>(rows:T[],members:Worker[],tasks:Task[],filters:{team:string;employee:string;coordinator:string;project:string;status?:string}){
 const workers=new Set(members.filter(e=>(!filters.team||e.team_id===filters.team)&&(!filters.employee||e.id===filters.employee)).map(e=>e.id));
 const projects=new Map(tasks.map(t=>[t.id,t.project_id]));
 return rows.filter(a=>workers.has(a.employee_id)&&(!filters.coordinator||a.assigned_by===filters.coordinator)&&(!filters.project||projects.get(a.task_id)===filters.project)&&(!filters.status||a.status===filters.status));
}
