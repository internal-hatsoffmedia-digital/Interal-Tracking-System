import {supabase} from '../../lib/supabase';
export interface MyTeamData {
 id:string;name:string;description:string|null;
 members:{id:string;full_name:string;email:string|null;job_title:string|null;is_active:boolean}[];
}
export async function getMyTeam():Promise<MyTeamData|null> {
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError)throw new Error(authError.message);
 if(!user)throw new Error('Please sign in to view your team.');
 const {data:profile,error:profileError}=await supabase.from('profiles').select('role,team_id,is_active').eq('id',user.id).single();
 if(profileError)throw new Error(profileError.message);
 if(!profile?.is_active || !['associate_lead','team_lead'].includes(profile.role))throw new Error('My Team is available to team leads and associate leads.');
 if(!profile.team_id)return null;
 const [teamResult, membersResult, profilesResult] = await Promise.all([
  supabase.from('teams').select('id,name,description').eq('id', profile.team_id).single(),
  supabase.from('employees').select('id,full_name,email,job_title,is_active,profile_id').eq('team_id', profile.team_id).order('full_name'),
  supabase.from('profiles').select('id,full_name,email,job_title,is_active').eq('team_id', profile.team_id).order('full_name'),
 ]);
 if (teamResult.error) throw new Error(teamResult.error.message);

 const memberMap = new Map<string, { id: string; full_name: string; email: string | null; job_title: string | null; is_active: boolean }>();

 (profilesResult.data ?? []).forEach((p: any) => {
   if (p.id) {
     memberMap.set(p.id, {
       id: p.id,
       full_name: p.full_name || 'Team Member',
       email: p.email ?? null,
       job_title: p.job_title ?? null,
       is_active: p.is_active ?? true,
     });
   }
 });

 (membersResult.data ?? []).forEach((e: any) => {
   const key = e.profile_id || e.id;
   if (key && !memberMap.has(key)) {
     memberMap.set(key, {
       id: key,
       full_name: e.full_name || 'Team Member',
       email: e.email ?? null,
       job_title: e.job_title ?? null,
       is_active: e.is_active ?? true,
     });
   }
 });

 return { ...teamResult.data, members: Array.from(memberMap.values()) } as MyTeamData;
}
