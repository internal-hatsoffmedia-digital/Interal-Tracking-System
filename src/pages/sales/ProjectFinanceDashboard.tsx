import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowDownLeft,ArrowUpRight,BarChart3,Download,RefreshCw,Wallet} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {loadProjectFinance,saveProjectFinanceItem} from '../../services/sales/projectFinance.service';
import {financeMoney,financeMonth,financeBookingMonth,financeSummary,financeForTeam,isFinanceMonth,financeClients} from '../../lib/projectFinanceMetrics';
import {csvCell} from '../../lib/projectMetrics';
import {displayTime} from '../../components/tracker/trackerData';
import type {FinanceInput,FinanceItem,ProjectFinanceData} from '../../types/projectFinance';
import EmployeeSalesReport from './EmployeeSalesReport';
import EmployeeSalesCredits from './EmployeeSalesCredits';
import ProjectFinanceCharts from './ProjectFinanceCharts';
import './projectFinance.css';

const emptyData:ProjectFinanceData={projects:[],items:[]};
const blank=(month:string):FinanceInput=>({project_id:'',label:'',kind:'charge',amount:0,frequency:'once',start_month:month+'-01',end_month:null,notes:''});
export default function ProjectFinanceDashboard({mode='sales'}:{mode?:'sales'|'costs'}) {
  const {profile}=useAuth();
  const userId=[profile?.id,profile?.team_id,profile?.role,mode].join(':');
  const [loaded,setLoaded]=useState<{userId:string;data:ProjectFinanceData}|null>(null);
  const rawData=loaded&&loaded.userId===userId?loaded.data:emptyData;
  const [teamFilter,setTeamFilter]=useState('');
  const data=financeForTeam(rawData,teamFilter);
  const [month,setMonth]=useState(()=>financeMonth(new Date().toISOString()));
  const [client,setClient]=useState(''),[project,setProject]=useState('');
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [form,setForm]=useState<FinanceInput>(()=>blank(month));
  const requests=useRef(0);
  const load=useCallback(async()=>{
    const n=++requests.current;setLoading(true);setError('');
    try{const next=await loadProjectFinance(mode);if(n===requests.current)setLoaded({userId,data:next});}
    catch(e){if(n===requests.current){setLoaded(null);setError(e instanceof Error?e.message:'Unable to load project finances.');}}
    finally{if(n===requests.current)setLoading(false);}
  },[userId,mode]);
  useEffect(()=>{const counter=requests;const t=window.setTimeout(()=>void load(),0);const refresh=()=>void load();window.addEventListener('focus',refresh);const timer=window.setInterval(refresh,60000);return()=>{window.clearTimeout(t);window.clearInterval(timer);window.removeEventListener('focus',refresh);counter.current++;};},[load,profile?.id]);
  const summary=financeSummary(data,month,client,project);
  const clients=financeClients(data);
  const openingPeriod=!client&&!project?data.opening_periods?.find(p=>p.month.slice(0,7)===month):undefined;
  const byClient=clients.filter(([id])=>!client||id===client).map(([id,name])=>({id,name,...financeSummary(data,month,id,project)}));
  const editable=data.projects.filter(p=>p.can_edit);
  const value=(n:number)=>loading||error?'—':financeMoney(n);
  function edit(item:FinanceItem){setForm({...item,amount:Number(item.amount)});setNotice('');document.getElementById('finance-entry')?.scrollIntoView({behavior:'smooth',block:'start'});}
  async function save(event:React.FormEvent){
    event.preventDefault();setSaving(true);setNotice('');
    try{await saveProjectFinanceItem(form);setForm(blank(month));await load();setNotice('Saved. Sales now uses this project entry automatically.');}
    catch(e){setNotice(e instanceof Error?e.message:'Unable to save entry.');}
    finally{setSaving(false);}
  }
  async function exportCsv(){
    try{
      const fresh=await loadProjectFinance(mode);const filtered=financeSummary(financeForTeam(fresh,teamFilter),month,client,project);
      const lines=[['Month','Client','Project ID','Project','Type','Label','Amount (INR)'],
        ...filtered.projects.filter(p=>financeBookingMonth(p)===month).map(p=>[month,p.client_name,p.project_code,p.name,'Project rate','Base project rate',p.rate??'Not set']),
        ...filtered.openingSales.map(s=>[month,'Unallocated','','','Opening sales',s.category+' · Unattributed',s.amount]),
        ...filtered.items.map(i=>{const p=fresh.projects.find(p=>p.id===i.project_id)!;return[month,p.client_name,p.project_code,p.name,i.kind,i.label,i.amount];})];
      const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
      const a=document.createElement('a');a.href=url;a.download=`project-sales-${month}.csv`;a.click();URL.revokeObjectURL(url);
    }catch(e){setNotice(e instanceof Error?e.message:'Export failed.');}
  }
  if(mode==='sales'&&(!profile?.is_active||!['admin','director','manager','associate_lead','team_lead'].includes(profile.role)))return <section className="finance-card" role="alert"><h1>Sales access restricted</h1><p>Sales is available to Admin, Directors, Managers and the Project Coordinator team’s Associate Lead. Project coordinators can manage their assigned project charges and costs from Projects.</p></section>;
  return <div className="finance-page">
    {mode==='sales'&&<header className="finance-hero"><div><p className="finance-eyebrow">STUDIO FINANCE · INR</p><h1>Work into revenue.</h1><p>Every client. Every project. One clear view.</p></div><div className="finance-hero-icon"><BarChart3 size={36}/></div></header>}
    <div className="finance-toolbar"><div className="finance-filters">
      <label>Reporting month<input type="month" value={month} onChange={e=>{if(isFinanceMonth(e.target.value))setMonth(e.target.value);}}/></label>
      {mode==='sales'&&<label>Team<select value={teamFilter} onChange={e=>{setTeamFilter(e.target.value);setClient('');setProject('');}}><option value="">All teams</option>{rawData.teams?.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
      <label>Client<select value={client} onChange={e=>{setClient(e.target.value);setProject('');}}><option value="">All clients</option>{clients.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      <label>Project<select value={project} onChange={e=>setProject(e.target.value)}><option value="">All projects</option>{data.projects.filter(p=>!client||p.client_id===client).map(p=><option key={p.id} value={p.id}>{p.project_code} · {p.name}</option>)}</select></label>
    </div><div className="finance-actions"><button disabled={loading||saving} onClick={()=>void load()}><RefreshCw size={15}/>Refresh</button><button disabled={loading||!!error} onClick={()=>void exportCsv()}><Download size={15}/>Export</button></div></div>
    {error&&<p role="alert" className="finance-message">{error} <button onClick={()=>void load()}>Retry</button></p>}
    {notice&&<p role="status" className="finance-message">{notice}</p>}
    {loading&&<p role="status">Loading project finances…</p>}
    {mode==='sales'&&loaded?.userId===userId&&<EmployeeSalesReport projects={summary.projects} month={month}/>}
    {mode==='sales'&&<h2 className="finance-company-heading">Company revenue · {month}</h2>}
    <div className="finance-stats">{[
      {label:'Completed sales',amount:summary.revenue,icon:ArrowUpRight,note:'Opening sales + completed project rates + eligible charges'},
      {label:'Company expenses',amount:summary.expenses,icon:ArrowDownLeft,note:'One-time and monthly costs'},
      {label:'Net after expenses',amount:summary.net,icon:Wallet,note:'Completed sales less entered expenses'},
    ].map((stat,index)=><article key={stat.label} className={index===0?'finance-stat is-primary':'finance-stat'}><div><span>{stat.label}</span><stat.icon size={19}/></div><strong>{value(stat.amount)}</strong><p>{stat.note}</p></article>)}</div>
    {mode==='sales'&&!loading&&!error&&(summary.openingSales.length>0||openingPeriod)&&<section className="finance-card">
      <div className="finance-card-heading"><div><p className="finance-chart-kicker">OPENING SALES · {month}</p><h2>{financeMoney(summary.openingRevenue)} · Unattributed</h2><p>Historical totals only. Client and daily details are pending; individual tracking starts 14 October 2026.</p></div></div>
      {openingPeriod&&<div className="finance-opening-target"><strong>Company target {financeMoney(Number(openingPeriod.target))}</strong><span>{financeMoney(Math.max(0,Number(openingPeriod.target)-summary.revenue))} remaining · {(Number(openingPeriod.target)>0?summary.revenue/Number(openingPeriod.target)*100:0).toFixed(2)}% achieved</span><progress aria-label="Company sales target progress" value={Math.min(summary.revenue,Number(openingPeriod.target))} max={Number(openingPeriod.target)||1}/></div>}
      <div className="finance-table-scroll"><table><thead><tr><th>Category</th><th>Team</th><th>Salesperson</th><th>Opening amount</th></tr></thead><tbody>{summary.openingSales.map(s=><tr key={s.category}><td>{s.category}</td><td>{s.team_name}</td><td>Unattributed</td><td>{financeMoney(Number(s.amount))}</td></tr>)}</tbody></table></div>
      <p className="finance-chart-note">Opening sales count once in October. They are excluded from client/project filters until their details are confirmed.</p>
    </section>}
    {!loading&&!error&&summary.unpriced>0&&<p className="finance-message">{summary.unpriced} project(s) completed this month have no rate. Their revenue is not yet included. Add the rate through Edit project.</p>}
    {mode==='sales'&&!loading&&!error&&<ProjectFinanceCharts data={data} month={month} client={client} project={project} onClient={id=>{setClient(id);setProject('');}}/>}
    <p className="finance-explanation">Team filters show whole amounts for linked projects; shared projects can appear in multiple teams. The base project rate counts once, in its completion month (IST). Additional charges increase revenue; expenses reduce net. Monthly entries apply from the start month through the optional end month, inclusive. Sales require the coordinator to mark the project Completed. Sales do not confirm payment collection. Task counts never multiply revenue.</p>
    {mode==='costs'&&editable.length>0&&<section className="finance-card" id="finance-entry"><div className="finance-card-heading"><div><h2>{form.id?'Edit financial entry':'Assign project charges & costs'}</h2><p>Keep the base rate on the project. Enter only additional charges or expenses here.</p></div></div>
      <form onSubmit={e=>void save(e)} className="finance-entry-form"><fieldset disabled={saving||loading}>
        <label>Project<select required value={form.project_id} disabled={!!form.id} onChange={e=>setForm({...form,project_id:e.target.value})}><option value="">Choose a project</option>{editable.map(p=><option key={p.id} value={p.id}>{p.project_code} · {p.name}</option>)}</select></label>
        <label>Service / cost name<input required maxLength={120} placeholder="Shoot Actuals, Social Media…" value={form.label} onChange={e=>setForm({...form,label:e.target.value})}/></label>
        <label>Type<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value as FinanceInput['kind']})}><option value="charge">Client charge · adds revenue</option><option value="expense">Company expense · reduces net</option></select></label>
        <label>Amount (INR)<input required type="number" min="0" max="9999999999.99" step="0.01" value={Number.isFinite(form.amount)?form.amount:""} onChange={e=>setForm({...form,amount:e.target.value===''?Number.NaN:Number(e.target.value)})}/></label>
        <label>Frequency<select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value as FinanceInput['frequency'],end_month:null})}><option value="once">One time</option><option value="monthly">Monthly</option></select></label>
        <label>{form.frequency==='monthly'?'Start month':'Booking month'}<input type="month" required value={form.start_month.slice(0,7)} onChange={e=>setForm({...form,start_month:e.target.value+'-01'})}/></label>
        {form.frequency==='monthly'&&<label>End month · optional<input type="month" min={form.start_month.slice(0,7)} value={form.end_month?.slice(0,7)??''} onChange={e=>setForm({...form,end_month:e.target.value?e.target.value+'-01':null})}/></label>}
        <label className="finance-notes">Notes<textarea maxLength={2000} rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
      </fieldset><div className="finance-actions"><button className="finance-primary-button" disabled={saving||loading} type="submit">{saving?'Saving…':form.id?'Save changes':'Add entry'}</button>{form.id&&<button type="button" disabled={saving} onClick={()=>setForm(blank(month))}>Cancel edit</button>}</div></form>
    </section>}
    {mode==='costs'&&!loading&&!error&&!editable.length&&<p className="finance-message">Create a project first, or ask for coordinator access to an existing project. Sales accounts can view finance data; only authorized project managers can change costs.</p>}
    {!loading&&!error&&<>
    <section className="finance-card"><div className="finance-card-heading"><h2>Client summary</h2><span>Selected month</span></div><div className="finance-table-scroll"><table><thead><tr>{['Client','Base project rates','Additional charges','Revenue','Expenses','Net'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{byClient.map(c=><tr key={c.id}><td>{c.name}</td><td>{financeMoney(c.projectRevenue)}</td><td>{financeMoney(c.charges)}</td><td>{financeMoney(c.revenue)}</td><td>{financeMoney(c.expenses)}</td><td>{financeMoney(c.net)}</td></tr>)}</tbody></table>{!byClient.length&&<p className="finance-table-empty">No client projects yet.</p>}</div></section>
    {mode==='sales'&&<EmployeeSalesCredits projects={summary.projects}/>}
    <section className="finance-card"><div className="finance-card-heading"><h2>Project rates</h2><span>One rate per project</span></div><div className="finance-table-scroll"><table><thead><tr>{['Project ID','Client / project','Base rate','Booking month','Status',''].map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{summary.projects.map(p=><tr key={p.id}><td className="finance-code">{p.project_code}</td><td>{p.client_name}<small>{p.name}</small></td><td>{p.rate==null?'Not set':financeMoney(Number(p.rate))}</td><td>{financeBookingMonth(p)??'Not completed'}</td><td>{p.status.replaceAll('_',' ')}</td><td>{p.can_edit&&<Link to={`/projects?project=${p.id}`}>Project details →</Link>}</td></tr>)}</tbody></table>{!summary.projects.length&&<p className="finance-table-empty">No projects match these filters.</p>}</div></section>
    <section className="finance-card"><div className="finance-card-heading"><h2>Charges & expenses</h2><span>{summary.items.length} active entries in {month}</span></div><div className="finance-table-scroll"><table><thead><tr>{['Project ID','Service / cost','Type','Amount','Frequency','Period','Created by / time',''].map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{summary.items.map(i=>{const p=data.projects.find(p=>p.id===i.project_id)!;return<tr key={i.id}><td className="finance-code">{p.project_code}</td><td>{i.label}<small>{i.notes}</small></td><td><span className="finance-kind">{i.kind==='charge'?'Client charge':'Expense'}</span></td><td>{financeMoney(Number(i.amount))}</td><td>{i.frequency==='once'?'One time':'Monthly'}</td><td>{i.start_month.slice(0,7)}{i.frequency==='monthly'?` → ${i.end_month?.slice(0,7)??'ongoing'}`:''}</td><td>{i.creator_name}<small>{displayTime(i.created_at)}</small></td><td>{mode==='costs'&&p.can_edit&&<button onClick={()=>edit(i)}>Edit</button>}</td></tr>;})}</tbody></table>{!summary.items.length&&<p className="finance-table-empty">No additional charges or expenses for this month.</p>}</div></section></>}
  </div>;
}
