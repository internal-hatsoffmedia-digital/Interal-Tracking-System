import {useCallback,useEffect,useRef,useState} from 'react';
import {Pause,Play,Square,Timer} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {supabase} from '../../lib/supabase';
import {studioDay} from '../../lib/dashboardCelebrations';
import {durationClock,timerSeconds,workTime} from '../../lib/workTimer';
import './workTimer.css';
type Session={id:string;project_id:string;project_name?:string;assignment_id:string|null;task_title?:string|null;started_at:string;ended_at:string|null;seconds:number;end_reason:string|null};
type TimerData={day:string;server_now:string;projects:{id:string;name:string;code:string}[];assignments:{id:string;project_id:string;title:string;committed_at:string|null;deadline_at:string|null}[];running:Session|null;sessions:Session[]};
export default function WorkTimer(){
 const {profile}=useAuth();const user=profile?.id??'';
 const [loaded,setLoaded]=useState<{user:string;data:TimerData;received:number}|null>(null);
 const [project,setProject]=useState(''),[assignment,setAssignment]=useState(''),[day,setDay]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[tick,setTick]=useState(()=>Date.now());const request=useRef(0);
 const current=loaded?.user===user?loaded:null,data=current?.data;
 const load=useCallback(async()=>{const n=++request.current;const r=await supabase.rpc('workspace_work_timer_data',{p_day:day||null});if(n!==request.current)return;if(r.error){setError(r.error.message.includes('schema cache')?'Work timing is being set up. Your assigned tasks remain available below.':r.error.message);return;}setError('');setLoaded({user,data:r.data as TimerData,received:Date.now()});},[day,user]);
 useEffect(()=>{const counter=request,initial=setTimeout(()=>void load(),0),poll=setInterval(()=>void load(),15000),clock=setInterval(()=>setTick(Date.now()),1000);const refresh=()=>void load();window.addEventListener('focus',refresh);return()=>{clearTimeout(initial);clearInterval(poll);clearInterval(clock);window.removeEventListener('focus',refresh);counter.current++;};},[load]);
 const running=data?.running;
 const projectId=running?.project_id||(data?.projects.some(p=>p.id===project)?project:data?.projects[0]?.id)||'';
 const assignmentId=running?(running.assignment_id??''):assignment;
 const selected=data?.assignments.find(a=>a.id===assignmentId);
 const serverClock=current?Date.parse(current.data.server_now)+Math.max(0,tick-current.received):tick;
 const studioToday=studioDay(new Date(serverClock));
 const runningEnd=running?Math.min(serverClock,Date.parse(studioDay(new Date(running.started_at))+'T00:00:00+05:30')+86400000):serverClock;
 const activeSeconds=running?timerSeconds(running.started_at,new Date(runningEnd).toISOString()):0;
 const extra=running&&data?.day===studioToday&&current?Math.max(0,(runningEnd-Date.parse(data.server_now))/1000):0;
 const total=(data?.sessions.reduce((n,s)=>n+Number(s.seconds),0)??0)+extra;
 async function control(action:'start'|'pause'|'finish'){
   setBusy(true);setError('');if(running){setProject(running.project_id);setAssignment(running.assignment_id??'');}
   try{const r=await supabase.rpc('workspace_work_timer',{p_action:action,p_project:projectId||null,p_assignment:assignmentId||null,p_session:running?.id??null});if(r.error)throw r.error;await load();}
   catch(e){setError(e instanceof Error?e.message:typeof e==='object'&&e&&'message' in e?String(e.message):'Timer could not update.');}finally{setBusy(false);}
 }
 return <section className="my-work-timer" aria-label="My project work timer"><header><div><span className="work-timer-eyebrow">FOCUS TIME · BREAKS EXCLUDED</span><h2><Timer size={20}/>Your work clock</h2><p>Choose assigned work, start when you begin, and pause whenever you take a break.</p></div><div className="work-timer-total"><span>{data?.day??studioToday} · logged time</span><strong>{durationClock(total)}</strong></div></header>
 {error&&<p className="work-timer-error" role="alert">{error}</p>}
 <div className="work-timer-controls"><label>Assigned project<select disabled={busy||!!running} value={projectId} onChange={e=>{setProject(e.target.value);setAssignment('');}}>{!data?.projects.length&&<option value="">No assigned projects</option>}{data?.projects.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label><label>Task · choose to track task hours<select disabled={busy||!!running} value={assignmentId} onChange={e=>setAssignment(e.target.value)}><option value="">Project only · no task selected</option>{data?.assignments.filter(a=>a.project_id===projectId).map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select></label><div className="work-timer-clock"><strong>{durationClock(activeSeconds)}</strong><span>{running?'Running':'Paused / ready'}</span></div><div className="work-timer-buttons">{running?<><button disabled={busy} onClick={()=>void control('pause')}><Pause size={16}/>Pause for break</button><button disabled={busy} onClick={()=>void control('finish')}><Square size={15}/>Finish session</button></>:<button className="work-timer-start" disabled={busy||!data||!!error||!projectId} onClick={()=>void control('start')}><Play size={16}/>Start / resume</button>}</div></div>
 {selected&&<p className="work-timer-commitment">{selected.committed_at?`Committed completion: ${workTime(selected.committed_at)}`:selected.deadline_at?`Original deadline: ${workTime(selected.deadline_at)} · no agreed commitment recorded`:'No committed completion time recorded for this assignment.'}</p>}
 <p className="work-timer-note">One running timer at a time. Refreshing keeps it running. Timers stop at midnight IST; start a new session on the next day. Finishing a timer saves time; submit finished tasks using Complete.</p>
 <div className="work-timer-day"><h3>Daily work log</h3><label>Review date (IST)<input type="date" max={studioToday} value={day||studioToday} onChange={e=>setDay(e.target.value)}/></label></div>
 <div className="work-timer-sessions">{data?.sessions.map(s=><article key={s.id}><div><strong>{s.project_name}</strong><span>{s.task_title||'Project work'}</span></div><div><span>{workTime(s.started_at)} → {s.end_reason?workTime(s.ended_at!):'Running'}</span><strong>{durationClock(Number(s.seconds)+(running?.id===s.id?extra:0))}</strong></div></article>)}{data&&!data.sessions.length&&<p>No timed work on this date.</p>}</div>
 </section>;
}
