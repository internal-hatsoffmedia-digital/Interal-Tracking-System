import ProjectArtistWork from '../projects/ProjectArtistWork';
import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight,Clock3,CheckCircle2,BriefcaseBusiness,CalendarDays} from 'lucide-react';
import {usePageAccess} from '../../context/pageAccess';
import {useAuth} from '../../context/AuthContext';
import {getMyWork} from '../../services/tasks/myWork.service';
import {supabase} from '../../lib/supabase';
import {studioDay} from '../../lib/dashboardCelebrations';
import {assignmentTab,workTabs,type WorkTab} from '../../lib/dashboardWork';
import {financeMoney} from '../../lib/projectFinanceMetrics';
import type {MyWorkItem} from '../../types/myWork';
import PersonalSalesTicker from './PersonalSalesTicker';
import Announcements from './Announcements';
import OfficeBirthdays from './OfficeBirthdays';
import WorkspacePolls from './WorkspacePolls';
import './roleWorkspace.css';
type PersonalData={workReady:boolean;items:MyWorkItem[];seconds:number|null;sales:number|null;errors:string[]};
export default function EmployeeWorkspace(){
 const {profile}=useAuth();const {allowed}=usePageAccess();const identity=[profile?.id,profile?.team_id].join(':');const [tab,setTab]=useState<WorkTab>('ongoing');
 const [loaded,setLoaded]=useState<{key:string;data:PersonalData}|null>(null);
 useEffect(()=>{let live=true;let n=0;const refresh=async()=>{const request=++n;const [work,timer,sales]=await Promise.allSettled([getMyWork(),supabase.rpc('workspace_work_timer_data',{p_day:studioDay()}),supabase.rpc('employee_sales_summary')]);
  const errors:string[]=[];const items=work.status==='fulfilled'?work.value:[];if(work.status==='rejected')errors.push('Your assignments could not load. Open My Work to retry.');
  const timing=timer.status==='fulfilled'&&!timer.value.error?timer.value.data:null;const credited=sales.status==='fulfilled'&&!sales.value.error?sales.value.data:null;
  if(!timing)errors.push('Your timer summary is unavailable.');if(!credited)errors.push('Your credited sales are unavailable.');
  if(live&&request===n)setLoaded({key:identity,data:{workReady:work.status==='fulfilled',items,seconds:timing?timing.sessions.reduce((sum:number,s:{seconds:number})=>sum+Number(s.seconds),0):null,sales:credited?Number(credited.month_total):null,errors}});
 };void refresh();const t=setInterval(refresh,30000);window.addEventListener('focus',refresh);window.addEventListener('assignments-updated',refresh);return()=>{live=false;clearInterval(t);window.removeEventListener('focus',refresh);window.removeEventListener('assignments-updated',refresh);};},[identity]);
 const data=loaded?.key===identity?loaded.data:null;const items=data?.items??[];const count=(t:WorkTab)=>items.filter(i=>assignmentTab(i.assignment_status,i.task_status)===t).length;
 const filtered=items.filter(i=>assignmentTab(i.assignment_status,i.task_status)===tab);const finished=count('completed');const progress=items.length?Math.round(finished/items.length*100):0;
 const stats=[{label:'Assigned to you',value:data?.workReady?items.length:'…',color:'peach'},{label:'Work in progress',value:data?.workReady?count('ongoing'):'…',color:'blue'},{label:'In review',value:data?.workReady?count('review'):'…',color:'lilac'},{label:'Completed',value:data?.workReady?finished:'…',color:'pink'},{label:'Focus time today',value:data?.seconds!=null?`${(data.seconds/3600).toFixed(1)}h`:'—',color:'mint'},{label:'Your credited sales this month',value:data?.sales!=null?financeMoney(data.sales):'—',color:'yellow'}];
 return <div className="role-workspace employee-workspace"><OfficeBirthdays/><PersonalSalesTicker/><header className="role-heading"><div><span>YOUR WORKSPACE</span><h1>Hi, {profile?.full_name||'there'}.</h1><p>A clear view of your work, time and progress.</p></div><Link className="role-primary" to="/daily-desk">Plan your day <ArrowUpRight size={17}/></Link></header>
 <div className="employee-overview"><section className="role-panel"><div className="role-panel-heading"><h2><BriefcaseBusiness size={19}/>Your work at a glance</h2><span>{studioDay()} · IST</span></div><div className="personal-stat-grid">{stats.map(s=><article key={s.label} className={`personal-stat ${s.color}`}><span>{s.label}</span><strong>{s.value}</strong></article>)}</div>{data?.errors.map(e=><p key={e} role="alert" className="role-note">{e}</p>)}</section>
 <aside className="role-panel personal-profile">{profile?.avatar_url?<img src={profile.avatar_url} alt="Your profile"/>:<div className="personal-avatar">{profile?.full_name?.slice(0,1)||'U'}</div>}<h2>{profile?.full_name}</h2><p>{profile?.job_title||'Team member'}</p><span className="role-tag">Employee</span><dl><dt>Work email</dt><dd>{profile?.email||'Not added'}</dd><dt>Today’s focus time</dt><dd>{data?.seconds!=null?`${(data.seconds/3600).toFixed(1)} hours`:'Unavailable'}</dd></dl><Link to="/my-work" className="role-primary"><Clock3 size={16}/>Open your work clock</Link></aside></div>
 <div className="personal-bottom"><section className="role-panel"><div className="role-panel-heading"><h2><CheckCircle2 size={19}/>Your task list</h2><Link to="/my-work">My Work →</Link></div><nav className="role-tabs" aria-label="Your task status">{workTabs.map(t=><button key={t.id} aria-pressed={tab===t.id} onClick={()=>setTab(t.id)}>{t.label}<span>{count(t.id)}</span></button>)}</nav>{!data?<p role="status">Loading your work…</p>:!data.workReady?<p className="role-empty">Your assignments are unavailable. Open My Work to retry.</p>:!filtered.length?<p className="role-empty">No tasks in {workTabs.find(t=>t.id===tab)?.label.toLowerCase()}.</p>:<ul className="personal-tasks">{filtered.slice(0,8).map(i=><li key={i.assignment_id}><div><strong>{i.task_title}</strong><small>{i.client_name||'Client'} · {i.project_name||'Project'}</small></div><span>{i.priority}</span><Link to="/my-work" aria-label={`Open ${i.task_title}`}>Open →</Link></li>)}</ul>}</section>
 <section className="role-panel personal-progress"><h2><CalendarDays size={19}/>Your progress</h2><strong>{data?.workReady?`${progress}%`:'—'}</strong><progress value={progress} max={100} aria-label="Your completed assignments"/><p>{finished} of {items.length} assignments delivered.</p><p className="role-note">Tasks in review are shown separately until delivery is approved. Timer hours exclude breaks.</p>{allowed('/planner')&&<Link to="/planner">See your plan →</Link>}</section></div>
 <ProjectArtistWork compact/><Announcements hero/><div className="role-community"><WorkspacePolls/></div></div>;
}
