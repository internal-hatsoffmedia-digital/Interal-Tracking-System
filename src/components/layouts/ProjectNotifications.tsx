import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadProjectNotifications, readProjectNotification } from '../../services/projects/projectAccess.service';
import { getProjectById } from '../../services/projects/projects.service';
import {supabase} from '../../lib/supabase';
import type { ProjectNotification } from '../../types/projectAccess';

export default function ProjectNotifications() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [open,setOpen] = useState(false);
  const [rows,setRows] = useState<ProjectNotification[]>([]);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);
  const requests = useRef(0);
  const load = useCallback(async () => {
    const request = ++requests.current;
    setLoading(true);setError('');
    try { const data = await loadProjectNotifications(); if(request===requests.current)setRows(data); }
    catch(e) { if(request===requests.current){setRows([]);setError(e instanceof Error ? e.message : 'Unable to load notifications');} }
    finally { if(request===requests.current)setLoading(false); }
  }, []);
  useEffect(()=>{
    const counter=requests;
    const initial=window.setTimeout(()=>void load(),0);
    const timer=window.setInterval(()=>void load(),15000);
    const channel=supabase.channel('workspace-notifications-'+profile?.id)
      .on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:'user_id=eq.'+profile?.id},()=>void load())
      .on('postgres_changes',{event:'*',schema:'public',table:'project_notifications'},()=>void load()).subscribe();
    const focus=()=>void load();window.addEventListener('focus',focus);
    return ()=>{void supabase.removeChannel(channel);window.removeEventListener('focus',focus);window.clearTimeout(initial);window.clearInterval(timer);counter.current++;};
  },[load,profile?.id]);
  async function visit(row:ProjectNotification) {
    try {
      if(row.entity_type==='task') {
        const r=await supabase.from('tasks').select('id').eq('id',row.project_id).maybeSingle();
        if(r.error)throw new Error(r.error.message);
        if(!r.data)throw new Error('This task is no longer accessible.');
        await readProjectNotification(row.id,'task');setOpen(false);await load();navigate('/my-work');return;
      }
      if(row.entity_type==='sales_lead') {
        const r=await supabase.from('sales_leads').select('id').eq('id',row.project_id).maybeSingle();
        if(r.error)throw new Error(r.error.message);
        if(!r.data){await load();throw new Error('This sales lead is no longer accessible.');}
        await readProjectNotification(row.id,row.entity_type);setOpen(false);await load();navigate(`/sales?lead=${row.project_id}`);return;
      }
      if (!await getProjectById(row.project_id)) { await load(); throw new Error('This project is no longer accessible.'); }
      await readProjectNotification(row.id);setOpen(false);await load();navigate(`/projects?project=${row.project_id}`);
    } catch(e) { setError(e instanceof Error ? e.message : 'Unable to open project'); }
  }
  return <div className="relative"><button type="button" aria-label="Project notifications" aria-expanded={open} onClick={()=>{setOpen(!open);if(!open)void load();}} className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100"><Bell size={19}/>{rows.some(r=>!r.read_at) && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500"/>}</button>
    {open && <section aria-label="Notifications" className="absolute right-0 top-12 z-40 max-h-[70vh] w-80 max-w-[85vw] overflow-y-auto rounded-xl border bg-white p-4 shadow-xl"><div className="mb-3 flex justify-between"><h2 className="font-semibold">Notifications</h2><button aria-label="Close notifications" onClick={()=>setOpen(false)}>×</button></div><p className="mb-2 text-xs text-slate-500">Latest 100 accessible notifications</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}<button className="ml-2 underline" onClick={()=>void load()}>Retry</button></p>}
      {loading ? <p>Loading…</p> : !error && rows.length===0 ? <p className="text-sm text-slate-500">No notifications.</p> : rows.map(row=><div key={row.id} className={`border-t py-3 ${row.read_at?'':'bg-amber-50'}`}><button className="w-full px-2 text-left text-sm" onClick={()=>void visit(row)}>{row.message}<span className="block text-xs text-slate-500">{new Date(row.created_at).toLocaleString()}</span></button>{!row.read_at && <button className="px-2 text-xs underline" onClick={()=>{void readProjectNotification(row.id,row.entity_type).then(()=>load()).catch(e=>setError(String(e.message)));}}>Mark read</button>}</div>)}
    </section>}
  </div>;
}
