import {useEffect,useState} from 'react';
import {Pause,Play,TrendingUp} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {supabase} from '../../lib/supabase';
import {loadProjectFinance} from '../../services/sales/projectFinance.service';
import {financeMoney} from '../../lib/projectFinanceMetrics';
import {directorSalesSummary} from '../../lib/directorSalesSummary';
import './PersonalSalesTicker.css';
export default function DirectorSalesTicker(){
 const {profile}=useAuth();const [paused,setPaused]=useState(false);const [loaded,setLoaded]=useState<{user:string;summary:ReturnType<typeof directorSalesSummary>}|null>(null);const [error,setError]=useState('');
 useEffect(()=>{let active=true;const id=profile?.id;if(!id)return;async function refresh(){try{const [finance,target]=await Promise.all([loadProjectFinance('sales'),supabase.rpc('director_sales_target')]);if(target.error)throw target.error;if(active){setLoaded({user:id!,summary:directorSalesSummary(finance,target.data?.amount==null?null:Number(target.data.amount))});setError('');}}catch{if(active)setError('Company sales are unavailable. Please refresh.');}}void refresh();const timer=window.setInterval(()=>void refresh(),60000);window.addEventListener('focus',refresh);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);};},[profile?.id]);
 const summary=loaded&&loaded.user===profile?.id?loaded.summary:null;
 const items=summary?[`Today’s company sales: ${financeMoney(summary.today)}`,`Company sales this month: ${financeMoney(summary.month)}`,summary.target===null?'Monthly target: not set':`Monthly target: ${financeMoney(summary.target)}`,summary.remaining===null?'Set a monthly target to track the remaining amount':`Remaining target: ${financeMoney(summary.remaining)}`,summary.perDay===null?'Daily target: not set':`Needed per day: ${financeMoney(summary.perDay)} · ${summary.daysLeft} days left (including today)`]:[];
 return <section className="personal-sales-ticker" aria-label="Company sales overview"><span className="personal-sales-label"><TrendingUp size={17}/>Company sales</span>{error?<p role="alert">{error}</p>:!summary?<p role="status">Loading company sales…</p>:<><p className="sr-only">{items.join('. ')}.</p><div className="personal-sales-window" aria-hidden="true"><div className="personal-sales-track" style={{animationPlayState:paused?'paused':'running'}}>{[0,1].map(copy=><div className="personal-sales-group" key={copy}>{items.map(item=><span key={item}>{item}<i>✦</i></span>)}</div>)}</div></div><button onClick={()=>setPaused(p=>!p)} aria-label={paused?'Resume sales scrolling':'Pause sales scrolling'}>{paused?<Play size={16}/>:<Pause size={16}/>}</button></>}</section>;
}
