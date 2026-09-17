import {useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {salesSources} from '../../lib/salesMetrics';
import {todayLocal} from '../../lib/projectMetrics';
import {saveSalesLead,logSalesActivity,setSalesTarget,grantSalesAccess} from '../../services/sales/sales.service';
import type {SalesData,SalesLead} from '../../types/sales';
const input='w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const button='rounded-lg border bg-white px-4 py-2 text-sm disabled:opacity-50';

export default function SalesEditor({lead,data,onClose,onSaved}:{lead:SalesLead|null;data:SalesData;onClose:()=>void;onSaved:()=>Promise<void>}) {
  const {profile}=useAuth();
  const readOnly=data.access==='viewer';
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const [kind,setKind]=useState('call');const [notes,setNotes]=useState('');const [next,setNext]=useState('');const [complete,setComplete]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();const fields=Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);setError('');try{await saveSalesLead(lead,fields);await onSaved();}catch(e){setError(e instanceof Error?e.message:'Save failed');}finally{setBusy(false);}
  }
  async function activity(){
    if(!lead)return;setBusy(true);setError('');
    try{await logSalesActivity(lead.id,kind,notes,next,complete);await onSaved();}catch(e){setError(e instanceof Error?e.message:'Activity failed');}finally{setBusy(false);}
  }
  const fields=[['name','Lead name',lead?.name ?? ''],['company','Company',lead?.company ?? ''],['contact_name','Contact name',lead?.contactName ?? ''],['email','Email',lead?.email ?? ''],['phone','Phone',lead?.phone ?? ''],['campaign','Campaign',lead?.campaign ?? '']];
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 sm:p-8"><section role="dialog" aria-modal="true" aria-labelledby="sales-editor-title" className="mx-auto max-w-3xl space-y-5 rounded-2xl bg-white p-6">
    <div className="flex justify-between"><h2 id="sales-editor-title" className="text-xl font-semibold">{readOnly?'Lead details':lead?'Edit lead':'Add lead'}</h2><button autoFocus className={button} disabled={busy} onClick={onClose}>Close</button></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <form onSubmit={submit} className="space-y-4"><fieldset disabled={busy||readOnly} className="grid gap-4 sm:grid-cols-2">
      {fields.map(([key,label,value])=><label className="grid gap-1 text-xs" key={key}>{label}<input className={input} name={key} type={key==='email'?'email':'text'} defaultValue={value} required={key==='name'}/></label>)}
      <label className="grid gap-1 text-xs">Source<select className={input} name="source" defaultValue={lead?.source ?? 'Cold Call'}>{salesSources.map(s=><option key={s}>{s}</option>)}</select></label>
      <label className="grid gap-1 text-xs">Stage<select className={input} name="stage" defaultValue={lead?.stage ?? 'lead'}>{['lead','prospect','proposal','won','lost'].map(s=><option key={s}>{s}</option>)}</select></label>
      <label className="grid gap-1 text-xs">Owner<select className={input} name="owner_id" defaultValue={lead?.ownerId ?? profile?.id} required>{(data.people ?? []).filter(p=>['admin','manager','member'].includes(p.access_level ?? '') && (data.access!=='member'||p.id===profile?.id)).map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label>
      <label className="grid gap-1 text-xs">Deal value (INR)<input className={input} type="number" min="0" step="0.01" name="deal_value" defaultValue={lead?.revenue ?? 0} required/></label>
      <label className="grid gap-1 text-xs">Next follow-up<input className={input} type="date" name="next_follow_up" defaultValue={lead?.nextFollowUp ?? ''}/></label>
      <label className="grid gap-1 text-xs sm:col-span-2">Notes<textarea className={input} name="notes" defaultValue={lead?.notes ?? ''}/></label>
    </fieldset><p className="text-xs text-slate-500">Revenue reports use the deal value of won leads, not payment receipts. Marking a lead won records its conversion date.</p>{!readOnly && <button disabled={busy} type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">{busy?'Saving…':'Save lead'}</button>}</form>
    {lead && <section className="space-y-3 border-t pt-4">{!readOnly && <><h3 className="font-semibold">Log activity / complete follow-up</h3><label className="grid gap-1 text-xs">Activity type<select className={input} value={kind} onChange={e=>setKind(e.target.value)}>{['call','message','visit','meeting','email','note'].map(k=><option key={k}>{k}</option>)}</select></label><label className="grid gap-1 text-xs">Activity notes<textarea className={input} value={notes} onChange={e=>setNotes(e.target.value)}/></label><label className="grid gap-1 text-xs">Next follow-up date<input className={input} type="date" value={next} onChange={e=>setNext(e.target.value)}/></label><label className="flex gap-2 text-sm"><input type="checkbox" checked={complete} onChange={e=>setComplete(e.target.checked)}/>Complete current follow-up (clears it unless a new date is set)</label><button disabled={busy||!notes.trim()} className={button} onClick={()=>void activity()}>Record activity</button></>}
      <h3 className="pt-3 font-semibold">History</h3><ol className="space-y-2 text-sm">{data.activities.filter(a=>a.leadId===lead.id).sort((a,b)=>b.occurredOn.localeCompare(a.occurredOn)).map(a=><li className="border-l-2 pl-3" key={a.id}>{a.notes}<p className="text-xs text-slate-500">{data.people?.find(p=>p.id===a.ownerId)?.full_name ?? 'User'} · {new Date(a.occurredOn).toLocaleString()} · {a.kind}</p></li>)}</ol>
    </section>}
  </section></div>;
}
export function SalesManagement({data,onSaved}:{data:SalesData;onSaved:()=>Promise<void>}) {
  const [month,setMonth]=useState(todayLocal().slice(0,7));const [amount,setAmount]=useState('');
  const [person,setPerson]=useState('');const [level,setLevel]=useState('member');
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [saved,setSaved]=useState('');
  async function run(action:()=>Promise<void>){setBusy(true);setError('');setSaved('');try{await action();await onSaved();setSaved('Saved');}catch(e){setError(e instanceof Error?e.message:'Save failed');}finally{setBusy(false);}}
  return <section className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="font-semibold">Sales administration</h2>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{saved && <p role="status">{saved}</p>}
    <form onSubmit={e=>{e.preventDefault();void run(()=>setSalesTarget(month,Number(amount)));}} className="flex flex-wrap items-end gap-3"><label className="grid gap-1 text-xs">Target month<input className={input} type="month" value={month} required onChange={e=>setMonth(e.target.value)}/></label><label className="grid gap-1 text-xs">Revenue target (INR)<input className={input} type="number" min="0" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label><button disabled={busy} className={button}>Save target</button></form>
    {data.access==='admin' && <form className="space-y-3 border-t pt-4" onSubmit={e=>{e.preventDefault();void run(()=>grantSalesAccess(person,level || null));}}><h3 className="text-sm font-semibold">Grant or revoke sales access</h3><p className="text-xs text-slate-500">Members manage their own leads. Viewers read all sales records. Managers manage all leads and targets. Administrators retain full access.</p><div className="flex flex-wrap gap-3"><label className="grid gap-1 text-xs">Verified account<select className={input} required value={person} onChange={e=>setPerson(e.target.value)}><option value="">Choose account</option>{data.people?.map(p=><option value={p.id} key={p.id}>{p.full_name} · {p.access_level ?? 'No access'} · {p.id}</option>)}</select></label><label className="grid gap-1 text-xs">Access<select className={input} value={level} onChange={e=>setLevel(e.target.value)}><option value="member">Member — own leads</option><option value="viewer">Viewer — all leads</option><option value="manager">Manager — all leads and targets</option><option value="">Revoke explicit access</option></select></label><button disabled={busy||!person} className={button}>Save access</button></div></form>}
  </section>;
}
