import {useProjectManagement} from "../../hooks/useProjectManagement";
import {supabase} from "../../lib/supabase";
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProjectWorkspace from '../../components/projects/ProjectWorkspace';
import ProjectForm from '../../components/projects/ProjectForm';
import { getClients } from '../../services/clients/clients.service';
import { getEmployees } from '../../services/employees/employees.service';
import { createProject, updateProject, setProjectStatus } from '../../services/projects/projects.service';
import { projectStatuses } from '../../lib/projectMetrics';
import type { Client } from '../../types/client';
import type { EmployeeWithTeam } from '../../types/employee';
import type { ManagedProject } from '../../types/projectAccess';
import type { CreateProjectInput, UpdateProjectInput } from '../../types/project';

export default function Projects() {
  const { profile } = useAuth();
  const [editing, setEditing] = useState<ManagedProject | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithTeam[]>([]);
  const [revision, setRevision] = useState(0);
  const [schemaReady,setSchemaReady]=useState(false);
  const manager = useProjectManagement();
  async function openForm(project: ManagedProject | null) {
    setBusy(true); setError('');
    try {
      const results = await Promise.allSettled([getClients(), getEmployees(), supabase.rpc("project_people")]);
      if (results[0].status === 'rejected') throw results[0].reason;
      if (results[1].status === 'rejected') throw results[1].reason;
      if(results[2].status==='rejected')throw results[2].reason;
      if(results[2].value.error)throw new Error(results[2].value.error.message);
      const coordinators=(results[2].value.data ?? []) as {id:string;role:string;is_active:boolean;team_id:string|null}[];
      setClients(results[0].value); setEmployees(results[1].value.filter(e=>coordinators.some(u=>u.id===e.profile_id && u.role==='project_coordinator' && u.is_active && (profile?.role==='admin'||u.team_id===profile?.team_id))));
      setEditing(project); setOpen(true);
    } catch(e) { setError(e instanceof Error ? e.message : 'Unable to load project form'); }
    finally { setBusy(false); }
  }
  async function save(input: CreateProjectInput | UpdateProjectInput) {
    setBusy(true); setError('');
    try {
      if (editing) await updateProject(editing.id,input);
      else await createProject(input as CreateProjectInput);
      setOpen(false); setRevision(r=>r+1);
    } catch(e) { setError(e instanceof Error ? e.message : 'Unable to save project'); throw e; }
    finally { setBusy(false); }
  }
  async function archive() {
    if (!editing) return;
    setBusy(true);setError('');
    try { await setProjectStatus(editing.id,!editing.is_active);setOpen(false);setRevision(r=>r+1); }
    catch(e) { setError(e instanceof Error ? e.message : 'Unable to archive project'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <div className="flex justify-between gap-4"><div><h1 className="text-2xl font-semibold">Projects</h1><p className="text-sm text-slate-500">Assignments, progress, and team visibility.</p></div>
      {manager && schemaReady && <button disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50" onClick={()=>void openForm(null)}>New project</button>}</div>
    {error && !open && <p role="alert" className="text-red-700">{error}</p>}
    <ProjectWorkspace revision={revision} onSchemaReady={setSchemaReady} onEdit={p=>void openForm(p)} />
    {open && <><ProjectForm open={open} project={editing} clients={clients} employees={employees}
      statusOptions={[...new Set([...projectStatuses,...(editing ? [editing.status]:[])])]}
      healthOptions={[...new Set(['on_track',...(editing ? [editing.health]:[])])]}
      invoiceStatusOptions={[...new Set(['pending_billing',...(editing ? [editing.invoice_status]:[])])]}
      loading={busy} error={error} onClose={()=>{if(!busy)setOpen(false);}} onSubmit={save} />
      {manager && editing && <button disabled={busy} className="fixed bottom-4 left-4 z-[60] rounded-lg border bg-white px-3 py-2 text-sm shadow-lg" onClick={()=>void archive()}>{editing.is_active ? 'Archive project' : 'Restore project'}</button>}</>}
  </div>;
}
