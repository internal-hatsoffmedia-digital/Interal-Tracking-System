import {useEffect,useState} from 'react';
import {Pause,Play,TrendingUp} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {supabase} from '../../lib/supabase';
import {financeMoney} from '../../lib/projectFinanceMetrics';
import './PersonalSalesTicker.css';
type Summary={month:string;month_total:number;all_time_total:number;credited_projects:number};
export default function PersonalSalesTicker(){
 const {profile}=useAuth();const [paused,setPaused]=useState(false);
 const [result,setResult]=useState<{user:string;data?:Summary;error?:string}|null>(null);
 useEffect(()=>{let active=true;const user=profile?.id;if(!user)return;
  const refresh=async()=>{const {data,error}=await supabase.rpc('employee_sales_summary');if(active)setResult({user,...(error?{error:'Your sales summary is unavailable.'}:{data:data as Summary})});};
  void refresh();const timer=window.setInterval(()=>void refresh(),60000);window.addEventListener('focus',refresh);
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',refresh);};
 },[profile?.id]);
 const current=result?.user===profile?.id?result:null;
 if(!current)return <section className="personal-sales-ticker" aria-label="Your credited sales"><span>Loading your credited sales…</span></section>;
 if(current.error||!current.data)return <section className="personal-sales-ticker" aria-label="Your credited sales"><span>{current.error??'Your sales summary is unavailable.'}</span></section>;
 const data=current.data;const items=[`Your sales this month: ${financeMoney(Number(data.month_total))}`,`Your total sales: ${financeMoney(Number(data.all_time_total))}`,`${data.credited_projects} completed projects with your sales contribution`];
 return <section className="personal-sales-ticker" aria-label="Your credited sales">
  <span className="personal-sales-label"><TrendingUp size={17}/>Your sales</span>
  <p className="sr-only">{items.join('. ')}. Includes your share of completed project sales.</p>
  <div className="personal-sales-window" aria-hidden="true"><div className="personal-sales-track" style={{animationPlayState:paused?'paused':'running'}}>{[0,1].map(copy=><div className="personal-sales-group" key={copy}>{items.map(item=><span key={item}>{item}<i>✦</i></span>)}</div>)}</div></div>
  <button onClick={()=>setPaused(p=>!p)} aria-label={paused?'Resume sales scrolling':'Pause sales scrolling'}>{paused?<Play size={16}/>:<Pause size={16}/>}</button>
 </section>;
}
