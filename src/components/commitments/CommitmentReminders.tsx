import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {getMyWork} from '../../services/tasks/myWork.service';
import type {MyWorkItem} from '../../types/myWork';
import {commitmentClosed,deadlineStageRank,nextReminder,reminderKey,type DeadlineStage} from '../../lib/commitmentCountdown';
type Reminder={key:string;title:string;stage:DeadlineStage};
const messages={hour:'Committed time is within the next hour.',ten_minutes:'Committed time is within the next 10 minutes.',ended:'Committed time has ended.'};
export default function CommitmentReminders(){
 const {profile}=useAuth();const user=profile?.is_active?profile.id:'';
 const [notices,setNotices]=useState<{user:string;items:Reminder[]}>({user:'',items:[]});
 const seen=useRef(new Map<string,number>());
 useEffect(()=>{
  if(!user)return;
  let active=true;let assignments:MyWorkItem[]=[];let loading=false;
  const check=()=>{
   if(!active)return;
   const next:Reminder[]=[];
   for(const item of assignments){
    if(!item.due_date||commitmentClosed(item.assignment_status,item.completed_at)||commitmentClosed(item.task_status))continue;
    const key=reminderKey(user,item.assignment_id,item.due_date);
    let rank=seen.current.get(key)??0;
    try{rank=Math.max(rank,Number(localStorage.getItem(key))||0);}catch{/* In-memory deduplication still works. */}
    const stage=nextReminder(item.due_date,Date.now(),rank);
    if(!stage)continue;
    seen.current.set(key,deadlineStageRank[stage]);
    try{localStorage.setItem(key,String(deadlineStageRank[stage]));}catch{/* Storage can be blocked by browser settings. */}
    next.push({key,title:item.task_title,stage});
   }
   if(next.length)setNotices(old=>{
    const previous=old.user===user?old.items:[];
    return {user,items:[...previous.filter(p=>!next.some(n=>n.key===p.key)),...next]};
   });
  };
  const load=async()=>{
   if(loading)return;loading=true;
   try{const work=await getMyWork();if(active){assignments=work;check();
    const openKeys=new Set(work.filter(i=>i.due_date&&!commitmentClosed(i.assignment_status,i.completed_at)&&!commitmentClosed(i.task_status)).map(i=>reminderKey(user,i.assignment_id,i.due_date!)));
    setNotices(old=>old.user===user?{user,items:old.items.filter(n=>openKeys.has(n.key))}:old);
   }}catch{assignments=[];}finally{loading=false;}
  };
  void load();
  const tick=window.setInterval(check,1000),poll=window.setInterval(()=>void load(),30000);
  const focus=()=>void load();window.addEventListener('focus',focus);window.addEventListener('commitment-work-updated',focus);
  return()=>{active=false;clearInterval(tick);clearInterval(poll);window.removeEventListener('focus',focus);window.removeEventListener('commitment-work-updated',focus);};
 },[user]);
 const visible=notices.user===user?notices.items:[];
 if(!visible.length)return null;
 return <aside role="alert" aria-label="Committed time reminders" className="fixed bottom-5 right-5 z-[100] w-[min(390px,calc(100vw-40px))] rounded-2xl border border-amber-400 bg-white p-5 text-slate-900 shadow-xl">
   <h2 className="font-bold">Committed time reminder</h2>
   <ul className="my-3 max-h-60 space-y-3 overflow-auto">{visible.map(n=><li key={n.key}><strong className="block text-sm">{n.title}</strong><span className="text-sm">{messages[n.stage]}</span></li>)}</ul>
   <div className="flex items-center justify-between gap-3"><Link to="/my-work" className="text-sm font-semibold underline">Open My Work</Link><button type="button" className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black" onClick={()=>setNotices({user,items:[]})}>Dismiss reminders</button></div>
 </aside>;
}
