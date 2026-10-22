import {useCallback,useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {useAuth} from '../../context/AuthContext';
import {projectStatusLabel} from '../../lib/projectMetrics';
type Work={id:string;code:string;name:string;client:string;status:string;submitted_at:string|null};
export default function MyProjectSubmissions(){
 const {profile}=useAuth();const [rows,setRows]=useState<Work[]>([]);const [error,setError]=useState('');const [busy,setBusy]=useState('');
 const load=useCallback(async()=>{const r=await supabase.rpc('my_project_submissions');if(r.error)setError(r.error.message);else{setRows(r.data??[]);setError('');}},[]);
 useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>clearTimeout(timer);},[load,profile?.id]);
 async function submit(id:string){setBusy(id);const r=await supabase.rpc('submit_project_work',{p_project:id});if(r.error)setError(r.error.message);else await load();setBusy('');}
 return <section className="desk-card" aria-label="My project submissions"><h2>My projects</h2><p className="desk-muted">Finished your project work? Send it to your coordinator for review. Only the coordinator can send it to Internal QC. Your coordinator confirms final completion and the employee sales credit.</p>{error&&<p role="alert">{error}</p>}<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Project / client','Status','Your submission','Action'].map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr className="border-t" key={r.id}><td className="p-3"><strong>{r.code} · {r.name}</strong><small className="block">{r.client}</small></td><td className="p-3">{projectStatusLabel(r.status)}</td><td className="p-3">{r.submitted_at?new Date(r.submitted_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}):'Not submitted'}</td><td className="p-3">{['planning','in_progress','on_hold','client_correction'].includes(r.status)?<button className="desk-primary" disabled={!!busy} onClick={()=>void submit(r.id)}>{busy===r.id?'Submitting…':'Work complete · send to coordinator'}</button>:r.status==='completed'?'Completed':r.status==='awaiting_coordinator'?'Waiting for coordinator to send to QC':'With reviewer / coordinator'}</td></tr>)}</tbody></table>{!rows.length&&!error&&<p>No linked project work yet.</p>}</div></section>;
}
