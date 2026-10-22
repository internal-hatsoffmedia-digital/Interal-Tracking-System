import {useSearchParams} from 'react-router-dom';
import {useState} from 'react';
import SalesResults from './SalesResults';
import type {SalesCreditDirectory} from '../../hooks/useSalesCreditDirectory';
import {Download,RefreshCw,Users} from 'lucide-react';
import {financeMoney} from '../../lib/projectFinanceMetrics';
import {employeeSalesRows,employeeSalesTotals} from '../../lib/employeeSalesReport';
import {csvCell} from '../../lib/projectMetrics';
import type {FinanceProject} from '../../types/projectFinance';
export default function EmployeeSalesReport({projects,month,directory,loading,error}:{projects:FinanceProject[];month:string;directory:SalesCreditDirectory;loading:boolean;error:string}){
 const [resetVersion,setResetVersion]=useState(0);
 const [params]=useSearchParams();
 const [employee,setEmployee]=useState(params.get('employee')||'');
 const [from,setFrom]=useState(''),[through,setThrough]=useState('');
 const load=()=>window.dispatchEvent(new Event('sales-credits-updated'));
 const start=from||month+'-01';const end=through||new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10);
 const invalid=start>end;const rows=employeeSalesRows(projects,directory.credits,employee,start,end),totals=employeeSalesTotals(rows);
 function exportRows(){const lines=[['Employee','Completion date (IST)','Project ID','Client','Project','Credited sales (INR)'],...rows.map(r=>[r.name,r.completion_day,r.project_code,r.client_name,r.project_name,r.amount])];const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`employee-sales-${start}-to-${end}.csv`;a.click();URL.revokeObjectURL(url);}
 return <section className="finance-card employee-sales-report" aria-labelledby="employee-sales-title"><div className="finance-card-heading"><div><p className="finance-chart-kicker">PEOPLE & PERFORMANCE</p><h2 id="employee-sales-title"><Users size={20}/>Employee sales</h2><p>Filter employee sales by project completion date. Sole-contributor completed projects are credited automatically.</p></div><div className="finance-actions"><button disabled={loading} onClick={()=>void load()} aria-label="Refresh employee sales"><RefreshCw size={15}/></button></div></div>
 <div className="employee-sales-filters"><label>Employee<select value={employee} onChange={e=>setEmployee(e.target.value)}><option value="">All employees</option>{directory.people.map(p=><option key={p.id} value={p.id}>{p.name}{p.team?' · '+p.team:''}</option>)}</select></label><label>Completed from<input type="date" value={start} onChange={e=>setFrom(e.target.value)}/></label><label>Completed through<input type="date" value={end} onChange={e=>setThrough(e.target.value)}/></label><button onClick={()=>{setEmployee('');setFrom('');setThrough('');setResetVersion(n=>n+1);}}>Reset filters</button></div>
 {invalid&&<p role="alert" className="finance-message">The start date must be on or before the end date.</p>}{error&&<p role="alert" className="finance-message">{error}</p>}
 <SalesResults key={JSON.stringify([JSON.stringify([employee,start,end]),resetVersion])} filterKey={JSON.stringify([employee,start,end])} count={rows.length} disabled={loading||!!error||invalid}>{limit=><><div className="finance-actions"><button disabled={loading||!!error||invalid||!rows.length} onClick={exportRows}><Download size={15}/>Export employee report</button></div> <div className="employee-sales-totals"><div><span>Credited sales</span><strong>{loading||error||invalid?'—':financeMoney(totals.amount)}</strong></div><div><span>Employees credited</span><strong>{loading||error||invalid?'—':totals.employees}</strong></div><div><span>Completed projects</span><strong>{loading||error||invalid?'—':totals.projects}</strong></div></div>
 <div className="finance-table-scroll"><table><thead><tr>{['Employee','Completion date (IST)','Project ID','Client / project','Credited sales'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.slice(0,limit).map(r=><tr key={r.project_id+r.profile_id}><td>{r.name}</td><td>{r.completion_day}</td><td className="finance-code">{r.project_code}</td><td>{r.client_name}<small>{r.project_name}</small></td><td>{financeMoney(Number(r.amount))}</td></tr>)}</tbody></table>{loading?<p className="finance-table-empty" role="status">Loading employee sales…</p>:!error&&!invalid&&!rows.length&&<p className="finance-table-empty">No credited sales match this employee and date range.</p>}</div>
 </>}</SalesResults>
 <p className="finance-chart-note">Team, client and project filters above also apply. Sole-contributor projects credit the full base rate; shared projects use allocated employee shares. Unattributed historical sales, expenses and additional charges are excluded. Company totals below use the reporting month separately.</p>
 </section>;
}
