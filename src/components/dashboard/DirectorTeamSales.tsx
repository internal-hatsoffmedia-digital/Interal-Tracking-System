import {useEffect,useState} from 'react';
import {BarChart3} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {loadProjectFinance} from '../../services/sales/projectFinance.service';
import {financeForTeam,financeMoney} from '../../lib/projectFinanceMetrics';
import {directorSalesSummary} from '../../lib/directorSalesSummary';
import {productionTeamName} from '../../lib/productionTeamNames';
import type {ProjectFinanceData} from '../../types/projectFinance';
const names=['Cut Masters','Creative Clan','Digital Ninjas - M','Digital Ninjas - W'];
export default function DirectorTeamSales(){
 const {profile}=useAuth();const [loaded,setLoaded]=useState<{user:string;data:ProjectFinanceData}|null>(null);const [error,setError]=useState('');
 useEffect(()=>{let live=true;const id=profile?.id;if(!id)return;const refresh=async()=>{try{const data=await loadProjectFinance('sales');if(live){setLoaded({user:id,data});setError('');}}catch{if(live)setError('Team sales are unavailable. Please refresh.');}};void refresh();const timer=window.setInterval(()=>void refresh(),60000);window.addEventListener('focus',refresh);return()=>{live=false;clearInterval(timer);window.removeEventListener('focus',refresh);};},[profile?.id]);
 const data=loaded&&loaded.user===profile?.id?loaded.data:null;const shared=data?.projects.some(p=>(p.production_team_ids?.length||0)>1);
 return <section className="director-team-sales" aria-label="Company sales by team"><header><h2><BarChart3 size={19}/>Sales by team</h2><span>Today & this month · IST</span></header>{error&&<p role="alert">{error}</p>}<div>{names.map(name=>{const team=data?.teams?.find(t=>productionTeamName(t.name)===name);const totals=data&&team?directorSalesSummary(financeForTeam(data,team.id),null):null;return <article key={name} className="desk-card"><h3>{name}</h3><span>Today</span><strong>{!data?'…':totals?financeMoney(totals.today):'No team configured'}</strong><p>This month <b>{totals?financeMoney(totals.month):'—'}</b></p></article>;})}</div>{shared&&<p className="desk-muted">Shared projects appear under each linked team. Team amounts should not be added together.</p>}</section>;
}
