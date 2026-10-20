import {useCallback,useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from '../../lib/supabase';
import {useAuth} from '../../context/AuthContext';
import './QC.css';
type Event={id:string;review_id:string;action:string;state:string;note:string|null;created_at:string;actor:string|null;project:string;code:string;client:string|null;task:string|null;reviewer:string|null};
const dateAt=(date:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const today=()=>dateAt(new Date());
export default function QCActivity({compact=false}:{compact?:boolean}){
 const {profile}=useAuth();const [from,setFrom]=useState(today);const [through,setThrough]=useState(today);const [rows,setRows]=useState<Event[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
 const request=useRef(0);
 const authorized=!!profile?.is_active&&['admin','director','manager'].includes(profile.role);
 const load=useCallback(async()=>{if(!authorized)return;const revision=++request.current;setLoading(true);const r=await supabase.rpc('qc_activity_data',{p_from:from,p_through:through});if(revision!==request.current)return;if(r.error){setRows([]);setError(r.error.message);}else{setRows(r.data as Event[]);setError('');}setLoading(false);},[authorized,from,through]);
 useEffect(()=>{const initial=window.setTimeout(()=>void load(),0);const interval=window.setInterval(()=>void load(),30000);return()=>{window.clearTimeout(initial);window.clearInterval(interval);};},[load]);
 if(!authorized)return compact?null:<p role="alert">QC Activity is available to Admin, Manager and Director.</p>;
 return <section className="qc-card qc-activity" aria-label="QC activity"><div className="qc-toolbar"><div style={{flex:1}}><h2 style={{fontSize:compact?20:30}}>QC Activity</h2><p>Review updates, corrections and approvals · IST</p></div>{compact?<Link to="/qc-activity">View all activity →</Link>:<><label>From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Through<input type="date" value={through} onChange={e=>setThrough(e.target.value)}/></label><button onClick={()=>{setFrom(today());setThrough(today());}}>Today</button><button onClick={()=>{const day=dateAt(new Date(Date.now()-86400000));setFrom(day);setThrough(day);}}>Yesterday</button><button disabled={loading} onClick={()=>void load()}>Refresh</button></>}</div>
 {error?<p role="alert">QC activity unavailable: {error}</p>:loading?<p>Loading activity…</p>:!rows.length?<p>No QC activity in this date range.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left',borderSpacing:'0 14px'}}><thead><tr>{['Time (IST)','Project / task','Updated by','Update','QC reviewer'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{(compact?rows.slice(0,5):rows).map(e=><tr key={e.id}><td>{new Date(e.created_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td><td><Link to={'/qc?review='+e.review_id}>{e.code} · {e.task||e.project}</Link><small style={{display:'block'}}>{e.client}</small></td><td>{e.actor||'System'}</td><td>{e.action} · {e.state.replaceAll('_',' ')}{e.note&&<p style={{whiteSpace:'pre-wrap',maxWidth:400}}>{e.note}</p>}</td><td>{e.reviewer||'Not claimed'}</td></tr>)}</tbody></table></div>}{!compact&&<p className="qc-help">Latest 1,000 events in the selected range. Existing review snapshots are labelled separately from new activity.</p>}</section>;
}
