import {useProjectManagement} from "../../hooks/useProjectManagement";
import WorkspaceDialog from "../layouts/WorkspaceDialog";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadProjectActivity, loadProjectWorkspace, saveProjectAccess } from '../../services/projects/projectAccess.service';
import { csvCell, isCompleted, isOngoing, isOverdue, missingFields, projectStatuses, summarizeProjects } from '../../lib/projectMetrics';
import type { ManagedProject, ProjectActivity, ProjectPerson } from '../../types/projectAccess';
import ProjectAdministration from './ProjectAdministration';

const input = 'project-input rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const button = 'project-button rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50';
const label = (value: string) => value.replaceAll('_', ' ');

export default function ProjectWorkspace({ mode = 'projects', onEdit, revision = 0, onSchemaReady }: {
  mode?: 'projects' | 'dashboard' | 'reports'; onEdit?: (p: ManagedProject) => void; revision?: number; onSchemaReady?: (ready:boolean)=>void;
}) {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [people, setPeople] = useState<ProjectPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schemaReady, setSchemaReady] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [member, setMember] = useState('');
  const [assigner, setAssigner] = useState('');
  const [deadline, setDeadline] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [incomplete, setIncomplete] = useState(false);
  const [associateOnly, setAssociateOnly] = useState(false);
  const [selection, setSelection] = useState<{ url: string; id: string | null } | null>(null);
  const url = params.toString();
  const selected = selection?.url === url ? selection.id : params.get('project');
  const setSelected = (id: string | null) => setSelection({ url, id });
  const requests = useRef(0);
  const load = useCallback(async (quiet = false) => {
    const request = ++requests.current;
    if (!quiet) setLoading(true);
    setError('');
    try { const data = await loadProjectWorkspace(profile?.role==='admin'); if(request === requests.current) { setProjects(data.projects); setPeople(data.people); setSchemaReady(data.schemaReady); onSchemaReady?.(data.schemaReady); } }
    catch (e) { if(request === requests.current) { setProjects([]); setPeople([]); setError(e instanceof Error ? e.message : 'Unable to load projects'); } }
    finally { if(request === requests.current)setLoading(false); }
  }, [profile,onSchemaReady]);
  useEffect(() => {
    // Schedule the fetch with cleanup so StrictMode/unmount cannot publish stale responses.
    const counter = requests;
    const timer = window.setTimeout(() => void load(), 0);
    return () => { window.clearTimeout(timer); counter.current++; };
  }, [load, revision, profile?.id]);
  // Refresh after access changes in another session; clear stale data immediately on failures.
  useEffect(() => {
    const refresh = () => { void load(true); };
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [load]);
  const name = (id: string | null) => id ? people.find(p => p.id === id)?.full_name || 'Account unavailable' : 'Not recorded';
  const matchesFilters = (p: ManagedProject) =>
    (!search || `${p.name} ${p.client?.name ?? ''}`.toLowerCase().includes(search.toLowerCase())) &&
    (!status || p.status === status) && (!member || p.project_members.some(m => m.access_kind === 'assignee' && m.profile_id === member)) &&
    (!assigner || p.assigned_by === assigner) && (!deadline || (p.target_deadline && p.target_deadline <= deadline)) &&
    (!from || p.created_at.slice(0, 10) >= from) && (!to || p.created_at.slice(0, 10) <= to) &&
    (!incomplete || missingFields(p).length > 0) && (!associateOnly || p.associate_assigned);
  const visible = projects.filter(matchesFilters);
  const stats = summarizeProjects(visible);
  const project = projects.find(p => p.id === selected);
  const projectManager = useProjectManagement();
  const canEdit = (p:ManagedProject) => profile?.role==='admin' || profile?.role==='project_coordinator' || (projectManager && p.team_id===profile?.team_id);
  async function exportCsv() {
    // Re-fetch before export so revoked access cannot survive in a cached report.
    try {
      const fresh = await loadProjectWorkspace();
      const rows = fresh.projects.filter(matchesFilters);
      const freshName = (id: string | null) => fresh.people.find(p=>p.id===id)?.full_name ?? (id ? 'Account unavailable':'Not recorded');
      const text = [['Project','Client','Status','Assignees','Assigned by','Deadline','Missing information'], ...rows.map(p =>
        [p.name,p.client?.name ?? (p.client_id ? 'Client unavailable' : 'Missing client'),p.status,
          p.project_members.filter(m => m.access_kind === 'assignee').map(m => freshName(m.profile_id)).join('; '),
          freshName(p.assigned_by),p.target_deadline,missingFields(p).join('; ')])].map(r => r.map(csvCell).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'project-report.csv'; a.click(); URL.revokeObjectURL(url);
    } catch (e) { setError(e instanceof Error ? e.message : 'Export failed'); }
  }
  if (!error && !schemaReady) return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5" aria-label="Existing projects">
    <div className="flex justify-between gap-3"><h2 className="text-xl font-semibold">Existing projects</h2><button className={button} onClick={()=>void load()}>Refresh</button></div>
    <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Administrator view using the current database. Assignment history and sharing controls will be enabled after the project-access update is verified and applied. Existing database permissions still apply.</p>
    {loading ? <p>Loading projects…</p> : <><p className="text-sm text-slate-500">{projects.length} projects</p><div className="project-table-wrap overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Project','Client','Recorded lead','Status','Progress','Deadline'].map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{projects.map(p=><tr key={p.id} className="border-t"><td className="p-3 font-medium">{p.name}</td><td className="p-3">{p.client?.name ?? 'Client unavailable'}</td><td className="p-3">{p.lead_employee?.full_name ?? 'Not recorded'}</td><td className="p-3">{label(p.status)}</td><td className="p-3">{p.completed_assets} / {p.total_assets_required}</td><td className="p-3">{p.target_deadline ?? 'Not set'}</td></tr>)}</tbody></table></div></>}
  </section>;
  if (error) {
    const setupPending = /project_members|project_people|schema cache/i.test(error);
    return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-label="Project visibility and reporting">
      <h2 className="text-xl font-semibold text-slate-900">{setupPending ? 'Project access setup is incomplete' : 'Project overview is unavailable'}</h2>
      <p role="alert" className="text-sm text-slate-600">{setupPending
        ? 'The database does not yet expose the required project access structure. Project counts and reports are unavailable until setup is completed.'
        : 'Project information could not be loaded. No project totals can be shown right now.'}</p>
      {setupPending && profile?.role === 'admin' && <p className="text-sm text-slate-600">Review the Supabase preflight results, then apply the roles/statuses migration and the project-access migration in that order. If they have already been applied, check the project membership foreign key and refresh the API schema cache.</p>}
      <details className="text-xs text-slate-500"><summary className="cursor-pointer">Technical details</summary><p className="mt-2 break-words">{error}</p></details>
      <button className={button} disabled={loading} onClick={() => void load()}>{loading ? 'Checking…' : 'Retry'}</button>
    </section>;
  }
  return <section className="project-workspace space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-label="Project visibility and reporting">
    <div className="flex flex-wrap items-center justify-between gap-3"><div>
      <h2 className="text-xl font-semibold text-slate-900">{mode === 'reports' ? 'Project distribution & completion' : 'Project overview'}</h2>
      <p className="mt-1 text-sm text-slate-500">Projects available to your account · {label(profile?.role ?? '')}</p>
    </div><div className="flex gap-2"><button className={button} disabled={loading} onClick={() => void load()}>Refresh</button>
      <button className={button} disabled={loading || !!error} onClick={() => void exportCsv()}>Export CSV</button></div></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
    {mode === 'projects' && profile?.role === 'admin' && !loading && !error && <ProjectAdministration people={people} onSaved={load} />}
    <div className="project-stats grid grid-cols-2 gap-3 lg:grid-cols-6">{Object.entries({ Total: stats.total, Ongoing: stats.ongoing, Completed: stats.completed,
      'On hold': stats.onHold, Overdue: stats.overdue, Incomplete: stats.incomplete }).map(([key, value]) =>
      <div key={key} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{key}</p><p className="text-2xl font-semibold">{loading ? '…' : value}</p></div>)}</div>
    <div className="project-filters">
      <label className="grid gap-1 text-xs">Search<input className={input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Project or client" /></label>
      <label className="grid gap-1 text-xs">Status<select className={input} value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{[...new Set([...projectStatuses,...projects.map(p=>p.status)])].map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>
      <label className="grid gap-1 text-xs">Team member / assignee<select className={input} value={member} onChange={e => setMember(e.target.value)}><option value="">All assignees</option>{people.filter(u => projects.some(p => p.project_members.some(m => m.profile_id === u.id && m.access_kind === 'assignee'))).map(u => <option key={u.id} value={u.id}>{u.full_name ?? u.id}</option>)}</select></label>
      <label className="grid gap-1 text-xs">Assigned by<select className={input} value={assigner} onChange={e => setAssigner(e.target.value)}><option value="">All assigners</option>{people.filter(u => projects.some(p => p.assigned_by === u.id)).map(u => <option key={u.id} value={u.id}>{u.full_name ?? u.id}</option>)}</select></label>
      <label className="grid gap-1 text-xs">Deadline through<input type="date" className={input} value={deadline} onChange={e => setDeadline(e.target.value)} /></label>
      <label className="grid gap-1 text-xs">Created from<input type="date" className={input} value={from} onChange={e => setFrom(e.target.value)} /></label>
      <label className="grid gap-1 text-xs">Created through<input type="date" className={input} value={to} min={from} onChange={e => setTo(e.target.value)} /></label>
    </div>
    <div className="flex flex-wrap gap-5 text-sm"><label><input type="checkbox" checked={incomplete} onChange={e => setIncomplete(e.target.checked)} /> Incomplete information</label>
      <label><input type="checkbox" checked={associateOnly} onChange={e => setAssociateOnly(e.target.checked)} /> Assigned by Associate Lead</label>
      <button className="underline" onClick={() => { setSearch('');setStatus('');setMember('');setAssigner('');setDeadline('');setFrom('');setTo('');setIncomplete(false);setAssociateOnly(false); }}>Clear filters</button></div>
    {loading ? <p role="status">Loading projects…</p> : !error && <>
      {visible.length === 0 ? <p className="py-6 text-slate-500">No accessible projects match these filters.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr>{['Project / client','Assignments','Status / progress','Deadline','Information','Actions'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>
        {visible.map(p => <tr key={p.id} className="border-b border-slate-100 align-top"><td className="p-3"><button className="text-left font-semibold underline decoration-slate-300" onClick={() => setSelected(p.id)}>{p.name}</button><p className="text-xs text-slate-500">{p.client?.name ?? (p.client_id ? 'Client unavailable' : 'Missing client')}</p><p className="mt-1 text-xs text-slate-400">Updated {new Date(p.updated_at).toLocaleDateString()}</p></td>
          <td className="p-3">{p.project_members.filter(m => m.access_kind === 'assignee').map(m => name(m.profile_id)).join(', ') || 'Unassigned'}<p className="text-xs text-slate-500">By {name(p.assigned_by)}</p></td>
          <td className="p-3 capitalize"><span className="project-status" data-status={p.status}>{label(p.status)}</span><p className="text-xs">{p.completed_assets} / {p.total_assets_required} assets{!p.is_active && ' · Archived'}</p></td>
          <td className={`p-3 ${isOverdue(p) ? 'text-red-600' : ''}`}>{p.target_deadline ?? 'Not set'}{isOverdue(p) && <p className="text-xs">Overdue</p>}</td>
          <td className="max-w-48 p-3 text-xs text-amber-700">{missingFields(p).join(', ') || 'Complete'}</td>
          <td className="p-3">{onEdit && canEdit(p) ? <button className={button} onClick={() => onEdit(p)}>Edit details</button> : <Link className="underline" to={`/projects?project=${p.id}`}>Details</Link>}</td></tr>)}
      </tbody></table></div>}
      {mode === 'reports' && <div className="space-y-3"><p className="text-sm text-slate-600">Completion rate: <strong>{stats.completionRate}%</strong>. Completed projects ÷ all filtered projects. Date filters use project creation dates (UTC). Active workload includes uncompleted, active projects, including on-hold projects. Each project counts once in totals and once per assignee in workload.</p>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Team member</th><th>Total assigned</th><th>Active workload</th><th>Completed</th><th>Completion rate</th></tr></thead><tbody>{people.map(u => {
          const assigned = visible.filter(p => p.project_members.some(m => m.access_kind === 'assignee' && m.profile_id === u.id));
          return assigned.length ? <tr key={u.id} className="border-t"><td className="p-2">{u.full_name ?? u.id}</td><td>{assigned.length}</td><td>{assigned.filter(isOngoing).length}</td><td>{assigned.filter(isCompleted).length}</td><td>{summarizeProjects(assigned).completionRate}%</td></tr> : null;
        })}</tbody></table></div></div>}
    </>}
    {selected && !loading && !error && (project ? <ProjectDetail key={project.id + project.updated_at} project={project} people={people} onClose={() => setSelected(null)} onSaved={load} onEdit={onEdit && canEdit(project) ? () => {setSelected(null);onEdit(project);} : undefined} /> : <p role="alert">This project is unavailable or you no longer have access.</p>)}
  </section>;
}

function ProjectDetail({ project, people, onClose, onSaved, onEdit }: { project: ManagedProject; people: ProjectPerson[]; onClose: () => void; onSaved: () => Promise<void>; onEdit?: () => void }) {
  const { profile } = useAuth();
  const [assignees, setAssignees] = useState(project.project_members.filter(m=>m.access_kind==='assignee').map(m=>m.profile_id));
  const [shared, setShared] = useState(project.project_members.filter(m=>m.access_kind==='shared').map(m=>m.profile_id));
  const [activity, setActivity] = useState<ProjectActivity[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const projectManager=useProjectManagement();
  const manager = profile?.role === 'admin' || (projectManager && !!profile?.team_id && profile.team_id === project.team_id);
  const fullDetail=manager||['director','team_lead','project_coordinator'].includes(profile?.role ?? '');
  const name = (id: string | null) => people.find(p=>p.id===id)?.full_name ?? (id ? 'Account unavailable' : 'Not recorded');
  useEffect(() => {
    let active = true;
    if(!fullDetail)return;
    loadProjectActivity(project.id).then(a=>{if(active)setActivity(a);}).catch(e=>{if(active)setError(String(e.message));}).finally(()=>{if(active)setHistoryLoading(false);});
    return ()=>{active=false;};
  }, [project.id,fullDetail]);
  async function save() {
    setSaving(true); setError('');
    try { await saveProjectAccess(project.id,assignees,shared); await onSaved(); onClose(); }
    catch(e) { setError(e instanceof Error ? e.message : 'Unable to save assignments'); }
    finally { setSaving(false); }
  }
  return <WorkspaceDialog titleId="project-detail-title" onClose={()=>{if(!saving)onClose();}}>
    <div className="workspace-dialog-header"><h2 id="project-detail-title" className="text-xl font-semibold">{project.name}</h2><button autoFocus className={button} disabled={saving} onClick={onClose}>Close</button></div><div className="workspace-dialog-body space-y-5">
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <p className="whitespace-pre-wrap text-sm">{project.description || 'No description recorded.'}</p>
    <dl className="grid grid-cols-2 gap-3 text-sm">{Object.entries({ Creator:name(project.created_by), Assigner:name(project.assigned_by), Assigned:project.assigned_at ? new Date(project.assigned_at).toLocaleString():'Not recorded', Start:project.start_date ?? 'Not set', Deadline:project.target_deadline ?? 'Not set', Status:label(project.status) }).map(([k,v])=><div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd>{v}</dd></div>)}</dl>
    {onEdit && <button className={button} onClick={onEdit}>Edit project details</button>}
    {!fullDetail && <p className="project-setup-hint">This is project context for your assigned work. Open Tasks or Planner to see your team’s authorized tasks. Coordinator assignments and other teams’ history are not included.</p>}
    {fullDetail && <>
    {profile?.role === 'admin' && <ProjectAdministration people={people} projectId={project.id} onSaved={onSaved} />}
    <h3 className="font-semibold">Assignments & shared access</h3>
    <p className="text-xs text-slate-500">Assign projects to Project Coordinators. Share with another coordinator when needed. The Associate Lead oversees the mapped coordinator team; Lead and Director visibility follows their roles.</p>
    {manager && !people.some(u=>u.is_active && u.role==='project_coordinator' && !!project.team_id && u.team_id===project.team_id) && <p className="project-setup-hint">No active Project Coordinators are mapped to this project’s team. An administrator must map the coordinator accounts and Muskan to the coordinator team, then map this project to that team. Employee accounts cannot be project assignees.</p>}
    {manager ? <><div className="flex items-center justify-between"><h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Manage Access & Members</h4>{(assignees.length > 0 || shared.length > 0) && <button type="button" className="text-xs font-medium text-red-600 hover:text-red-800" onClick={()=>{ setAssignees([]); setShared([]); }}>Revoke All Member Access</button>}</div><div className="grid gap-4 sm:grid-cols-2">{(['assignee','shared'] as const).map(kind => <fieldset key={kind} className="coordinator-picker"><legend className="px-1 text-sm font-semibold">{kind === 'assignee' ? 'Current assignees' : 'Shared with'}</legend>{people.filter(u=>(u.is_active && u.role==='project_coordinator' && !!project.team_id && u.team_id===project.team_id) || project.project_members.some(m=>m.profile_id===u.id)).map(u => {
      const values = kind==='assignee' ? assignees : shared; const set = kind==='assignee' ? setAssignees : setShared;
      const isSelected = values.includes(u.id);
      return <div key={u.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50"><label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer flex-1"><input type="checkbox" checked={isSelected} disabled={saving || ((!u.is_active || u.role!=='project_coordinator' || u.team_id!==project.team_id) && !isSelected)} onChange={e=>set(e.target.checked ? [...values,u.id] : values.filter(id=>id!==u.id))} /><span className="coordinator-avatar" aria-hidden="true">{(u.full_name ?? "?").slice(0,1)}</span><span>{u.full_name ?? u.id}<span className="block text-[11px] text-slate-400">{label(u.role)}{(!u.is_active || u.role!=='project_coordinator' || u.team_id!==project.team_id) && ' · Legacy access'}</span></span></label>{isSelected && <button type="button" title="Revoke access" className="px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded" onClick={()=>set(values.filter(id=>id!==u.id))}>Revoke</button>}</div>;
    })}</fieldset>)}</div><button className={button} disabled={saving} onClick={()=>void save()}>{saving ? 'Saving…':'Save assignments & sharing'}</button></> : <ul className="space-y-2 text-sm">{project.project_members.map(m=><li key={m.profile_id+m.access_kind}>{name(m.profile_id)} · {m.access_kind} · granted by {name(m.granted_by)} {m.granted_at ? new Date(m.granted_at).toLocaleString() : '(legacy date unknown)'}</li>)}</ul>}
    <h3 className="font-semibold">Recent history (latest 100 events)</h3>
    {historyLoading ? <p>Loading history…</p> : activity.length ? <ol className="space-y-3 text-sm">{activity.map(a=><li key={a.id} className="border-l-2 border-slate-200 pl-3"><strong>{a.action}</strong><p className="text-xs text-slate-500">{name(a.actor_id)} · {new Date(a.created_at).toLocaleString()}</p><dl className="mt-1 text-xs">{Object.entries(a.details).map(([k,v])=><div key={k}><dt className="inline font-medium">{label(k)}: </dt><dd className="inline">{Array.isArray(v) ? v.map(id=>name(String(id))).join(', ') || 'None' : String(v ?? 'Not set')}</dd></div>)}</dl></li>)}</ol> : <p className="text-sm text-slate-500">No recorded history. Legacy assignment information may be incomplete.</p>}
    </>}
  </div></WorkspaceDialog>;
}
