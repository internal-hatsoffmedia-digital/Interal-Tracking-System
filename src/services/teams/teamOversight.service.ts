import {getTaskArtists} from '../employees/employees.service';
import {coordinatorDirectory} from '../../lib/coordinatorDirectory';
import {supabase} from '../../lib/supabase';
export const oversightRoles=['admin','manager','director','associate_lead','team_lead'];
export async function getTeamOversight(ownTeam=false) {
  const auth=await supabase.auth.getUser();
  if(auth.error || !auth.data.user)throw new Error('Please sign in.');
  const result=await supabase.from('profiles').select('id,role,team_id,is_active').eq('id',auth.data.user.id).single();
  if(result.error)throw new Error(result.error.message);
  const profile=result.data;
  if(!profile.is_active || !oversightRoles.includes(profile.role))throw new Error('Team oversight is available to leads and associate leads.');
  if(!['admin','manager','director'].includes(profile.role) && !profile.team_id)throw new Error('Your team is not linked. Ask your administrator to set your team before viewing coordinator activity.');
  async function rows(table:string,columns:string,key?:string,values?:string[]) {
    if(key && !values?.length)return [];
    const all:Record<string,any>[]=[];
    for(let offset=0;;offset+=500){
      let query=supabase.from(table).select(columns).order('id').range(offset,offset+499);
      if(key)query=query.in(key,values!);
      const response=await query;
      if(response.error)throw new Error(`${table}: ${response.error.message}`);
      const page=response.data ?? [];all.push(...page);if(page.length<500)break;
    }
    return all;
  }
  const peopleResult=await supabase.rpc('project_people');
  if(peopleResult.error)throw new Error(peopleResult.error.message);
  const people=peopleResult.data as {id:string;full_name:string|null;role:string;team_id:string|null;is_active:boolean}[];
  const teams=await rows('teams','id,name,team_type');
  const coordinators=coordinatorDirectory(people,teams as {id:string;name:string;team_type:string}[],profile);
  const coordinatorIds=coordinators.map(p=>p.id);
  const [projects,clients,createdTasks,assignments,workers]=await Promise.all([
    rows('projects','id,project_code,name,created_by,status,created_at,project_members(profile_id)'),
    rows('clients','id,name,created_by,created_at','created_by',coordinatorIds),
    rows('tasks','id,title,project_id,created_by,status,created_at','created_by',coordinatorIds),
    rows('task_assignments','id,task_id,employee_id,assigned_by,assigned_at,status,deadline_at,completed_at'),
    getTaskArtists(),

  ]);
  const employees=workers.map(w=>({...w,team_type:teams.find(t=>t.id===w.team_id)?.team_type}));
  // RLS remains authoritative. Flow Force leads see work assigned by their own coordinators;
  // production leads see their own team members, administrators see all permitted work.
  const flowForce=teams.some(t=>t.id===profile.team_id&&(t.team_type==='flow_force'||t.team_type==='project_coordination'||t.name.toLowerCase()==='flow force'));
  const productionSupervisor=flowForce&&['manager','director','associate_lead'].includes(profile.role);
  const teamMembers=employees.filter(e=>(!ownTeam||e.team_id===profile.team_id)&&(productionSupervisor || ['admin','manager','director'].includes(profile.role) || coordinatorIds.length>0 || e.team_id===profile.team_id));
  const memberIds=teamMembers.map(e=>e.id);
  const teamAssignments=assignments.filter(a=>memberIds.includes(a.employee_id) && (productionSupervisor || ['admin','manager','director'].includes(profile.role) || a.employee_id && teamMembers.find(e=>e.id===a.employee_id)?.team_id===profile.team_id || coordinatorIds.includes(a.assigned_by)));
  const taskIds=[...new Set(assignments.map(a=>a.task_id))];
  const tasks=await rows('tasks','id,title,project_id,status,due_date','id',taskIds);
  const memberProfiles=new Set(teamMembers.map(e=>e.profile_id).filter(Boolean));
  const activity=await rows('project_activity','id,project_id,actor_id,action,created_at','actor_id',[...new Set([...memberProfiles,...(ownTeam?[]:coordinatorIds)])] as string[]);
  const auditResult=await supabase.rpc('team_pc_work_activity');
  if(auditResult.error)throw new Error('Activity log: '+auditResult.error.message);
  const workActivity=(auditResult.data??[]) as {id:string;actor_id:string;project_id:string|null;entity_type:string;title:string;action:string;changed_fields:string[];created_at:string}[];
  const visibleProjects=ownTeam?projects.filter(p=>tasks.some(t=>t.project_id===p.id&&teamAssignments.some(a=>a.task_id===t.id))||memberProfiles.has(p.created_by)):projects;
  return {workActivity:ownTeam?workActivity.filter(a=>memberProfiles.has(a.actor_id)):workActivity,activity,coordinators,projects:visibleProjects,clients:ownTeam?clients.filter(c=>memberProfiles.has(c.created_by)):clients,createdTasks:ownTeam?createdTasks.filter(t=>memberProfiles.has(t.created_by)):createdTasks,assignments:assignments.filter(a=>coordinatorIds.includes(a.assigned_by)),teamMembers,teamAssignments,tasks,people,employees,teams};
}
