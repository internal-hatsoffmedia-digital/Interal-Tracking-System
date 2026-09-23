import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ProjectPerson } from '../../types/projectAccess';
import type { UserRole } from '../../types/auth';
import { Users, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const control = 'h-10 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition';
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
      await onSaved();setSuccess('Access mapping saved successfully.');
    } catch(e) {setError(e instanceof Error ? e.message : 'Unable to update access mapping');}
    finally{setBusy(false);}
  }

  if(!projectId) return (
    <a href="/settings#access-management" className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition">
      <Users size={14} className="text-violet-400" />
      <span>Administrator: account roles & teams → Access Management</span>
    </a>
  );

  return (
    <details className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all">
      <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm text-slate-200 hover:text-white select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Users size={16} />
          </div>
          <span>{projectId ? 'Map Project Team' : 'Administrator: Account Roles & Teams'}</span>
        </div>
        <span className="text-xs font-medium text-slate-400 group-open:rotate-180 transition-transform duration-200">▼</span>
      </summary>

      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
        <p className="text-xs text-slate-400 leading-relaxed">
          {projectId
            ? 'Changing the mapped team updates visibility for Lead and Associate Lead roles. Explicit assignments and shares remain intact.'
            : 'Select verified accounts to set their team and permissions.'}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          {!projectId && (
            <>
              <label className="grid gap-1 text-xs font-medium text-slate-400">
                Account
                <select className={control} value={account} onChange={e=>{setAccount(e.target.value);const p=people.find(u=>u.id===e.target.value);if(p){setRole(p.role);setTeam(p.team_id ?? '');}}}>
                  <option value="">Select verified account</option>
                  {people.map(p=><option key={p.id} value={p.id}>{p.full_name ?? 'Unnamed'} · {p.id}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-400">
                Role
                <select className={control} value={role} onChange={e=>setRole(e.target.value as UserRole)}>
                  {roles.map(r=><option key={r} value={r}>{r.replaceAll('_',' ')}</option>)}
                </select>
              </label>
            </>
          )}
          <label className="grid gap-1 text-xs font-medium text-slate-400 flex-1 min-w-[200px]">
            Team
            <select className={control} value={team} onChange={e=>setTeam(e.target.value)}>
              <option value="">Select team</option>
              {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            disabled={busy || !team || (!projectId && !account)}
            onClick={()=>void save()}
          >
            <Save size={14} />
            <span>{busy ? 'Saving…' : 'Save mapping'}</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-300">
            <AlertCircle size={14} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-300">
            <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}
      </div>
    </details>
  );
}
