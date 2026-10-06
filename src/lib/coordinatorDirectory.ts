type Person={id:string;full_name:string|null;role:string;team_id:string|null;is_active:boolean};
type Team={id:string;name:string;team_type?:string};
export function coordinatorDirectory<T extends Person>(people:T[],teams:Team[],viewer:{role:string;team_id:string|null}){
 const flowTeams=new Set(teams.filter(t=>['flow_force','project_coordination'].includes(t.team_type??'')||t.name.trim().toLowerCase()==='flow force').map(t=>t.id));
 return people.filter(p=>p.is_active&&(p.role==='project_coordinator'||(!!p.team_id&&flowTeams.has(p.team_id)&&['manager','director','associate_lead','team_lead'].includes(p.role)))&&(['admin','manager','director'].includes(viewer.role)||p.team_id===viewer.team_id)).sort((a,b)=>(a.full_name??'').localeCompare(b.full_name??''));
}
