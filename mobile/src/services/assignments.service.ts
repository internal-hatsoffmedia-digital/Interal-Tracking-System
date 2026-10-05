import { supabase } from './supabase';
import { getWorkspaceProfile } from './profile.service';
import { canManageWork } from './access';
export interface WorkAssignment {
  id: string; task_id: string; employee_id: string; status: string; notes: string | null;
  assigned_at: string | null; assigned_by: string | null; assigner_name?: string | null;
  task: { id: string; title: string; status: string; due_date: string | null } | null;
  employee: { full_name: string } | null;
}
async function currentEmployee() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error(error?.message || 'Please sign in.');
  const result = await supabase.from('employees').select('id,is_active').eq('profile_id',user.id).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data?.is_active) throw new Error('Your account needs an active linked employee record. Contact your administrator.');
  return result.data;
}
export async function getAssignments(ownOnly: boolean): Promise<WorkAssignment[]> {
  let query = supabase.from('task_assignments').select('id,task_id,employee_id,status,notes,assigned_at,assigned_by,task:tasks(id,title,status,due_date),employee:employees(full_name)');
  if (ownOnly) query = query.eq('employee_id',(await currentEmployee()).id);
  const { data, error } = await query.order('assigned_at',{ascending:false});
  if (error) throw new Error(`Unable to load assignments: ${error.message}`);
  const ids = [...new Set((data || []).map(row=>row.assigned_by).filter(Boolean))];
  const profiles = ids.length ? await supabase.from('profiles').select('id,full_name').in('id',ids) : {data:[],error:null};
  if(profiles.error) throw new Error(`Unable to load assigners: ${profiles.error.message}`);
  return (data || []).map((row:any) => ({...row,assigner_name:profiles.data?.find(person=>person.id===row.assigned_by)?.full_name || null,task:Array.isArray(row.task)?row.task[0]:row.task,employee:Array.isArray(row.employee)?row.employee[0]:row.employee}));
}
export async function assignTask(taskId: string, employeeId: string) {
  if (!taskId || !employeeId) throw new Error('Select a task and employee.');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error(authError?.message || 'Please sign in.');
  if (!canManageWork(await getWorkspaceProfile(user.id))) throw new Error('Your role cannot assign tasks.');
  const { data: employee,error: employeeError } = await supabase.from('employees').select('id,is_active').eq('id',employeeId).single();
  if (employeeError) throw new Error(employeeError.message);
  if (!employee?.is_active) throw new Error('Select an active employee.');
  const { error } = await supabase.from('task_assignments').insert({task_id:taskId,employee_id:employeeId,assigned_by:user.id}).select('id').single();
  if (error) throw new Error(`Unable to assign task: ${error.message}`);
}
export async function acceptAssignment(assignmentId: string) {
  const employee = await currentEmployee();
  const { error } = await supabase.from('task_assignments').update({status:'accepted',accepted_at:new Date().toISOString()})
    .eq('id',assignmentId).eq('employee_id',employee.id).eq('status','assigned').select('id').single();
  if (error) throw new Error(`Unable to accept assignment: ${error.message}`);
}
