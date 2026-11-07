import type {SalesCreditDirectory} from '../../hooks/useSalesCreditDirectory';
import {useState} from 'react';
import {supabase} from '../../lib/supabase';
import {financeMoney,isActiveFinanceProject} from '../../lib/projectFinanceMetrics';
import type {FinanceProject} from '../../types/projectFinance';
export default function EmployeeSalesCredits({projects,directory,teams=[]}:{projects:FinanceProject[];directory:SalesCreditDirectory;teams?:{id:string;name:string}[]}){
 const {people,credits}=directory;
 const [project,setProject]=useState(''),[person,setPerson]=useState(''),[amount,setAmount]=useState('');
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false);
 const completed=projects.filter(p=>isActiveFinanceProject(p)&&!p.monthly_team_project&&!p.sales_credit_team_id&&!teams.some(t=>['Digital Ninjas - M','Digital Ninjas - W'].includes(t.name)&&p.production_team_ids?.includes(t.id))&&p.status==='completed'&&p.sales_completed_at&&p.rate!=null);
 const selected=completed.find(p=>p.id===project),recipient=people.find(p=>p.id===person);
 const shares=credits.filter(c=>c.project_id===project&&Number(c.amount)>0);
 const allocated=shares.reduce((sum,c)=>sum+Number(c.amount),0);
 const previous=shares.find(c=>c.profile_id===person);
 const available=Math.max(0,Math.round((Number(selected?.rate??0)-allocated+Number(previous?.amount??0))*100)/100);
 const exceeds=amount!==''&&Number(amount)>available;
 const busy=saving||!selected||!person;
 async function update(reassign=false){
  if(!selected||!recipient)return;
  if(reassign&&!window.confirm('Reassign the full '+financeMoney(Number(selected.rate))+' credit for '+selected.project_code+' to '+recipient.name+'? Existing employee shares will become zero. Project revenue stays unchanged.'))return;
  setSaving(true);setError('');setNotice('');
  try{
   const expected=shares.map(c=>({profile_id:c.profile_id,amount:Number(c.amount)}));
   const result=reassign
    ?await supabase.rpc('reassign_project_sales_credit',{p_project:project,p_profile:person,p_expected:expected})
    :await supabase.rpc('set_project_sales_credit',{p_project:project,p_profile:person,p_amount:Number(amount)});
   if(result.error){if(reassign&&['PGRST202','42883'].includes(result.error.code))throw new Error('Reassignment is not installed yet. Ask Admin to apply the sales credit reassignment database update.');throw result.error;}
   window.dispatchEvent(new Event('sales-credits-updated'));
   setAmount('');setNotice(reassign?'Full project credit reassigned. Company revenue is unchanged.':'Sales credit saved. Employee totals refresh within one minute.');
  }catch(e){setError(e instanceof Error?e.message:(e as {message?:string})?.message??'Unable to save sales credit.');}
  finally{setSaving(false);}
 }
 return <section className="finance-card"><div className="finance-card-heading"><h2>Credit employee sales</h2><span>Completed project base rates only</span></div>
 <p className="mb-4 text-sm">Allocate the project’s existing revenue between employees. To correct the credited employee, select the new employee and use Reassign full credit. Company revenue is counted only once.</p>
 {error&&<p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}{notice&&<p role="status" className="mb-3 text-sm">{notice}</p>}
 <form onSubmit={e=>{e.preventDefault();if(!exceeds&&amount!==''&&Number.isFinite(Number(amount))&&Number(amount)>=0)void update();}} className="grid gap-3 md:grid-cols-4">
 <label className="grid gap-1 text-sm">Completed project<select required disabled={saving} value={project} onChange={e=>{setProject(e.target.value);setPerson('');setAmount('');setError('');setNotice('');}} className="rounded-xl border p-3"><option value="">Choose project</option>{completed.map(p=><option key={p.id} value={p.id}>{p.project_code} · {p.name}</option>)}</select></label>
 <label className="grid gap-1 text-sm">Credit to<select required disabled={saving} value={person} onChange={e=>{setPerson(e.target.value);setAmount(String(credits.find(c=>c.project_id===project&&c.profile_id===e.target.value)?.amount??''));setError('');setNotice('');}} className="rounded-xl border p-3"><option value="">Choose employee</option>{people.map(p=><option key={p.id} value={p.id}>{p.name}{p.team?' · '+p.team:''}</option>)}</select></label>
 <label className="grid gap-1 text-sm">Credit amount (INR)<input required disabled={saving} type="number" min="0" max={available} step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className="rounded-xl border p-3"/></label>
 <button disabled={busy||amount===''||exceeds||!Number.isFinite(Number(amount))||Number(amount)<0} className="self-end rounded-xl bg-[#ffcc00] p-3 font-semibold text-black disabled:opacity-50">{saving?'Saving…':'Save share'}</button></form>
 {selected&&<div className="mt-4 space-y-3"><p className="text-sm">Project rate: {financeMoney(Number(selected.rate))} · Allocated: {financeMoney(allocated)} · Available for selected employee: {financeMoney(available)}.</p>
 {exceeds&&<p role="alert" className="text-sm text-amber-800">The full rate may already be allocated. Edit an existing share below, or reassign the full credit to the selected employee.</p>}
 <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={busy||Number(selected.rate)<=0} onClick={()=>void update(true)} className="rounded-xl border px-4 py-2 text-sm font-semibold">Reassign full credit</button><p className="text-xs text-slate-500">Moves the full project rate to the selected employee after confirmation. Zero removes an individual share.</p></div></div>}
 {!completed.length&&<p className="mt-3 text-sm">Complete a priced project before crediting employee sales.</p>}
 {selected&&<div className="finance-table-scroll mt-4"><table><thead><tr><th>Project</th><th>Employee</th><th>Credited amount</th><th>Action</th></tr></thead><tbody>{shares.map(c=><tr key={c.project_id+c.profile_id}><td>{selected.project_code}</td><td>{c.name}</td><td>{financeMoney(Number(c.amount))}</td><td><button type="button" disabled={saving} onClick={()=>{setPerson(c.profile_id);setAmount(String(c.amount));setError('');setNotice('');}}>Edit share</button></td></tr>)}</tbody></table></div>}
 </section>;
}
