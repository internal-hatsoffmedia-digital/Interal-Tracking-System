import {useCallback,useEffect,useRef,useState} from 'react';
import {BarChart3,Check,Plus,Vote} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import {useAuth} from '../../context/AuthContext';
import './workspacePolls.css';
type Poll={id:string;event_name:string;question:string;options:string[];counts:number[];my_option:number|null;created_at:string;closes_at:string|null;closed_at:string|null};
type PollData={active_accounts:number;polls:Poll[]};
const deadline=(value:string)=>new Date(value).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'})+' IST';
export default function WorkspacePolls(){
 const {profile}=useAuth();const userId=profile?.id??'',admin=profile?.role==='admin';
 const [loaded,setLoaded]=useState<{user:string;data:PollData}|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [editing,setEditing]=useState(false),[event,setEvent]=useState('Hatsoff Drive'),[question,setQuestion]=useState('Which topic would you like for our next session?');
 const [options,setOptions]=useState(['','','','','']),[closing,setClosing]=useState('');
 const [busy,setBusy]=useState(''),[now,setNow]=useState(()=>Date.now());const requests=useRef(0);
 const data=loaded?.user===userId?loaded.data:null;
 const load=useCallback(async()=>{
   const n=++requests.current;const r=await supabase.rpc('workspace_poll_data');
   if(n!==requests.current)return;
   if(r.error){setError('Polls are unavailable. Please refresh or ask Admin to check the poll setup.');return;}
   setError('');setLoaded({user:userId,data:r.data as PollData});
 },[userId]);
 useEffect(()=>{
   const counter=requests,initial=setTimeout(()=>void load(),0),timer=setInterval(()=>{setNow(Date.now());void load();},15000);
   const refresh=()=>{setNow(Date.now());void load();};window.addEventListener('focus',refresh);
   return()=>{clearTimeout(initial);clearInterval(timer);window.removeEventListener('focus',refresh);counter.current++;};
 },[load]);
 async function publish(e:React.FormEvent){
   e.preventDefault();setBusy('publish');setError('');setNotice('');
   const r=await supabase.rpc('workspace_create_poll',{p_event:event.trim(),p_question:question.trim(),p_options:options.map(o=>o.trim()),p_closes_at:closing?new Date(closing+':00+05:30').toISOString():null});
   if(r.error)setError(r.error.message);else{setEditing(false);setOptions(['','','','','']);setClosing('');setNotice('Poll published. Your colleagues can vote from their dashboards.');await load();}setBusy('');
 }
 async function vote(poll:string,option:number){
   setBusy(poll);setError('');setNotice('');
   const r=await supabase.rpc('workspace_vote_poll',{p_poll:poll,p_option:option});
   if(r.error)setError(r.error.message);else{setNotice('Your choice is saved. You can change it while voting is open.');await load();}setBusy('');
 }
 async function close(poll:string){
   setBusy(poll);setError('');setNotice('');const r=await supabase.rpc('workspace_close_poll',{p_poll:poll});
   if(r.error)setError(r.error.message);else{setNotice('Voting closed. Results remain available.');await load();}setBusy('');
 }
 function renderPoll(p:Poll,preview=false){
   const closed=!!p.closed_at||!!(p.closes_at&&new Date(p.closes_at).getTime()<=now),total=p.counts.reduce((s,n)=>s+n,0);
   return <article className="office-poll" key={p.id}><div className="poll-card-top"><span><BarChart3 size={15}/>{p.event_name}</span><span className={closed?'poll-badge':'poll-badge is-open'}>{preview?'Unpublished preview':closed?'Voting closed':'Open for votes'}</span></div><h3>{p.question}</h3><p className="poll-meta">{total} {total===1?'response':'responses'} · {data?.active_accounts??0} active accounts{p.closes_at?` · Closes ${deadline(p.closes_at)}`:''}</p>
     <div className="poll-options" role="group" aria-label={`Choices for ${p.question}`}>{p.options.map((option,i)=>{const count=p.counts[i]??0,percent=total?Math.round(count/total*100):0;return <button key={i} disabled={preview||closed||!!busy} aria-pressed={p.my_option===i} onClick={()=>void vote(p.id,i)}><span className="poll-result-fill" style={{width:`${percent}%`}}/><span className="poll-option-label"><span>{p.my_option===i?<Check size={16}/>:<span className="poll-radio"/>}{option}</span><strong>{count} · {percent}%</strong></span></button>;})}</div>
     <footer><span>{preview?'Preview only. Publish the poll to allow voting.':p.my_option!==null?`Your choice: ${p.options[p.my_option]}`:closed?'You did not vote in this poll.':'Select a topic to save your vote.'}</span>{admin&&!closed&&!preview&&<button disabled={!!busy} onClick={()=>void close(p.id)}>Close voting</button>}</footer>
   </article>;
 }

 if(!admin&&!data?.polls.length&&!error)return null;
 return <section className="workspace-polls" aria-label="Office polls"><header><div><span className="poll-eyebrow">YOUR VOICE, OUR NEXT SESSION</span><h2><Vote size={21}/>Office polls</h2><p>Choose a topic for Hatsoff Drive or respond to your studio’s next question.</p></div>{admin&&<button disabled={!!busy} onClick={()=>setEditing(!editing)}><Plus size={16}/>{editing?'Cancel':'Create poll'}</button>}</header>
 {error&&<p className="poll-message" role="alert">{error}</p>}{notice&&<p className="poll-message" role="status">{notice}</p>}
 {editing&&admin&&<form className="poll-editor" onSubmit={e=>void publish(e)}><fieldset disabled={!!busy}><label>Event / session<input required maxLength={100} value={event} onChange={e=>setEvent(e.target.value)}/></label><label>Poll question<input required maxLength={300} value={question} onChange={e=>setQuestion(e.target.value)}/></label><div className="poll-topic-editor">{options.map((option,i)=><label key={i}>Topic {i+1}<div><input required maxLength={120} placeholder={`Enter topic ${i+1}`} value={option} onChange={e=>setOptions(current=>current.map((v,j)=>j===i?e.target.value:v))}/>{options.length>2&&<button type="button" aria-label={`Remove topic ${i+1}`} onClick={()=>setOptions(current=>current.filter((_,j)=>j!==i))}>×</button>}</div></label>)}</div><button type="button" disabled={options.length>=10} onClick={()=>setOptions([...options,''])}><Plus size={14}/>Add topic</button><label>Voting closes · optional (IST)<input type="datetime-local" value={closing} onChange={e=>setClosing(e.target.value)}/></label><p>One choice per account. People can change their vote until the poll closes. Results show totals, without colleagues’ names.</p></fieldset>{renderPoll({id:'preview',event_name:event||'Event',question:question||'Your poll question',options:options.map((v,i)=>v.trim()||`Topic ${i+1}`),counts:options.map(()=>0),my_option:null,created_at:'',closes_at:null,closed_at:null},true)}<button className="poll-primary" disabled={!!busy} type="submit">{busy==='publish'?'Publishing…':'Publish poll'}</button></form>}
 {!data&&!error&&<p className="poll-empty">Loading polls…</p>}
 {data?.polls.map(p=>renderPoll(p))}
 {data&&!data.polls.length&&!editing&&<div className="poll-empty"><Vote size={26}/><h3>Your next session starts with a choice.</h3><p>{admin?'Create a poll with five or six topics for the team to choose from.':'Admin will publish your next office poll here.'}</p></div>}
 </section>;
}
