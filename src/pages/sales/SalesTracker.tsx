import {salesChartMembers} from '../../lib/salesChartConfig';
import SalesCharts from './SalesCharts';
import { useState } from 'react';
import { ArrowRight, CalendarDays, Megaphone, Phone, Target, Users } from 'lucide-react';
import type { SalesData, SalesLead } from '../../types/sales';
import { followUpGroup, salesSources, salesSummary, sourceChannels } from '../../lib/salesMetrics';
import { todayLocal } from '../../lib/projectMetrics';

const sections=['Control Center','Lead Master','Prospects','Follow-ups','Conversions','Team Performance'] as const;
const card='rounded-2xl border border-slate-200 bg-white p-5';
const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);

// No Supabase queries until the actual schema and sales permissions have been confirmed.
// `null` means disconnected, not an empty live dataset. Test fixtures are injected only by tests.
export default function SalesTracker({data=null,onEdit}: {data?:SalesData|null;onEdit?:(lead:SalesLead)=>void}) {
  const [section,setSection]=useState<typeof sections[number]>('Control Center');
  const [month,setMonth]=useState(todayLocal().slice(0,7));
  const [search,setSearch]=useState('');
  const [source,setSource]=useState('');
  const [channel,setChannel]=useState('');
  const [followUp,setFollowUp]=useState('');
  const summary=data ? salesSummary(data,month) : null;
  const today=todayLocal();
  const leads=(data?.leads ?? []).filter(l=>(!search || `${l.name} ${l.company} ${l.ownerName}`.toLowerCase().includes(search.toLowerCase())) &&
    (!source || l.source===source) &&
    (!channel || sourceChannels[l.source]===channel) &&
    (section!=='Prospects' || l.stage==='prospect' || l.stage==='proposal') &&
    (section!=='Conversions' || l.stage==='won') &&
    (section!=='Follow-ups' || (!!followUpGroup(l,today) && (!followUp || followUpGroup(l,today)===followUp))));
  const members=[...new Map([...(data?.people ?? []).filter(p=>p.access_level && p.access_level!=='viewer').map(p=>[p.id,p.full_name] as const),...(data?.leads ?? []).map(l=>[l.ownerId,l.ownerName] as const)]).entries()].filter(([id])=>salesChartMembers.some(m=>m.id===id));
  const manualActivities=data?.activities.filter(a=>a.kind!=='system') ?? [];
  const empty=<div className="py-10 text-center"><Target className="mx-auto mb-3 text-slate-300" size={28}/><p className="text-sm font-medium text-slate-700">{data?'No matching records':'Sales data is not connected yet'}</p><p className="mt-1 text-xs text-slate-500">{data?'Change the filters to see other records.':'Live records will appear after the database structure and access permissions are confirmed.'}</p></div>;
  const teamTable=<div className={card}><h2 className="mb-4 font-semibold">Team performance</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr>{['Member','Leads','Activity','Prospects','Won','Revenue'].map(h=><th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody>{members.map(([id,name])=>{
    const own=data!.leads.filter(l=>l.ownerId===id);const stats=salesSummary({...data!,leads:own},month);
    return <tr key={id} className="border-t border-slate-100"><td className="p-3 font-medium">{name}</td><td className="p-3">{stats.leads}</td><td className="p-3">{manualActivities.filter(a=>a.ownerId===id && a.occurredOn.startsWith(month)).length}</td><td className="p-3">{stats.prospects}</td><td className="p-3">{stats.won}</td><td className="p-3">{money(stats.revenue)}</td></tr>;
  })}</tbody></table></div>{!members.length && empty}</div>;
  return <div className="space-y-6">
    {onEdit && data && <label className="flex flex-wrap items-center gap-3 text-sm font-medium">Open lead details<select aria-label="Open lead details" className="max-w-full rounded-lg border bg-white px-3 py-2" value="" onChange={e=>{const lead=data.leads.find(l=>l.id===e.target.value);if(lead)onEdit(lead);}}><option value="">Select a lead to edit or log activity</option>{data.leads.map(l=><option key={l.id} value={l.id}>{l.name} · {l.company}</option>)}</select></label>}
    <header className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400">Hatsoff · Sales & Marketing</p><div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-3xl font-semibold tracking-tight">Sales Control Center</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Track outreach, manage your pipeline, and bring every follow-up into view.</p></div><label className="grid gap-2 text-xs text-slate-300">Reporting month<input aria-label="Reporting month" type="month" value={month} onChange={e=>setMonth(e.target.value || today.slice(0,7))} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white [color-scheme:dark]"/></label></div></header>
    {!data && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">Sales workspace prepared. Live data and editing will be available after the database connection and access permissions are confirmed.</p>}
    <nav aria-label="Sales sections" className="flex flex-wrap gap-2">{sections.map(s=><button key={s} aria-current={section===s?'page':undefined} onClick={()=>{setSection(s);setFollowUp('');setChannel('');setSource('');}} className={`rounded-xl px-4 py-2.5 text-sm font-medium ${section===s?'bg-slate-900 text-white':'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{s}</button>)}</nav>
    {section==='Control Center' ? <>
      <div className="grid gap-4 sm:grid-cols-3">{[{name:'Outbound',icon:Phone,desc:'Cold calls and direct messages'},{name:'Field',icon:Users,desc:'Visits and in-person outreach'},{name:'Campaigns',icon:Megaphone,desc:'Website and digital marketing'}].map(c=><button key={c.name} onClick={()=>{setSection('Lead Master');setChannel(c.name);setSource('');}} className={`${card} flex items-center gap-4 text-left hover:border-amber-400`}><c.icon className="shrink-0 text-amber-600" size={22}/><span className="flex-1"><strong className="block text-sm">{c.name}</strong><span className="text-xs text-slate-500">{c.desc}</span></span><ArrowRight size={16} className="text-slate-400"/></button>)}</div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[{label:'Leads',value:summary?.leads},{label:'Prospects',value:summary?.prospects},{label:'Proposals',value:summary?.proposals},{label:'Won',value:summary?.won}].map(s=><div key={s.label} className={card}><p className="text-xs text-slate-500">{s.label} · selected month</p><p className="mt-3 text-3xl font-semibold text-slate-900">{s.value ?? '—'}</p></div>)}</div>
      <div className="grid gap-4 sm:grid-cols-3">{[{label:'Revenue',value:summary?money(summary.revenue):'—'},{label:'Target',value:summary ? (summary.target!=null?money(summary.target):'Not set') : '—'},{label:'Achievement',value:summary?.achievement!=null?`${summary.achievement.toFixed(1)}%`:'—'}].map(s=><div key={s.label} className={card}><p className="text-xs text-slate-500">{s.label}</p><p className="mt-2 text-2xl font-semibold">{s.value}</p></div>)}</div>
      <section className={card}><h2 className="mb-4 flex items-center gap-2 font-semibold"><CalendarDays size={18}/> Follow-up queue</h2><div className="grid gap-3 sm:grid-cols-3">{['Overdue','Today','Upcoming'].map((s,i)=><button key={s} onClick={()=>{setSection('Follow-ups');setFollowUp(s);}} className={`rounded-xl p-4 text-left ${['bg-red-50 text-red-800','bg-amber-50 text-amber-800','bg-emerald-50 text-emerald-800'][i]}`}><span className="text-sm">{s}</span><strong className="mt-2 block text-2xl">{data?data.leads.filter(l=>followUpGroup(l,today)===s).length:'—'}</strong></button>)}</div></section>
      {data && <SalesCharts data={data} month={month}/>}
      {teamTable}
      <section className={card}><h2 className="mb-4 font-semibold">Lead source performance</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr>{['Source','Channel','Leads','Won','Conversion rate'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{salesSources.map(s=>{
        const cohort=data?.leads.filter(l=>l.source===s && l.createdOn.startsWith(month));const won=cohort?.filter(l=>l.stage==='won').length;
        return <tr key={s} className="border-t border-slate-100"><td className="p-3 font-medium">{s}</td><td className="p-3 text-slate-500">{sourceChannels[s]}</td><td className="p-3">{cohort?.length ?? '—'}</td><td className="p-3">{won ?? '—'}</td><td className="p-3">{cohort?`${cohort.length?Math.round(won!/cohort.length*100):0}%`:'—'}</td></tr>;
      })}</tbody></table></div></section>
      <p className="text-xs leading-5 text-slate-500">Monthly leads, prospects, and proposals use lead creation month and current stage. Won and revenue use conversion month. Source conversion rate uses the created-month cohort. Follow-ups span all open leads.</p>
    </> : section==='Team Performance' ? <>{data && <SalesCharts data={data} month={month}/>} {teamTable}</> : <section className={card}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{section}</h2><div className="flex flex-wrap gap-3"><input aria-label="Search sales leads" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search lead, company, or owner" className="min-w-0 rounded-lg border px-3 py-2 text-sm"/><select aria-label="Lead source" value={source} onChange={e=>setSource(e.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm"><option value="">All sources</option>{salesSources.map(s=><option key={s}>{s}</option>)}</select>{section==='Follow-ups' && <select aria-label="Follow-up timing" value={followUp} onChange={e=>setFollowUp(e.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm"><option value="">All follow-ups</option>{['Overdue','Today','Upcoming'].map(s=><option key={s}>{s}</option>)}</select>}</div></div>
      {channel && <p className="mb-3 text-sm text-slate-500">Channel: {channel} <button className="ml-2 underline" onClick={()=>setChannel('')}>Clear channel</button></p>}
      {leads.length?<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr>{['Lead / company','Owner','Source','Stage','Next follow-up','Revenue'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{leads.map(l=><tr key={l.id} className="border-t"><td className="p-3 font-medium">{l.name}<p className="text-xs font-normal text-slate-500">{l.company}</p></td><td className="p-3">{l.ownerName}</td><td className="p-3">{l.source}</td><td className="p-3 capitalize">{l.stage}</td><td className="p-3">{l.nextFollowUp ?? 'Not scheduled'}</td><td className="p-3">{l.stage==='won'?money(l.revenue):'—'}</td></tr>)}</tbody></table></div>:empty}
    </section>}
  </div>;
}
