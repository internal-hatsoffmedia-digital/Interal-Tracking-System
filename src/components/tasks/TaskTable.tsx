import { useEffect, useState } from 'react';
import type { TaskWithRelations } from '../../types/task';
import { displayTime, readVisibleRows, safeLink, type Team } from '../tracker/trackerData';
import {supabase} from '../../lib/supabase';
import {taskTimerSummary,type TaskTimerSession} from '../../lib/taskTimerReport';
interface Props {tasks:TaskWithRelations[];loading?:boolean;onEdit:(task:TaskWithRelations)=>void;onStatusChange?:(task:TaskWithRelations)=>void}
export default function TaskTable({tasks,loading,onEdit,onStatusChange}:Props) {
  const [logs,setLogs]=useState<TaskTimerSession[]>([]),[teams,setTeams]=useState<Team[]>([]),[error,setError]=useState(''),[pending,setPending]=useState(true);
  const [day,setDay]=useState('');
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{let active=true;setPending(true);setError('');
    const load=async()=>{try{const [report,t]=await Promise.all([supabase.rpc('task_timer_report'),readVisibleRows<Team>('teams','id,name')]);if(report.error)throw report.error;if(active){setLogs(report.data??[]);setTeams(t);setError('');}}catch(e){if(active)setError(e instanceof Error?e.message:String(e));}finally{if(active)setPending(false);}};
    void load();const poll=window.setInterval(()=>{if(!document.hidden)void load();},15000);const tick=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>{active=false;clearInterval(poll);clearInterval(tick);};},[tasks]);
  const rows=tasks.flatMap(task=> {
    const assignments=task.assignments?.length?task.assignments:task.assignment?[task.assignment]:[];
    return (assignments.length?assignments:[null]).map(assignment=>({task,assignment,work:taskTimerSummary(logs.filter(l=>l.assignment_id===assignment?.id),day,now)}));
  }).filter(row=>!day||row.work.count>0||row.task.planned_date===day);
  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-semibold">Editors & Designers Daily Tasks</h2><p className="text-xs text-slate-500">One row per task and assigned artist. Project rate is shared across tasks; it is not an additional charge per task. Start time and focused hours come from the employee’s task timer. End time is their task completion time.</p></div><label className="grid gap-1 text-xs">Work date<input type="date" value={day} onChange={e=>setDay(e.target.value)} className="rounded-lg border p-2" /></label></div>
    {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="overflow-x-auto"><table className="w-full min-w-[1850px] text-left text-xs"><thead className="bg-slate-50"><tr>{['Project ID','Project rate (INR)','Client Name','Project Title','Task Title','Category','File Status','File / Asset Link','Team','Artist','Committed Time','Start Time','End Time','Total Hours','Status','Actions'].map(h=><th key={h} className="whitespace-nowrap px-3 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>
    {loading||pending?<tr><td colSpan={16} className="p-5" role="status">Loading daily tasks…</td></tr>:rows.length===0?<tr><td colSpan={16} className="p-5">No tasks match this view.</td></tr>:rows.map(({task,assignment,work})=>{
      const link=safeLink(task.footage_link);
      return <tr key={task.id+':'+(assignment?.id??'unassigned')} className="border-t border-slate-100 align-top hover:bg-slate-50">
        <td className="p-3 font-mono">{task.project?.project_code||'—'}</td><td className="p-3 whitespace-nowrap">{task.project?.rate == null ? 'Not set' : new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(task.project.rate)}</td><td className="p-3">{task.client?.name||task.project?.client?.name||'—'}</td><td className="p-3">{task.project?.name||'—'}</td><td className="p-3 font-semibold">{task.title}</td><td className="p-3">{task.category.replaceAll('_',' ')}</td><td className="p-3 capitalize">{task.revision_status.replaceAll('_',' ')}</td><td className="p-3">{link?<a href={link} target="_blank" rel="noreferrer" className="underline">Open file</a>:'—'}</td>
        <td className="p-3">{teams.find(t=>t.id===assignment?.employee?.team_id)?.name||'—'}</td><td className="p-3">{assignment?.employee?.full_name||'Unassigned'}</td>
        <td className="p-3 whitespace-nowrap">{displayTime(assignment?.committed_at ?? assignment?.deadline_at ?? task.due_date)}<p className="mt-1 text-slate-500">{task.estimated_hours}h estimated</p></td><td className="p-3 whitespace-nowrap">{displayTime(work.start)}</td><td className="p-3 whitespace-nowrap">{displayTime(work.end??assignment?.completed_at)}</td><td className="p-3">{error?'Unavailable':work.hours.toFixed(2)+'h'}</td><td className="p-3 capitalize">{task.status.replaceAll('_',' ')}{assignment&&<p className="mt-1 text-slate-500">Assignment: {assignment.status.replaceAll('_',' ')}</p>}</td>
        <td className="p-3"><div className="flex gap-3"><button onClick={()=>onEdit(task)} className="underline">Edit</button>{onStatusChange&&<button onClick={()=>onStatusChange(task)} className="underline">{task.archived_at?"Restore":"Delete"}</button>}</div></td>
      </tr>;
    })}</tbody></table></div><p className="text-xs text-slate-500">Committed Time shows the agreed assignment completion timestamp (IST), with estimated effort separately. File Status is New File or revision; File / Asset Link opens the asset. Timer hours exclude pauses and include running time. Dates use IST. Clear the date to show all work.</p>
  </section>;
}
