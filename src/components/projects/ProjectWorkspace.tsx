import { useProjectManagement } from "../../hooks/useProjectManagement";
import WorkspaceDialog from "../layouts/WorkspaceDialog";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadProjectActivity, loadProjectWorkspace, saveProjectAccess } from '../../services/projects/projectAccess.service';
import { csvCell, isCompleted, isOngoing, isOverdue, missingFields, projectStatuses, summarizeProjects } from '../../lib/projectMetrics';
import type { ManagedProject, ProjectActivity, ProjectPerson } from '../../types/projectAccess';
import ProjectAdministration from './ProjectAdministration';
import {
  FolderKanban,
  X,
  AlertTriangle,
  Edit3,
  Users,
  History,
  UserPlus,
  Trash2,
  RefreshCw,
  Download,
} from 'lucide-react';

const input = 'project-input rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition';
const button = 'project-button inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition';
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
  if (!error && !schemaReady) return <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5" aria-label="Existing projects">
    <div className="flex justify-between gap-3"><h2 className="text-xl font-semibold text-white">Existing projects</h2><button className={button} onClick={()=>void load()}><RefreshCw size={14} />Refresh</button></div>
    <p className="rounded-xl bg-amber-950/40 border border-amber-500/30 p-3.5 text-xs text-amber-200">Administrator view using the current database. Assignment history and sharing controls will be enabled after the project-access update is verified and applied. Existing database permissions still apply.</p>
    {loading ? <p className="text-slate-400">Loading projects…</p> : <><p className="text-sm text-slate-400">{projects.length} projects</p><div className="project-table-wrap overflow-x-auto border border-slate-800 rounded-xl"><table className="w-full text-left text-sm"><thead><tr>{['Project','Client','Recorded lead','Status','Progress','Deadline'].map(h=><th className="p-3 text-slate-400" key={h}>{h}</th>)}</tr></thead><tbody>{projects.map(p=><tr key={p.id} className="border-t border-slate-800"><td className="p-3 font-medium text-slate-200">{p.name}</td><td className="p-3 text-slate-300">{p.client?.name ?? 'Client unavailable'}</td><td className="p-3 text-slate-300">{p.lead_employee?.full_name ?? 'Not recorded'}</td><td className="p-3">{label(p.status)}</td><td className="p-3 text-slate-300">{p.completed_assets} / {p.total_assets_required}</td><td className="p-3 text-slate-300">{p.target_deadline ?? 'Not set'}</td></tr>)}</tbody></table></div></>}
  </section>;
  if (error) {
    const setupPending = /project_members|project_people|schema cache/i.test(error);
    return <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6" aria-label="Project visibility and reporting">
      <h2 className="text-xl font-semibold text-white">{setupPending ? 'Project access setup is incomplete' : 'Project overview is unavailable'}</h2>
      <p role="alert" className="text-sm text-slate-400">{setupPending
        ? 'The database does not yet expose the required project access structure. Project counts and reports are unavailable until setup is completed.'
        : 'Project information could not be loaded. No project totals can be shown right now.'}</p>
      {setupPending && profile?.role === 'admin' && <p className="text-sm text-slate-400">Review the Supabase preflight results, then apply the roles/statuses migration and the project-access migration in that order. If they have already been applied, check the project membership foreign key and refresh the API schema cache.</p>}
      <details className="text-xs text-slate-500"><summary className="cursor-pointer">Technical details</summary><p className="mt-2 break-words text-red-400">{error}</p></details>
      <button className={button} disabled={loading} onClick={() => void load()}>{loading ? 'Checking…' : 'Retry'}</button>
    </section>;
  }
  return <section className="project-workspace space-y-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6" aria-label="Project visibility and reporting">
    <div className="flex flex-wrap items-center justify-between gap-3"><div>
      <h2 className="text-xl font-semibold text-white">{mode === 'reports' ? 'Project distribution & completion' : 'Project overview'}</h2>
      <p className="mt-1 text-sm text-slate-400">Projects available to your account · {label(profile?.role ?? '')}</p>
    </div><div className="flex gap-2">
      <button className={button} disabled={loading} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh</button>
      <button className={button} disabled={loading || !!error} onClick={() => void exportCsv()}><Download size={14} />Export CSV</button>
    </div></div>
    {error && <p role="alert" className="rounded-xl bg-red-950/40 border border-red-500/30 p-3 text-red-300 text-xs">{error}</p>}
    {mode === 'projects' && profile?.role === 'admin' && !loading && !error && <ProjectAdministration people={people} onSaved={load} />}
    <div className="project-stats grid grid-cols-2 gap-3 lg:grid-cols-6">{Object.entries({ Total: stats.total, Ongoing: stats.ongoing, Completed: stats.completed,
      'On hold': stats.onHold, Overdue: stats.overdue, Incomplete: stats.incomplete }).map(([key, value]) =>
      <div key={key} className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5"><p className="text-xs font-medium text-slate-400">{key}</p><p className="text-2xl font-bold text-white mt-1">{loading ? '…' : value}</p></div>)}</div>
    <div className="project-filters grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
      <label className="grid gap-1 text-xs font-medium text-slate-400">Search<input className={input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Project or client" /></label>
      <label className="grid gap-1 text-xs font-medium text-slate-400">Status<select className={input} value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{[...new Set([...projectStatuses,...projects.map(p=>p.status)])].map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-medium text-slate-400">Team member / assignee<select className={input} value={member} onChange={e => setMember(e.target.value)}><option value="">All assignees</option>{people.filter(u => projects.some(p => p.project_members.some(m => m.profile_id === u.id && m.access_kind === 'assignee'))).map(u => <option key={u.id} value={u.id}>{u.full_name ?? u.id}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-medium text-slate-400">Assigned by<select className={input} value={assigner} onChange={e => setAssigner(e.target.value)}><option value="">All assigners</option>{people.filter(u => projects.some(p => p.assigned_by === u.id)).map(u => <option key={u.id} value={u.id}>{u.full_name ?? u.id}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-medium text-slate-400">Deadline through<input type="date" className={input} value={deadline} onChange={e => setDeadline(e.target.value)} /></label>
      <label className="grid gap-1 text-xs font-medium text-slate-400">Created from<input type="date" className={input} value={from} onChange={e => setFrom(e.target.value)} /></label>
      <label className="grid gap-1 text-xs font-medium text-slate-400">Created through<input type="date" className={input} value={to} min={from} onChange={e => setTo(e.target.value)} /></label>
    </div>
    <div className="flex flex-wrap items-center gap-5 text-xs text-slate-300">
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded border-slate-700 accent-violet-600" checked={incomplete} onChange={e => setIncomplete(e.target.checked)} /> Incomplete information</label>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded border-slate-700 accent-violet-600" checked={associateOnly} onChange={e => setAssociateOnly(e.target.checked)} /> Assigned by Associate Lead</label>
      <button className="text-violet-400 hover:text-violet-300 underline font-medium" onClick={() => { setSearch('');setStatus('');setMember('');setAssigner('');setDeadline('');setFrom('');setTo('');setIncomplete(false);setAssociateOnly(false); }}>Clear filters</button>
    </div>
    {loading ? <p role="status" className="text-slate-400 text-sm">Loading projects…</p> : !error && <>
      {visible.length === 0 ? <p className="py-6 text-slate-500 text-sm">No accessible projects match these filters.</p> : <div className="overflow-x-auto border border-slate-800 rounded-xl"><table className="w-full text-left text-sm"><thead className="border-b border-slate-800 bg-slate-950/60 text-xs text-slate-400 font-semibold uppercase tracking-wider"><tr>{['Project / client','Assignments','Status / progress','Deadline','Information','Actions'].map(h=><th key={h} className="p-3.5">{h}</th>)}</tr></thead><tbody>
        {visible.map(p => <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition align-top"><td className="p-3.5"><button className="text-left font-semibold text-slate-100 hover:text-violet-400 transition" onClick={() => setSelected(p.id)}>{p.name}</button><p className="text-xs text-slate-400">{p.client?.name ?? (p.client_id ? 'Client unavailable' : 'Missing client')}</p><p className="mt-1 text-[11px] text-slate-500">Updated {new Date(p.updated_at).toLocaleDateString()}</p></td>
          <td className="p-3.5 text-slate-300">{p.project_members.filter(m => m.access_kind === 'assignee').map(m => name(m.profile_id)).join(', ') || 'Unassigned'}<p className="text-xs text-slate-500">By {name(p.assigned_by)}</p></td>
          <td className="p-3.5 capitalize"><span className="project-status text-xs font-semibold px-2.5 py-0.5 rounded-md" data-status={p.status}>{label(p.status)}</span><p className="text-xs text-slate-400 mt-1">{p.completed_assets} / {p.total_assets_required} assets{!p.is_active && ' · Archived'}</p></td>
          <td className={`p-3.5 ${isOverdue(p) ? 'text-rose-400 font-semibold' : 'text-slate-300'}`}>{p.target_deadline ?? 'Not set'}{isOverdue(p) && <p className="text-xs text-rose-500 font-medium">Overdue</p>}</td>
          <td className="max-w-48 p-3.5 text-xs text-amber-400">{missingFields(p).join(', ') || <span className="text-emerald-400 font-medium">Complete</span>}</td>
          <td className="p-3.5">{onEdit && canEdit(p) ? <button className={button} onClick={() => onEdit(p)}>Edit details</button> : <Link className="text-xs font-semibold text-violet-400 hover:text-violet-300 underline" to={`/projects?project=${p.id}`}>Details</Link>}</td></tr>)}
      </tbody></table></div>}
      {mode === 'reports' && <div className="space-y-3 pt-4 border-t border-slate-800"><p className="text-xs text-slate-400">Completion rate: <strong className="text-white">{stats.completionRate}%</strong>. Completed projects ÷ all filtered projects. Date filters use project creation dates (UTC). Active workload includes uncompleted, active projects, including on-hold projects. Each project counts once in totals and once per assignee in workload.</p>
        <div className="overflow-x-auto border border-slate-800 rounded-xl"><table className="w-full text-left text-sm"><thead className="bg-slate-950/60 text-xs text-slate-400"><tr><th className="p-3">Team member</th><th>Total assigned</th><th>Active workload</th><th>Completed</th><th>Completion rate</th></tr></thead><tbody>{people.map(u => {
          const assigned = visible.filter(p => p.project_members.some(m => m.access_kind === 'assignee' && m.profile_id === u.id));
          return assigned.length ? <tr key={u.id} className="border-t border-slate-800 text-slate-300"><td className="p-3 font-medium text-slate-200">{u.full_name ?? u.id}</td><td>{assigned.length}</td><td>{assigned.filter(isOngoing).length}</td><td>{assigned.filter(isCompleted).length}</td><td>{summarizeProjects(assigned).completionRate}%</td></tr> : null;
        })}</tbody></table></div></div>}
    </>}
    {selected && !loading && !error && (project ? <ProjectDetail key={project.id + project.updated_at} project={project} people={people} onClose={() => setSelected(null)} onSaved={load} onEdit={onEdit && canEdit(project) ? () => {setSelected(null);onEdit(project);} : undefined} /> : <p role="alert" className="text-rose-400 text-sm">This project is unavailable or you no longer have access.</p>)}
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

  return (
    <WorkspaceDialog titleId="project-detail-title" onClose={()=>{if(!saving)onClose();}}>
      {/* HEADER */}
      <div className="workspace-dialog-header border-b border-slate-800 bg-slate-900/90 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <FolderKanban size={20} />
          </div>
          <div className="min-w-0">
            <h2 id="project-detail-title" className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">{project.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="project-status text-[11px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-md" data-status={project.status}>
                {label(project.status)}
              </span>
            </div>
          </div>
        </div>
        <button
          autoFocus
          disabled={saving}
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-400 hover:bg-slate-700 hover:text-white transition"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>
      </div>

      {/* BODY */}
      <div className="workspace-dialog-body space-y-5 p-6 bg-slate-900 text-slate-200">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-500/30 p-3.5 text-xs text-red-300">
            <AlertTriangle size={15} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* DESCRIPTION & METADATA GRID */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4.5 space-y-4">
          <p className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
            {project.description || <span className="text-slate-500 italic">No description recorded.</span>}
          </p>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-sm">
            {Object.entries({
              Creator: name(project.created_by),
              Assigner: name(project.assigned_by),
              Assigned: project.assigned_at ? new Date(project.assigned_at).toLocaleString() : 'Not recorded',
              Start: project.start_date ?? 'Not set',
              Deadline: project.target_deadline ?? 'Not set',
              Status: label(project.status)
            }).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-2.5">
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{k}</dt>
                <dd className="mt-1 text-xs font-medium text-slate-200 truncate">{v}</dd>
              </div>
            ))}
          </dl>
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <Edit3 size={14} className="text-violet-400" />
              <span>Edit project details</span>
            </button>
          )}
        </div>

        {!fullDetail && (
          <p className="project-setup-hint">This is project context for your assigned work. Open Tasks or Planner to see your team’s authorized tasks. Coordinator assignments and other teams’ history are not included.</p>
        )}

        {fullDetail && (
          <>
            {profile?.role === 'admin' && (
              <ProjectAdministration people={people} projectId={project.id} onSaved={onSaved} />
            )}

            {/* ASSIGNMENTS & SHARED ACCESS */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Users size={18} className="text-violet-400" />
                  <h3 className="font-bold text-base text-white">Assignments & Shared Access</h3>
                </div>
                {manager && (assignees.length > 0 || shared.length > 0) && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                    onClick={() => { setAssignees([]); setShared([]); }}
                  >
                    <Trash2 size={13} />
                    <span>Revoke All Access</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Assign projects to Project Coordinators. Share with another coordinator when needed. The Associate Lead oversees the mapped coordinator team; Lead and Director visibility follows their roles.
              </p>

              {/* WARNING HINT CARD */}
              {manager && !people.some(u=>u.is_active && u.role==='project_coordinator' && !!project.team_id && u.team_id===project.team_id) && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 text-xs text-amber-200/90 leading-relaxed shadow-inner">
                  <AlertTriangle size={18} className="shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-300 block mb-0.5">Coordinator Team Mapping Required</span>
                    <span>No active Project Coordinators are mapped to this project’s team. An administrator must map the coordinator accounts and Muskan to the coordinator team, then map this project to that team. Employee accounts cannot be project assignees.</span>
                  </div>
                </div>
              )}

              {manager ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(['assignee', 'shared'] as const).map(kind => (
                      <fieldset key={kind} className="coordinator-picker rounded-2xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-2">
                        <legend className="px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          {kind === 'assignee' ? 'Current Assignees' : 'Shared With'}
                        </legend>
                        {people.filter(u=>(u.is_active && u.role==='project_coordinator' && !!project.team_id && u.team_id===project.team_id) || project.project_members.some(m=>m.profile_id===u.id)).map(u => {
                          const values = kind==='assignee' ? assignees : shared;
                          const set = kind==='assignee' ? setAssignees : setShared;
                          const isSelected = values.includes(u.id);
                          return (
                            <div key={u.id} className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all ${isSelected ? 'border-violet-500/40 bg-violet-950/20' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'}`}>
                              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-200 cursor-pointer flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={saving || ((!u.is_active || u.role!=='project_coordinator' || u.team_id!==project.team_id) && !isSelected)}
                                  onChange={e=>set(e.target.checked ? [...values,u.id] : values.filter(id=>id!==u.id))}
                                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500 accent-violet-600"
                                />
                                <span className="coordinator-avatar flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 border border-violet-500/30 text-xs font-bold text-violet-300">
                                  {(u.full_name ?? "?").slice(0,1)}
                                </span>
                                <span className="truncate">
                                  <span className="block truncate font-semibold">{u.full_name ?? u.id}</span>
                                  <span className="block text-[10px] text-slate-400 font-normal">
                                    {label(u.role)}{(!u.is_active || u.role!=='project_coordinator' || u.team_id!==project.team_id) && ' · Legacy access'}
                                  </span>
                                </span>
                              </label>
                              {isSelected && (
                                <button
                                  type="button"
                                  title="Revoke access"
                                  className="px-2 py-1 text-[10px] font-semibold text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                                  onClick={()=>set(values.filter(id=>id!==u.id))}
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </fieldset>
                    ))}
                  </div>

                  <button
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
                    disabled={saving}
                    onClick={()=>void save()}
                  >
                    <UserPlus size={15} />
                    <span>{saving ? 'Saving assignments…' : 'Save assignments & sharing'}</span>
                  </button>
                </div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {project.project_members.map(m=>(
                    <li key={m.profile_id+m.access_kind} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300 flex items-center justify-between">
                      <span>{name(m.profile_id)}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">{m.access_kind}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* RECENT HISTORY */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <History size={18} className="text-violet-400" />
                <h3 className="font-bold text-base text-white">Recent History <span className="text-xs font-normal text-slate-400">(Latest 100 events)</span></h3>
              </div>

              {historyLoading ? (
                <p className="text-xs text-slate-400 animate-pulse">Loading activity history…</p>
              ) : activity.length ? (
                <ol className="relative border-l border-slate-800 ml-3 space-y-4 pt-1">
                  {activity.map(a => (
                    <li key={a.id} className="ml-4 space-y-1">
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-violet-500 bg-slate-950" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-200">{a.action}</span>
                        <span className="text-[10px] font-medium text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-400">By <span className="text-slate-300 font-medium">{name(a.actor_id)}</span></p>
                      {Object.keys(a.details).length > 0 && (
                        <dl className="mt-1 rounded-xl bg-slate-950/60 border border-slate-800/80 p-2.5 text-[11px] text-slate-400 space-y-1">
                          {Object.entries(a.details).map(([k,v]) => (
                            <div key={k} className="flex gap-1.5">
                              <dt className="font-medium text-slate-300">{label(k)}:</dt>
                              <dd className="text-slate-400 truncate">{Array.isArray(v) ? v.map(id=>name(String(id))).join(', ') || 'None' : String(v ?? 'Not set')}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-500 italic">No recorded history.</p>
              )}
            </div>
          </>
        )}
      </div>
    </WorkspaceDialog>
  );
}
