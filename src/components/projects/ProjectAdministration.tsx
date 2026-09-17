import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ProjectPerson } from '../../types/projectAccess';
import type { UserRole } from '../../types/auth';

const control = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const roles: UserRole[] = ['admin','director','team_lead','associate_lead','project_coordinator','employee'];
export default function ProjectAdministration({people, projectId, onSaved}: {
  people: ProjectPerson[]; projectId?: string; onSaved:()=>Promise<void>;
}) {
  const [teams,setTeams] = useState<{id:string;name:string}[]>([]);
  const [account,setAccount] = useState('');
  const [role,setRole] = useState<UserRole>('project_coordinator');
  const [team,setTeam] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [success,setSuccess] = useState('');
  useEffect(()=>{
    let active=true;
    void supabase.from('teams').select('id,name').order('name').then(({data,error})=>{
      if(!active)return;
      if(error)setError(error.message);else setTeams(data ?? []);
    });return()=>{active=false;};
  },[]);
  async function save() {
    setBusy(true);setError('');setSuccess('');
    try {
      if(projectId) {
        const {error}=await supabase.rpc('set_project_team',{p_project_id:projectId,p_team_id:team});
        if(error)throw error;
      } else {
        const {data,error}=await supabase.from('profiles').update({role,team_id:team}).eq('id',account).select('id');
        if(error)throw error;
        if(data.length!==1)throw new Error('Account update was not authorized.');
      }
      await onSaved();setSuccess('Access mapping saved.');
    } catch(e) {setError(e instanceof Error ? e.message : 'Unable to update access mapping');}
    finally{setBusy(false);}
  }
  if(!projectId)return <a href="/settings#access-management" className="project-button px-4 py-3">Administrator: account roles & teams → Access Management</a>;
  return <details className="rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-semibold">{projectId ? 'Map project team' : 'Administrator: account roles & teams'}</summary>
    <p className="my-3 text-xs text-slate-500">{projectId ? 'Changing the team changes Lead and Associate Lead visibility. Explicit assignments and shares remain.' : 'Select the verified account. Muskan: Associate Lead; Kamalesh: Team Lead; Lavanya and Esther: Project Coordinator; Veena Mam and Sabari Sir: Director. Accounts are identified by ID.'}</p>
    <div className="flex flex-wrap gap-3">{!projectId && <><label className="grid gap-1 text-xs">Account<select className={control} value={account} onChange={e=>{setAccount(e.target.value);const p=people.find(u=>u.id===e.target.value);if(p){setRole(p.role);setTeam(p.team_id ?? '');}}}><option value="">Select verified account</option>{people.map(p=><option key={p.id} value={p.id}>{p.full_name ?? 'Unnamed'} · {p.id}</option>)}</select></label>
      <label className="grid gap-1 text-xs">Role<select className={control} value={role} onChange={e=>setRole(e.target.value as UserRole)}>{roles.map(r=><option key={r} value={r}>{r.replaceAll('_',' ')}</option>)}</select></label></>}
      <label className="grid gap-1 text-xs">Team<select className={control} value={team} onChange={e=>setTeam(e.target.value)}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <button className={control} disabled={busy || !team || (!projectId && !account)} onClick={()=>void save()}>{busy?'Saving…':'Save mapping'}</button></div>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}{success && <p role="status" className="mt-2 text-sm text-green-700">{success}</p>}
  </details>;
}
