import type {SalesCreditDirectory} from '../../hooks/useSalesCreditDirectory';
import {useState} from 'react';
import {supabase} from '../../lib/supabase';
import {financeMoney} from '../../lib/projectFinanceMetrics';
import type {FinanceProject} from '../../types/projectFinance';
export default function EmployeeSalesCredits({projects,directory}:{projects:FinanceProject[];directory:SalesCreditDirectory}){
 const {people,credits}=directory;
 const [project,setProject]=useState(''),[person,setPerson]=useState(''),[amount,setAmount]=useState('');
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false);
 const completed=projects.filter(p=>p.status==='completed'&&p.sales_completed_at&&p.rate!=null);
 const selected=completed.find(p=>p.id===project);const allocated=credits.filter(c=>c.project_id===project).reduce((sum,c)=>sum+Number(c.amount),0);
 async function save(event:React.FormEvent){event.preventDefault();setSaving(true);setError('');setNotice('');try{const {error}=await supabase.rpc('set_project_sales_credit',{p_project:project,p_profile:person,p_amount:Number(amount)});if(error)throw error;window.dispatchEvent(new Event('sales-credits-updated'));setNotice('Sales credit saved. The employee dashboard updates within one minute.');}catch(e){setError(e instanceof Error?e.message:(e as {message?:string})?.message??'Unable to save sales credit.');}finally{setSaving(false);}}
 return <section className="finance-card"><div className="finance-card-heading"><h2>Credit employee sales</h2><span>Completed project base rates only</span></div>
 <p className="mb-4 text-sm">Completed projects with one verified contributor credit that employee automatically. For shared projects, allocate the agreed shares here. This allocates existing revenue; it does not add sales again. Historical unattributed sales stay separate.</p>
 {error&&<p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}{notice&&<p role="status" className="mb-3 text-sm">{notice}</p>}
 <form onSubmit={save} className="grid gap-3 md:grid-cols-4"><label className="grid gap-1 text-sm">Completed project<select required value={project} onChange={e=>{setProject(e.target.value);setPerson('');setAmount('');}} className="rounded-xl border p-3"><option value="">Choose project</option>{completed.map(p=><option key={p.id} value={p.id}>{p.project_code} · {p.name}</option>)}</select></label>
 <label className="grid gap-1 text-sm">Credit to<select required value={person} onChange={e=>{setPerson(e.target.value);setAmount(String(credits.find(c=>c.project_id===project&&c.profile_id===e.target.value)?.amount??''));}} className="rounded-xl border p-3"><option value="">Choose employee</option>{people.map(p=><option key={p.id} value={p.id}>{p.name}{p.team?' · '+p.team:''}</option>)}</select></label>
 <label className="grid gap-1 text-sm">Credit amount (INR)<input required type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className="rounded-xl border p-3"/></label><button disabled={saving||!selected||!person||amount===''} className="self-end rounded-xl bg-[#ffcc00] p-3 font-semibold text-black disabled:opacity-50">{saving?'Saving…':'Save credit'}</button></form>
 {selected&&<p className="mt-3 text-sm">Project rate: {financeMoney(Number(selected.rate))} · Allocated: {financeMoney(allocated)}. Zero removes that employee’s credited share.</p>}
 {!completed.length&&<p className="mt-3 text-sm">Complete a priced project before crediting employee sales.</p>}
 {selected&&<div className="finance-table-scroll mt-4"><table><thead><tr><th>Project</th><th>Employee</th><th>Credited amount</th></tr></thead><tbody>{credits.filter(c=>Number(c.amount)>0&&c.project_id===project).map(c=><tr key={c.project_id+c.profile_id}><td>{projects.find(p=>p.id===c.project_id)?.project_code}</td><td>{c.name}</td><td>{financeMoney(Number(c.amount))}</td></tr>)}</tbody></table></div>}
 </section>;
}
