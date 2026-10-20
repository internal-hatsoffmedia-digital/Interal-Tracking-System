import { useEffect, useState } from 'react';
import { RefreshCw, Users, Clock, CheckCircle2, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTeamOversight, oversightRoles } from '../../services/teams/teamOversight.service';
import { monthlyTiming, indiaMonth, durationMinutes } from '../../lib/deliveryTiming';
import { formatAssignmentTime } from '../../lib/assignmentTime';
import { filterTeamAssignments } from '../../lib/teamPCView';
import './TeamPC.css';
type Data = Awaited<ReturnType<typeof getTeamOversight>>;
const label = (s: string) => s.replaceAll('_', ' ');
function Table({ heads, children, empty }: {
    heads: string[];
    children: React.ReactNode;
    empty?: boolean;
}) { return <div className="pc-table-wrap"><table><thead><tr>{heads.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{empty ? <tr><td colSpan={heads.length} className="pc-no-results">No records match these filters.</td></tr> : children}</tbody></table></div>; }
export default function TeamPC({ownTeam=false}:{ownTeam?:boolean}) {
    const { profile } = useAuth();
    const viewer = [profile?.id, profile?.team_id, profile?.role].join(':');
    const [loaded, setLoaded] = useState<{
        viewer: string;
        data: Data;
    } | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [revision, setRevision] = useState(0);
    const [coordinator, setCoordinator] = useState(''), [team, setTeam] = useState(''), [employee, setEmployee] = useState(''), [project, setProject] = useState(''), [status, setStatus] = useState(''), [kind, setKind] = useState(''), [month, setMonth] = useState(indiaMonth(new Date().toISOString())!), [tab, setTab] = useState('work');
    useEffect(() => { let cancelled = false; getTeamOversight(ownTeam).then(d => { if (!cancelled) {
        setLoaded({ viewer, data: d });
        setError('');
    } }).catch(e => { if (!cancelled)
        setError(e.message); }).finally(() => { if (!cancelled)
        setLoading(false); }); return () => { cancelled = true; }; }, [profile?.id, profile?.team_id, profile?.role, revision, viewer, ownTeam]);
    useEffect(()=>{const timer=window.setInterval(()=>{if(!document.hidden)setRevision(v=>v+1);},30000);return()=>clearInterval(timer);},[]);
    if (!oversightRoles.includes(profile?.role ?? ''))
        return <p role="alert">Team PC is available to authorized supervisors.</p>;
    const data = loaded?.viewer === viewer ? loaded.data : null;
    const person = (id: string) => data?.people.find(p => p.id === id)?.full_name || 'Name unavailable';
    const worker = (id: string) => data?.teamMembers.find(p => p.id === id);
    const teamName = (id: string) => data?.teams.find(t => t.id === id)?.name || 'No team';
    const task = (id: string) => data?.tasks.find(t => t.id === id);
    const projectName = (id: string) => data?.projects.find(p => p.id === id)?.name || 'Project unavailable';
    const selectedPC = data?.coordinators.some(p => p.id === coordinator) ? coordinator : '';
    const members = data?.teamMembers.filter(e => (!team || e.team_id === team) && (!employee || e.id === employee)) ?? [];
    const allAssignments = data ? filterTeamAssignments(data.teamAssignments as Array<{
        id: string;
        employee_id: string;
        assigned_by: string;
        task_id: string;
        status: string;
        deadline_at: string | null;
        completed_at: string | null;
        assigned_at: string;
    }>, data.teamMembers as Array<{
        id: string;
        team_id: string | null;
    }>, data.tasks as Array<{
        id: string;
        project_id: string;
    }>, { team, employee, coordinator: selectedPC, project }) : [];
    const assignments = allAssignments.filter(a => !status || a.status === status);
    const timing = monthlyTiming(allAssignments as Parameters<typeof monthlyTiming>[0], month);
    const events = data ? [
        ...data.workActivity.map(a=>({id:'saved-'+a.id,actor:a.actor_id,employee:data.teamMembers.find(e=>e.profile_id===a.actor_id)?.id??'',project:a.project_id??'',kind:a.entity_type==='projects'?'project':a.entity_type==='tasks'?'task':a.entity_type==='clients'?'client':'assignment',title:a.title,at:a.created_at,detail:label(a.action)+(a.changed_fields.length?' · '+a.changed_fields.map(label).join(', '):'')})),
        ...data.activity.map(a=>({id:"activity-"+a.id,actor:a.actor_id,employee:data.teamMembers.find(e=>e.profile_id===a.actor_id)?.id??"",project:a.project_id,kind:"update",title:projectName(a.project_id),at:a.created_at,detail:label(a.action)})),
        ...data.clients.map(c => ({ id: 'client-' + c.id, actor: c.created_by, employee: '', project: '', kind: 'client', title: c.name, at: c.created_at, detail: 'Client created' })),
        ...data.projects.map(p => ({ id: 'project-' + p.id, actor: p.created_by, employee: '', project: p.id, kind: 'project', title: p.name, at: p.created_at, detail: 'Project created' })),
        ...data.createdTasks.map(t => ({ id: 'task-' + t.id, actor: t.created_by, employee: '', project: t.project_id, kind: 'task', title: t.title, at: t.created_at, detail: 'Task created' })),
        ...data.teamAssignments.map(a => ({ id: 'assigned-' + a.id, actor: a.assigned_by, employee: a.employee_id, project: task(a.task_id)?.project_id, kind: 'assignment', title: task(a.task_id)?.title || 'Task unavailable', at: a.assigned_at, detail: 'Assigned to ' + (worker(a.employee_id)?.full_name || 'Employee unavailable') })),
        ...data.teamAssignments.filter(a => a.completed_at).map(a => ({ id: 'completed-' + a.id, actor: worker(a.employee_id)?.profile_id, employee: a.employee_id, project: task(a.task_id)?.project_id, kind: 'completion', title: task(a.task_id)?.title || 'Task unavailable', at: a.completed_at, detail: 'Submitted by ' + (worker(a.employee_id)?.full_name || 'Employee unavailable') }))
    ].filter(e => (!selectedPC || (e.kind === 'completion' ? data.teamAssignments.some(a => 'completed-' + a.id === e.id && a.assigned_by === selectedPC) : e.actor === selectedPC)) && (!project || e.project === project) && (!kind || e.kind === kind) && (!team || (e.employee ? worker(e.employee)?.team_id === team : data.people.find(p => p.id === e.actor)?.team_id === team)) && (!employee || e.employee === employee)).sort((a, b) => Date.parse(b.at) - Date.parse(a.at)) : [];
    return <div className="team-pc pc-workspace"><header className="pc-page-header"><div><span className="pc-eyebrow">TEAM OVERSIGHT</span><h1>{ownTeam?'My Team':'Team PC'}</h1><p>People, assigned work and recorded activity. One shared view.</p></div><button className="pc-refresh" disabled={loading} onClick={() => { setLoading(true); setRevision(v => v + 1); }}><RefreshCw size={16}/>Refresh</button></header>
 {error ? <p role="alert" className="pc-error">{error}</p> : loading ? <p role="status">Loading team activity…</p> : data && <>
 <div className="pc-overview"><article><Users size={18}/><span>Team members in view</span><strong>{members.length}</strong></article><article><Filter size={18}/><span>Assignments in view</span><strong>{assignments.length}</strong></article><article><CheckCircle2 size={18}/><span>Completed in view</span><strong>{assignments.filter(a => a.status === 'completed').length}</strong></article><article><Clock size={18}/><span>Open in view</span><strong>{assignments.filter(a => !['completed', 'rejected'].includes(a.status)).length}</strong></article></div>
 <section className="pc-filters" aria-label="Team work filters">{!ownTeam&&<label>Coordinator<select value={selectedPC} onChange={e => setCoordinator(e.target.value)}><option value="">All coordinators</option>{data.coordinators.map(p => <option key={p.id} value={p.id}>{p.full_name} · {label(p.role)}</option>)}</select></label>}<label>Team<select value={team} onChange={e => { setTeam(e.target.value); setEmployee(''); }}><option value="">All visible teams</option>{data.teams.filter(t => data.teamMembers.some(e => e.team_id === t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Employee<select value={employee} onChange={e => setEmployee(e.target.value)}><option value="">All employees</option>{data.teamMembers.filter(e => !team || e.team_id === team).map(e => <option key={e.id} value={e.id}>{e.full_name} · {teamName(e.team_id)}</option>)}</select></label><label>Project<select value={project} onChange={e => setProject(e.target.value)}><option value="">All projects</option>{data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="pc-reset" onClick={() => { setCoordinator(''); setTeam(''); setEmployee(''); setProject(''); setStatus(''); setKind(''); }}>Clear filters</button></section>
 {!ownTeam&&<section className="pc-coordinators"><h2>Coordinator overview</h2><p className="pc-directory-help">Role-based accounts, including Flow Force supervisors. Counts respect the coordinator and project filters; employee/team filters apply to work below.</p><Table heads={['Coordinator', 'Role / team', 'Clients created', 'Projects owned / shared', 'Tasks created', 'Assignments made', 'Completed']} empty={!data.coordinators.filter(p => !selectedPC || p.id === selectedPC).length}>{data.coordinators.filter(p => !selectedPC || p.id === selectedPC).map(p => { const own = data.assignments.filter(a => a.assigned_by === p.id && (!project || task(a.task_id)?.project_id === project)); return <tr key={p.id}><td><strong>{p.full_name}</strong></td><td>{label(p.role)}<small className="pc-team-name">{teamName(p.team_id!)}</small></td><td>{project ? '—' : data.clients.filter(c => c.created_by === p.id).length}</td><td>{data.projects.filter(q => (!project || q.id === project) && (q.created_by === p.id || q.project_members?.some((m: {
            profile_id: string;
        }) => m.profile_id === p.id))).length}</td><td>{data.createdTasks.filter(t => t.created_by === p.id && (!project || t.project_id === project)).length}</td><td>{own.length}</td><td>{own.filter(a => a.status === 'completed').length}</td></tr>; })}</Table></section>}
 <section className="pc-timing"><div className="pc-section-head"><div><h2>Work & activity</h2><p className="pc-directory-help">Only records available to your account are shown.</p></div><div className="pc-tabs" role="group" aria-label="Team PC view">{[['work', 'Assignments'], ['people', 'People'], ['activity', 'Activity'], ['timing', 'Monthly timing']].map(([id, name]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{name}</button>)}</div></div>
 {tab === 'work' && <><label className="pc-local-filter">Assignment status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{['assigned', 'accepted', 'in_progress', 'completed', 'rejected'].map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label><Table heads={['Task / project', 'Employee / team', 'Assigned by', 'Assigned (IST)', 'Committed / deadline (IST)', 'Completed (IST)', 'Status']} empty={!assignments.length}>{assignments.map(a => <tr key={a.id}><td><strong>{task(a.task_id)?.title || 'Task unavailable'}</strong><small className="pc-team-name">{projectName(task(a.task_id)?.project_id)}</small></td><td>{worker(a.employee_id)?.full_name || 'Employee unavailable'}<small className="pc-team-name">{teamName(worker(a.employee_id)?.team_id)}</small></td><td>{person(a.assigned_by)}</td><td>{formatAssignmentTime(a.assigned_at)}</td><td>{formatAssignmentTime(a.deadline_at)}</td><td>{formatAssignmentTime(a.completed_at)}</td><td><span className="pc-status">{label(a.status)}</span></td></tr>)}</Table></>}
 {tab === 'people' && <Table heads={['Employee', 'Job title', 'Team', 'Assigned', 'In progress', 'Completed', 'Open total']} empty={!members.length}>{members.map(e => { const rows = allAssignments.filter(a => a.employee_id === e.id); return <tr key={e.id}><td><strong>{e.full_name}</strong></td><td>{e.job_title||'Not set'}</td><td>{teamName(e.team_id)}</td><td>{rows.filter(a => a.status === 'assigned').length}</td><td>{rows.filter(a => a.status === 'in_progress').length}</td><td>{rows.filter(a => a.status === 'completed').length}</td><td>{rows.filter(a => !['completed', 'rejected'].includes(a.status)).length}</td></tr>; })}</Table>}
 {tab === 'activity' && <><label className="pc-local-filter">Activity type<select value={kind} onChange={e => setKind(e.target.value)}><option value="">All recorded activity</option>{['client', 'project', 'task', 'assignment', 'completion', 'update'].map(k => <option key={k} value={k}>{label(k)}</option>)}</select></label><p className="pc-directory-help">Saved project, task, assignment and client changes, including edits, deletions and restorations. Older entries show the history recorded at the time.</p><Table heads={['Time (IST)', 'Person', 'Activity', 'Work / client', 'Details']} empty={!events.length}>{events.map(e => <tr key={e.id}><td>{formatAssignmentTime(e.at)}</td><td>{e.kind === 'completion' ? worker(e.employee)?.full_name || 'Employee unavailable' : e.actor ? person(e.actor) : 'Name unavailable'}</td><td><span className="pc-status">{label(e.kind)}</span></td><td><strong>{e.title}</strong>{e.project && <small className="pc-team-name">{projectName(e.project)}</small>}</td><td>{e.detail}</td></tr>)}</Table></>}
 {tab === 'timing' && <><label className="pc-local-filter">Deadline month (IST)<input type="month" value={month} onChange={e => setMonth(e.target.value)}/></label><details className="pc-explainer"><summary>How monthly timing is calculated</summary><p>Net delay = minutes late − minutes early, per employee. Completion is submission time. Pending work earns no early offset. Assignments without a deadline or completion cannot be placed in a month.</p></details><Table heads={['Employee / team', 'Completed', 'Late', 'Early', 'Net timing', 'Pending / overdue', 'Missing timestamps']} empty={!timing.length}>{timing.map(t => { return <tr key={t.employee_id}><td><strong>{worker(t.employee_id)?.full_name}</strong><small className="pc-team-name">{teamName(worker(t.employee_id)?.team_id)}</small></td><td>{t.completed}</td><td>{durationMinutes(t.lateMinutes)}</td><td>{durationMinutes(t.earlyMinutes)}</td><td><span className="pc-status">{durationMinutes(t.netMinutes)} {t.netMinutes > 0 ? 'late' : t.netMinutes < 0 ? 'ahead' : 'balanced'}</span></td><td>{t.pending} / {t.overdue}</td><td>{t.missing}</td></tr>; })}</Table></>}
 </section></>}
 </div>;
}
