import {salesChartMembers} from '../../lib/salesChartConfig';
import {salesChartWins} from '../../lib/salesChartMetrics';
import {useState} from 'react';
import type {SalesData} from '../../types/sales';
import {salesSources} from '../../lib/salesMetrics';
const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
function Bars({title,rows}:{title:string;rows:{label:string;value:number}[]}){
 const max=Math.max(1,...rows.map(r=>r.value));
 return <section className="rounded-2xl border bg-white p-5"><h2 className="mb-5 font-semibold">{title}</h2><div className="space-y-5">{rows.map(r=><div key={r.label}><div className="mb-2 flex justify-between gap-4 text-sm"><span>{r.label}</span><strong>{money(r.value)}</strong></div><div className="h-4 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className="h-full rounded-full" style={{width:(r.value/max*100)+'%',background:'#ffcc00'}}/></div></div>)}</div></section>;
}
export default function SalesCharts({data,month}:{data:SalesData;month:string}){
 const [person,setPerson]=useState('');
 const won=salesChartWins(data.leads,salesChartMembers,month);
 const selected=salesChartWins(data.leads,salesChartMembers,month,person);
 const total=won.reduce((s,l)=>s+l.revenue,0);const target=data.monthlyTargets[month];
 if(!salesChartMembers.length)return <p role="status" className="rounded-2xl border bg-white p-5">Sales charts require verified profile IDs for Harish and Abinaya. Existing sales records remain available below.</p>;
 return <div className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-semibold">Sales achievement · Harish & Abinaya</h2><p className="mt-1 text-sm text-slate-500">Won deal value in {month}. Booked sales, not collected payments or profit.</p></div><label className="grid gap-2 text-sm">Sales member<select aria-label="Sales chart member" className="border bg-white px-4 py-2" value={person} onChange={e=>setPerson(e.target.value)}><option value="">All sales members</option>{salesChartMembers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label></div>
 <div className="grid gap-4 lg:grid-cols-2"><Bars title="Achieved sales by member" rows={salesChartMembers.map(member=>({label:member.name,value:won.filter(l=>l.ownerId===member.id).reduce((s,l)=>s+l.revenue,0)}))}/><Bars title="Sales sources · selected member" rows={salesSources.map(source=>({label:source,value:selected.filter(l=>l.source===source).reduce((s,l)=>s+l.revenue,0)}))}/></div>
 <section className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">Team target achievement</h2><p className="my-3 text-sm">{money(total)} achieved / {target>0?money(target)+' shared target':'Target not set'}{target>0?' · '+(total/target*100).toFixed(1)+'%':''}</p>{target>0&&<div className="h-4 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className="h-full bg-[#ffcc00]" style={{width:Math.min(100,total/target*100)+'%'}}/></div>}<p className="mt-3 text-xs text-slate-500">Shared monthly target; individual targets are not configured. Charts include accessible records owned by Harish and Abinaya.</p></section>
 <section className="rounded-2xl border bg-white p-5"><h2 className="mb-4 font-semibold">Won project / deal amounts · selected member</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Project / deal','Client','Sales member','Source','Won date','Achieved amount'].map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{selected.map(l=><tr className="border-t" key={l.id}><td className="p-3">{l.name}</td><td className="p-3">{l.company}</td><td className="p-3">{l.ownerName}</td><td className="p-3">{l.source}</td><td className="p-3">{l.wonOn}</td><td className="p-3 font-semibold">{money(l.revenue)}</td></tr>)}</tbody></table></div>{!selected.length&&<p className="py-4 text-sm text-slate-500">No won sales recorded for this member and month.</p>}</section></div>;
}
