import {loadProjectWorkspace} from '../../services/projects/projectAccess.service';
import ProjectArtistWork from '../../components/projects/ProjectArtistWork';
import {useNavigate} from 'react-router-dom';
import ProjectFinanceDashboard from '../sales/ProjectFinanceDashboard';
import {useProjectFinanceAccess} from '../../hooks/useProjectFinanceAccess';
import {useProjectManagement} from "../../hooks/useProjectManagement";
import {supabase} from "../../lib/supabase";
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProjectWorkspace from '../../components/projects/ProjectWorkspace';
import ProjectForm from '../../components/projects/ProjectForm';
import { getClients } from '../../services/clients/clients.service';

import { createProject, updateProject, setProjectStatus } from '../../services/projects/projects.service';
import { projectStatuses } from '../../lib/projectMetrics';
import type { Client } from '../../types/client';
import type { EmployeeWithTeam } from '../../types/employee';
import type { ManagedProject } from '../../types/projectAccess';
import type { CreateProjectInput, UpdateProjectInput } from '../../types/project';

export default function Projects() {
  const {profile}=useAuth();
  const navigate=useNavigate();
  const [deleting,setDeleting]=useState<ManagedProject|null>(null);
  const [editing, setEditing] = useState<ManagedProject | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [teams,setTeams]=useState<{id:string;name:string}[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithTeam[]>([]);
  const [revision, setRevision] = useState(0);
  const [schemaReady,setSchemaReady]=useState(false);
  const manager = useProjectManagement();
  const financeAccess = useProjectFinanceAccess();
  const [tab,setTab]=useState<'projects'|'costs'>('projects');
  async function openForm(project: ManagedProject | null) {
    setBusy(true); setError('');
    try {
      const results = await Promise.allSettled([getClients(), supabase.rpc("project_coordinator_options"),supabase.from('teams').select('id,name').eq('is_active',true).order('name')]);
      if (results[0].status === 'rejected') throw results[0].reason;
      if(results[1].status==='rejected')throw results[1].reason;
      if(results[1].value.error)throw new Error('Unable to load project coordinators: '+results[1].value.error.message);
      if(results[2].status==='rejected')throw results[2].reason;
      if(results[2].value.error)throw new Error(results[2].value.error.message);
      const filteredCoords=(results[1].value.data??[]).map((p:{id:string;profile_id:string;full_name:string;employee_code:string;team_id:string})=>({...p,is_active:true})) as EmployeeWithTeam[];
      setTeams(results[2].value.data??[]);
      setClients(results[0].value);
      setEmployees(filteredCoords);
      setEditing(project); setOpen(true);
    } catch(e) { setError(e instanceof Error ? e.message : 'Unable to load project form'); }
    finally { setBusy(false); }
  }
  async function save(input: CreateProjectInput | UpdateProjectInput) {
    setBusy(true); setError('');
    try {
      if (editing) await updateProject(editing.id,input);
      else {
        const payload=input as CreateProjectInput;
        if(profile?.role==='project_coordinator')payload.lead_employee_id=employees.find(e=>e.profile_id===profile.id)?.id??null;
        await createProject(payload);
      }
      setOpen(false); setRevision(r=>r+1);
    } catch(e) { setError(e instanceof Error ? e.message : 'Unable to save project'); throw e; }
    finally { setBusy(false); }
  }
  async function removeProject(){
    if(!deleting)return;setBusy(true);setError('');
    try{await setProjectStatus(deleting.id,!deleting.is_active);setDeleting(null);setRevision(r=>r+1);}
    catch(e){setError(e instanceof Error?e.message:'Unable to delete project');}finally{setBusy(false);}
  }
  return <div className="space-y-6">
    {deleting&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><section role="dialog" aria-modal="true" aria-labelledby="delete-project-title" className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4"><h2 id="delete-project-title" className="text-xl font-semibold">{deleting.is_active?'Delete project?':'Restore project?'}</h2><p>{deleting.name}</p><p className="text-sm text-slate-500">Delete removes the project from active work. Tasks, time records and activity history are kept. You can restore the project from this list.</p>{error&&<p role="alert">{error}</p>}<div className="flex gap-3"><button disabled={busy} onClick={()=>setDeleting(null)}>Cancel</button><button className="rounded-xl bg-red-600 text-white px-4 py-2" disabled={busy} onClick={()=>void removeProject()}>{deleting.is_active?'Confirm delete':'Restore project'}</button></div></section></div>}

    <div className="flex justify-between gap-4"><div><h1 className="text-2xl font-semibold">Projects</h1><p className="text-sm text-slate-500">Assignments, progress, and team visibility.</p></div>
      {manager && schemaReady && <button disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50" onClick={()=>void openForm(null)}>{tab==='costs'?'New monthly project':'New project'}</button>}</div>
    {error && !open && <p role="alert" className="text-red-700">{error}</p>}
    <nav aria-label="Project sections" className="flex gap-2"><button className={`rounded-xl border px-4 py-2 text-sm font-semibold ${tab==='projects'?'bg-[#ffcc00] text-black':'bg-white text-black'}`} aria-pressed={tab==='projects'} onClick={()=>setTab('projects')}>Projects</button>{financeAccess&&<button className={`rounded-xl border px-4 py-2 text-sm font-semibold ${tab==='costs'?'bg-[#ffcc00] text-black':'bg-white text-black'}`} aria-pressed={tab==='costs'} onClick={()=>setTab('costs')}>SMP &amp; EXP Projects</button>}</nav>
    {tab==='projects'&&<ProjectArtistWork/>}
    {tab==='projects'?<ProjectWorkspace revision={revision} onSchemaReady={setSchemaReady} onDelete={manager?setDeleting:undefined} onEdit={p=>void openForm(p)} />:financeAccess&&<ProjectFinanceDashboard key={revision} mode="costs" onProjectDetails={async id=>{setBusy(true);try{const result=await loadProjectWorkspace(profile?.role==='admin');const selected=result.projects.find(p=>p.id===id);if(!selected)throw new Error('Project unavailable');await openForm(selected);}catch(e){setError(e instanceof Error?e.message:'Unable to open project');}finally{setBusy(false);}}}/>}
    {open && <><ProjectForm open={open} monthlyTeamProject={tab==='costs'&&!editing} project={editing} clients={clients} teams={teams} employees={employees} selfCoordinator={profile?.role==='project_coordinator'}
      statusOptions={editing&&['client_review','client_correction'].includes(editing.status)?['client_review','client_correction','completed']:[...new Set([...projectStatuses.filter(s=>s!=='awaiting_coordinator'),...(editing ? [editing.status]:[])])]}
      healthOptions={[...new Set(['on_track',...(editing ? [editing.health]:[])])]}
      invoiceStatusOptions={[...new Set(['pending_billing',...(editing ? [editing.invoice_status]:[])])]}
      onManageAssignments={editing ? ()=>{setOpen(false);navigate('/projects?project='+editing.id);} : undefined}
      onDelete={manager&&editing?()=>{setOpen(false);setDeleting(editing);}:undefined}
      loading={busy} error={error} onClose={()=>{if(!busy)setOpen(false);}} onSubmit={save} />
      </>}
  </div>;
}
