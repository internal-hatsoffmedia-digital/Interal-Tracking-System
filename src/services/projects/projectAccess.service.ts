import { supabase } from '../../lib/supabase';
import type { ManagedProject, ProjectActivity, ProjectNotification, ProjectPerson } from '../../types/projectAccess';

export async function loadProjectWorkspace(allowLegacyAdminView = false) {
  const projects: ManagedProject[] = [];
  // Fetch all visible rows instead of silently accepting the API's default row cap.
  for (let start = 0; ; start += 500) {
    const { data, error } = await supabase.from('projects')
      .select('*, project_members(*), client:clients(id,name,short_name), lead_employee:employees(id,full_name,employee_code)')
      .order('id').range(start, start + 499);
    if (error) {
      if (allowLegacyAdminView && error.code === 'PGRST200' && error.message.includes('project_members')) {
        const legacy: ManagedProject[] = [];
        for (let offset = 0; ; offset += 500) {
          const result = await supabase.from('projects')
            .select('*, client:clients(id,name,short_name), lead_employee:employees(id,full_name,employee_code)')
            .order('id').range(offset, offset + 499);
          if (result.error) throw new Error(result.error.message);
          legacy.push(...result.data.map(p => ({...p, team_id:null, assigned_by:null, assigned_at:null,
            associate_assigned:false, project_members:[]} as unknown as ManagedProject)));
          if (result.data.length < 500) break;
        }
        return {projects:legacy,people:[] as ProjectPerson[],schemaReady:false};
      }
      throw new Error(`Unable to load project workspace: ${error.message}`);
    }
    projects.push(...(data as unknown as ManagedProject[]));
    if (data.length < 500) break;
  }
  const { data, error } = await supabase.rpc('project_people');
  if (error) throw new Error(`Unable to load project people: ${error.message}`);
  return { projects, people: data as ProjectPerson[],schemaReady:true };
}
export async function saveProjectAccess(id: string, assignees: string[], shared: string[]) {
  const { error } = await supabase.rpc('set_project_access', {
    p_project_id: id, p_assignees: assignees, p_shared: shared,
  });
  if (error) throw new Error(error.message);
}
export async function loadProjectActivity(id: string) {
  const { data, error } = await supabase.from('project_activity').select('*')
    .eq('project_id', id).order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return data as ProjectActivity[];
}
export async function loadProjectNotifications() {
  const { data, error } = await supabase.from('project_notifications').select('*')
    .order('created_at', { ascending: false }).limit(100);
  if (error && !['PGRST205','42P01'].includes(error.code)) throw new Error(error.message);
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return [];
  const sales=await supabase.from('notifications').select('id,entity_id,entity_type,title,message,created_at,read_at')
    .eq('user_id',user.id).in('entity_type',['sales_lead','task']).order('created_at',{ascending:false}).limit(100);
  if(sales.error)throw new Error(sales.error.message);
  return [...(data ?? []) as ProjectNotification[],...sales.data.map(n=>({id:n.id,project_id:n.entity_id,message:n.title+': '+n.message,created_at:n.created_at,read_at:n.read_at,entity_type:n.entity_type as 'sales_lead'|'task'}))]
    .sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,100);
}
export async function readProjectNotification(id: string,entityType?:string) {
  const { error } = await supabase.rpc(entityType==='task'?'workspace_read_notification':entityType==='sales_lead'?'sales_read_notification':'mark_project_notification_read', { p_id: id });
  if (error) throw new Error(error.message);
}
