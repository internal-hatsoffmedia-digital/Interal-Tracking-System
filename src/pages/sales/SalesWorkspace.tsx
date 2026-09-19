import {useCallback,useEffect,useRef,useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {csvCell} from '../../lib/projectMetrics';
import {loadSales,SalesSetupError} from '../../services/sales/sales.service';
import type {SalesData,SalesLead} from '../../types/sales';
import SalesTracker from './SalesTracker';
import SalesEditor,{SalesManagement} from './SalesEditor';
import {useSearchParams} from 'react-router-dom';

export default function SalesWorkspace() {
  const {profile}=useAuth();
  const [params,setParams]=useSearchParams();
  const [data,setData]=useState<SalesData|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [missing,setMissing]=useState(false);
  const [editing,setEditing]=useState<SalesLead|null|undefined>(undefined);
  const requests=useRef(0);

  const isMuskan = profile?.email?.toLowerCase() === 'muskan@hatsoffmedia.in' || profile?.full_name?.toLowerCase().includes('muskan');

  const load=useCallback(async()=>{
    if (isMuskan) {
      setLoading(false);
      return;
    }
    const n=++requests.current;setLoading(true);
    try{const r=await loadSales();if(n===requests.current){setData(r);setError('');setMissing(false);}}
    catch(e){if(n===requests.current){setData(null);setMissing(e instanceof SalesSetupError);setError(e instanceof Error?e.message:'Sales could not be loaded');}}
    finally{if(n===requests.current)setLoading(false);}
  },[isMuskan]);

  useEffect(()=>{
    if (isMuskan) return;
    const counter=requests;const t=window.setTimeout(()=>void load(),0);return()=>{window.clearTimeout(t);counter.current++;};
  },[load,profile?.id,isMuskan]);

  if (isMuskan) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Access Restricted</h2>
        <p className="mt-2 text-sm text-slate-500">
          Sales & Marketing workspace is restricted for Flow Force Lead accounts.
        </p>
      </div>
    );
  }

  const canEdit=data && ['admin','manager','member'].includes(data.access ?? '');
  const selectedLead=editing!==undefined ? editing : data?.leads.find(l=>l.id===params.get('lead'));
  const closeEditor=()=>{setEditing(undefined);if(params.has('lead')){const next=new URLSearchParams(params);next.delete('lead');setParams(next);}};

  async function exportRows() {
    try{
      const fresh=await loadSales();if(!fresh)throw new Error('Sales access is unavailable');
      const rows=[['Lead','Company','Owner','Source','Stage','Deal value','Follow-up'],...fresh.leads.map(l=>[l.name,l.company,l.ownerName,l.source,l.stage,l.revenue,l.nextFollowUp])];
      const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sales-leads.csv';a.click();URL.revokeObjectURL(url);
    }catch(e){setError(e instanceof Error?e.message:'Export failed');}
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap justify-end gap-2"><button className="rounded-lg border bg-white px-3 py-2 text-sm" disabled={loading} onClick={()=>void load()}>Refresh sales</button>
      {data && <button className="rounded-lg border bg-white px-3 py-2 text-sm" disabled={loading} onClick={()=>void exportRows()}>Export all accessible leads</button>}
      {canEdit && <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" onClick={()=>setEditing(null)}>Add lead</button>}</div>
    {loading ? <p role="status">Loading sales…</p> : <>
      {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}{missing && ' Apply the reviewed Sales Tracker migration to activate this workspace.'}</p>}
      {!data && !error ? <p className="rounded-xl border bg-white p-5">Sales access has not been granted to this account. An administrator can configure access in Sales Tracker.</p> : <SalesTracker data={data} onEdit={data?p=>setEditing(p):undefined}/>}
      {data && params.has('lead') && !selectedLead && editing===undefined && <p role="alert">This lead is unavailable or you no longer have access.</p>}
      {data && ['admin','manager'].includes(data.access ?? '') && <SalesManagement data={data} onSaved={load}/>}
    </>}
    {data && selectedLead!==undefined && <SalesEditor key={selectedLead?.id ?? 'new'} lead={selectedLead} data={data} onClose={closeEditor} onSaved={async()=>{closeEditor();await load();}}/>}
  </div>;
}
