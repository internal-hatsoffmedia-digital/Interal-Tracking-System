import {supabase} from '../../lib/supabase';
export const oversightRoles=['admin','associate_lead','team_lead'];
export async function getTeamOversight() {
  const auth=await supabase.auth.getUser();
  if(auth.error || !auth.data.user)throw new Error('Please sign in.');
  const result=await supabase.from('profiles').select('id,role,team_id,is_active').eq('id',auth.data.user.id).single();
  if(result.error)throw new Error(result.error.message);
  const profile=result.data;
  if(!profile.is_active || !oversightRoles.includes(profile.role))throw new Error('Team oversight is available to leads and associate leads.');
  if(profile.role!=='admin' && !profile.team_id)throw new Error('Your team is not linked. Ask your administrator to set your team before viewing coordinator activity.');
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
  const coordinators=people.filter(p=>p.role==='project_coordinator' && (profile.role==='admin'||p.team_id===profile.team_id));
  const coordinatorIds=coordinators.map(p=>p.id);
  const [projects,clients,createdTasks,assignments,employees]=await Promise.all([
    rows('projects','id,name,created_by,status,created_at,project_members(profile_id)'),
    rows('clients','id,name,created_by,created_at','created_by',coordinatorIds),
    rows('tasks','id,title,created_by,status,created_at','created_by',coordinatorIds),
    rows('task_assignments','id,task_id,employee_id,assigned_by,assigned_at,status,deadline_at,completed_at'),
    (async()=>{const response=await supabase.rpc('team_pc_workers');if(response.error)throw new Error(response.error.message);return response.data as Record<string,any>[];})(),
  ]);
  // RLS remains authoritative. Flow Force leads see work assigned by their own coordinators;
  // production leads see their own editors, administrators see all permitted editor work.
  const editors=employees.filter(e=>e.team_type==='cut_masters' && (profile.role==='admin' || coordinatorIds.length>0 || e.team_id===profile.team_id));
  const editorIds=editors.map(e=>e.id);
  const editorAssignments=assignments.filter(a=>editorIds.includes(a.employee_id) && (profile.role==='admin' || a.employee_id && editors.find(e=>e.id===a.employee_id)?.team_id===profile.team_id || coordinatorIds.includes(a.assigned_by)));
  const taskIds=[...new Set(assignments.map(a=>a.task_id))];
  const tasks=await rows('tasks','id,title,status,due_date','id',taskIds);
  return {coordinators,projects,clients,createdTasks,assignments:assignments.filter(a=>coordinatorIds.includes(a.assigned_by)),editors,editorAssignments,tasks,people,employees};
}
