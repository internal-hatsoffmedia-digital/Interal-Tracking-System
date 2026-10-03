import { supabase } from './supabase';
import { requireActiveProfile, WorkspaceProfile } from './access';
export async function getWorkspaceProfile(userId: string): Promise<WorkspaceProfile> {
  const { data, error } = await supabase.from('profiles')
    .select('id,full_name,email,role,team_id,is_active').eq('id', userId).maybeSingle();
  if (error) throw new Error(`Unable to verify workspace access: ${error.message}`);
  return requireActiveProfile(data as WorkspaceProfile | null);
}
