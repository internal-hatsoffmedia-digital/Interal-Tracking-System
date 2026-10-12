import {useId,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {financeClients,financeMoney,financeSummary,trailingFinanceMonths} from '../../lib/projectFinanceMetrics';
import type {ProjectFinanceData} from '../../types/projectFinance';

const shortMoney=(n:number)=>new Intl.NumberFormat('en-IN',{notation:'compact',maximumFractionDigits:1}).format(n);
const monthLabel=(m:string)=>new Date(m+'-01T00:00:00Z').toLocaleDateString('en-IN',{month:'short',year:'2-digit',timeZone:'UTC'});
export default function ProjectFinanceCharts({data,month,client,project,onClient}:{data:ProjectFinanceData;month:string;client:string;project:string;onClient:(id:string)=>void}){
  const gradient=useId();
  const [selected,setSelected]=useState<string|null>(null);
  const trend=trailingFinanceMonths(month).map(m=>({month:m,...financeSummary(data,m,client,project)}));
  const summary=financeSummary(data,month,client,project);
  const clients=financeClients(data).filter(([id])=>!client||id===client).map(([id,name])=>({id,name,...financeSummary(data,month,id,project)})).sort((a,b)=>b.revenue-a.revenue||a.name.localeCompare(b.name));
  const max=Math.max(1,...trend.flatMap(t=>[t.revenue,t.expenses]));
  const x=(i:number)=>60+i*106;
  const y=(n:number)=>210-n/max*160;
  const path=(key:'revenue'|'expenses')=>trend.map((t,i)=>`${i?'L':'M'}${x(i)},${y(t[key])}`).join(' ');
  const active=trend.find(t=>t.month===selected)??trend[5];
  const chargeShare=summary.revenue?summary.charges/summary.revenue*100:0;
  const baseShare=summary.revenue?summary.projectRevenue/summary.revenue*100:0;
  return <div className="finance-diagrams">
    <section className="finance-card finance-line-card">
      <div className="finance-card-heading"><div><p className="finance-chart-kicker">PERFORMANCE OVER TIME</p><h2>Revenue & expenses</h2></div><span>Six months · INR</span></div>
      <div className="finance-chart-readout"><strong>{financeMoney(active.revenue)}</strong><span>{monthLabel(active.month)} revenue · {financeMoney(active.expenses)} expenses</span></div>
      <svg className="finance-line-chart" viewBox="0 0 650 250" role="img" aria-label="Six-month revenue and expense trend. Select a month below for exact amounts.">
        <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffcc00" stopOpacity=".35"/><stop offset="100%" stopColor="#ffcc00" stopOpacity="0"/></linearGradient></defs>
        {[0,.5,1].map(v=><g key={v}><line x1="60" x2="590" y1={y(max*v)} y2={y(max*v)} className="finance-gridline"/><text x="48" y={y(max*v)+4} textAnchor="end">{!trend.some(t=>t.revenue||t.expenses)?(v===0?'₹0':''):`₹${shortMoney(max*v)}`}</text></g>)}
        <path d={`${path('revenue')} L590,210 L60,210 Z`} fill={`url(#${gradient})`}/>
        <path d={path('expenses')} className="finance-expense-line"/><path d={path('revenue')} stroke="#ffcc00" strokeWidth="4" fill="none" strokeLinejoin="round"/>
        {trend.map((t,i)=><g key={t.month}><circle cx={x(i)} cy={y(t.revenue)} r="5" fill="#ffcc00"/><text x={x(i)} y="238" textAnchor="middle">{monthLabel(t.month)}</text></g>)}
      </svg>
      <div className="finance-chart-months" aria-label="Explore monthly amounts">{trend.map(t=><button key={t.month} aria-pressed={active.month===t.month} onClick={()=>setSelected(t.month)}>{monthLabel(t.month)}</button>)}</div>
      <div className="finance-chart-legend"><span><i/>Completed sales</span><span><i/>Company expenses</span></div>
      {!trend.some(t=>t.revenue||t.expenses)&&<p className="finance-chart-note">No financial activity in this period. Project rates and cost entries will build this chart automatically.</p>}
    </section>
    <section className="finance-card finance-composition"><div className="finance-card-heading"><div><p className="finance-chart-kicker">REVENUE MIX</p><h2>What brings revenue</h2></div></div>
      <div className="finance-donut" role="img" aria-label={`Base project rates ${financeMoney(summary.projectRevenue)}, additional charges ${financeMoney(summary.charges)}, opening sales ${financeMoney(summary.openingRevenue)}`} style={{background:summary.revenue?`conic-gradient(#ffcc00 0 ${baseShare}%, #fff7cc ${baseShare}% ${baseShare+chargeShare}%, #111 ${baseShare+chargeShare}% 100%)`:'conic-gradient(#e5e5e5 0 100%)'}}><div><span>Completed sales</span><strong>{financeMoney(summary.revenue)}</strong><small>{summary.revenue?'Selected month':'No revenue booked yet'}</small></div></div>
      <div className="finance-mix-row"><span><i/>Base project rates</span><strong>{financeMoney(summary.projectRevenue)}</strong></div><div className="finance-mix-row"><span><i/>Additional charges</span><strong>{financeMoney(summary.charges)}</strong></div>
      <div className="finance-mix-row"><span>Opening sales · Unattributed</span><strong>{financeMoney(summary.openingRevenue)}</strong></div>
      <p className="finance-chart-note">Opening sales have no client allocation yet. One project rate, counted once. Additional client charges are shown separately.</p>
    </section>
    <section className="finance-card finance-ranking"><div className="finance-card-heading"><div><p className="finance-chart-kicker">CLIENT PORTFOLIO</p><h2>Revenue by client</h2></div><span>{clients.length} clients · select to filter</span></div>
      {!clients.length?<p className="finance-chart-note">No clients available to your account.</p>:<div className="finance-ranking-list">{clients.map((c,i)=><button key={c.id} onClick={()=>onClient(c.id)} aria-label={`Filter ${c.name}, revenue ${financeMoney(c.revenue)}`}><span className="finance-ranking-number">{String(i+1).padStart(2,'0')}</span><div><span>{c.name}</span><span className="finance-bar-track"><span style={{width:`${c.revenue/Math.max(1,...clients.map(v=>v.revenue))*100}%`}}/></span><small>{c.projects.length} {c.projects.length===1?'project':'projects'}{!c.revenue?' · No revenue booked this month':''}</small></div><strong>{financeMoney(c.revenue)}</strong><ArrowUpRight size={16}/></button>)}</div>}
    </section>
  </div>;
}
