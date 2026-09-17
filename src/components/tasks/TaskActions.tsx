import {useState} from 'react';
import {supabase} from '../../lib/supabase';
import type {TaskWithRelations} from '../../types/task';
export default function TaskActions({task,onClose,onSaved}:{task:TaskWithRelations;onClose:()=>void;onSaved:()=>Promise<void>}) {
 const archived=!!(task as TaskWithRelations & {archived_at?:string}).archived_at;
 const [status,setStatus]=useState(task.status);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [confirm,setConfirm]=useState(false);
 async function save(archive:boolean){setBusy(true);setError('');try{
  const r=archive?await supabase.rpc('workspace_archive_task',{p_id:task.id,p_archive:!archived}):await supabase.from('tasks').update({status}).eq('id',task.id).select('id').single();
  if(r.error)throw new Error(r.error.message);await onSaved();onClose();
 }catch(e){setError(e instanceof Error?e.message:'Unable to update task');}finally{setBusy(false);}}
 return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onKeyDown={e=>{if(e.key==='Escape'&&!busy)onClose();}}><section role="dialog" aria-modal="true" aria-labelledby="task-actions-title" className="w-full max-w-md space-y-5 rounded-2xl border bg-white p-6 shadow-xl">
 <div className="flex items-center justify-between"><h2 id="task-actions-title" className="text-lg font-semibold">Task actions</h2><button autoFocus disabled={busy} onClick={onClose} aria-label="Close task actions">✕</button></div><p className="font-medium">{task.title}</p>
 {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
 {!archived&&<><label className="grid gap-2 text-sm">Task status<select aria-label="Task status" className="rounded-lg border p-2" value={status} disabled={busy} onChange={e=>setStatus(e.target.value)}>{Array.from(new Set([task.status,'not_started','raw_footage_received','editing_in_progress','internal_review','client_review','approved_delivered','on_hold'])).map(s=><option value={s} key={s}>{s.replaceAll('_',' ')}</option>)}</select></label><div className="flex gap-2"><button disabled={busy} className="rounded-lg border px-3 py-2 text-sm" onClick={()=>setStatus('on_hold')}>Put on hold</button><button disabled={busy||status===task.status} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white" onClick={()=>void save(false)}>Save status</button></div></>}
 <div className="space-y-3 border-t pt-4"><p className="text-sm text-slate-500">Removing a task archives it from the active list. Assignments, time records and history are preserved. Restore it from the archived tasks view.</p>{confirm?<div className="flex flex-wrap gap-2"><button disabled={busy} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white" onClick={()=>void save(true)}>Confirm removal</button><button disabled={busy} onClick={()=>setConfirm(false)}>Cancel</button></div>:<button disabled={busy} className="rounded-lg border px-3 py-2 text-sm" onClick={()=>archived?void save(true):setConfirm(true)}>{archived?'Restore task':'Remove from active tasks'}</button>}</div>
 </section></div>;
}
