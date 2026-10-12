import { useEffect, useState } from 'react';
import type { TaskWithRelations } from '../../types/task';
import { displayTime, logTime, readVisibleRows, safeLink, type Team, type WorkLog } from '../tracker/trackerData';
interface Props {tasks:TaskWithRelations[];loading?:boolean;onEdit:(task:TaskWithRelations)=>void;onStatusChange?:(task:TaskWithRelations)=>void}
export default function TaskTable({tasks,loading,onEdit,onStatusChange}:Props) {
  const [logs,setLogs]=useState<WorkLog[]>([]),[teams,setTeams]=useState<Team[]>([]),[error,setError]=useState(''),[pending,setPending]=useState(true);
  const [day,setDay]=useState('');
  useEffect(()=>{let active=true;setPending(true);setError('');setLogs([]);setTeams([]);Promise.all([readVisibleRows<WorkLog>('timesheets','id,task_id,employee_id,work_date,start_time,end_time,total_hours'),readVisibleRows<Team>('teams','id,name')]).then(([l,t])=>{if(active){setLogs(l);setTeams(t);}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setPending(false);});return()=>{active=false;};},[tasks]);
  const rows=tasks.flatMap(task=> {
    const assignments=task.assignments?.length?task.assignments:task.assignment?[task.assignment]:[];
    return (assignments.length?assignments:[null]).map(assignment=>({task,assignment,work:logs.filter(l=>l.task_id===task.id && (!assignment || l.employee_id===assignment.employee_id) && (!day||l.work_date===day)).sort((a,b)=>(a.work_date+a.start_time).localeCompare(b.work_date+b.start_time))}));
  }).filter(row=>!day||row.work.length>0||row.task.planned_date===day);
  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-semibold">Editors & Designers Daily Tasks</h2><p className="text-xs text-slate-500">One row per task and assigned artist. Project rate is shared across tasks; it is not an additional charge per task. Work times and hours come from timesheets.</p></div><label className="grid gap-1 text-xs">Work date<input type="date" value={day} onChange={e=>setDay(e.target.value)} className="rounded-lg border p-2" /></label></div>
    {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="overflow-x-auto"><table className="w-full min-w-[1850px] text-left text-xs"><thead className="bg-slate-50"><tr>{['Project ID','Project rate (INR)','Client Name','Project Title','Task Title','Category','File Status','File / Asset Link','Team','Artist','Committed Time','Start Time','End Time','Total Hours','Status','Actions'].map(h=><th key={h} className="whitespace-nowrap px-3 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>
    {loading||pending?<tr><td colSpan={16} className="p-5" role="status">Loading daily tasks…</td></tr>:rows.length===0?<tr><td colSpan={16} className="p-5">No tasks match this view.</td></tr>:rows.map(({task,assignment,work})=>{
      const link=safeLink(task.footage_link), last=work[work.length-1];
      return <tr key={task.id+':'+(assignment?.id??'unassigned')} className="border-t border-slate-100 align-top hover:bg-slate-50">
        <td className="p-3 font-mono">{task.project?.project_code||'—'}</td><td className="p-3 whitespace-nowrap">{task.project?.rate == null ? 'Not set' : new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(task.project.rate)}</td><td className="p-3">{task.client?.name||task.project?.client?.name||'—'}</td><td className="p-3">{task.project?.name||'—'}</td><td className="p-3 font-semibold">{task.title}</td><td className="p-3">{task.category.replaceAll('_',' ')}</td><td className="p-3 capitalize">{task.revision_status.replaceAll('_',' ')}</td><td className="p-3">{link?<a href={link} target="_blank" rel="noreferrer" className="underline">Open file</a>:'—'}</td>
        <td className="p-3">{teams.find(t=>t.id===assignment?.employee?.team_id)?.name||'—'}</td><td className="p-3">{assignment?.employee?.full_name||'Unassigned'}</td>
        <td className="p-3 whitespace-nowrap">{displayTime(assignment?.committed_at ?? assignment?.deadline_at ?? task.due_date)}<p className="mt-1 text-slate-500">{task.estimated_hours}h estimated</p></td><td className="p-3 whitespace-nowrap">{work[0]?logTime(work[0]):'—'}</td><td className="p-3 whitespace-nowrap">{last?logTime(last,true):'—'}</td><td className="p-3">{error?'Unavailable':work.reduce((sum,l)=>sum+Number(l.total_hours||0),0).toFixed(2)+'h'}</td><td className="p-3 capitalize">{(assignment?.status||task.status).replaceAll('_',' ')}</td>
        <td className="p-3"><div className="flex gap-3"><button onClick={()=>onEdit(task)} className="underline">Edit</button>{onStatusChange&&<button onClick={()=>onStatusChange(task)} className="underline">Actions</button>}</div></td>
      </tr>;
    })}</tbody></table></div><p className="text-xs text-slate-500">Committed Time shows the agreed assignment completion timestamp (IST), with estimated effort separately. File Status is New File or revision; File / Asset Link opens the asset. Timesheet times use the recorded work date. Clear the date to show all work.</p>
  </section>;
}
