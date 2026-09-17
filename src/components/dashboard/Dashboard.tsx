import {useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {LayoutGrid,FolderKanban,ChartNoAxesCombined,ArrowUpRight} from 'lucide-react';
import Announcements from './Announcements';
import ActiveProjects from './ActiveProjects';
import AttentionTasks from './AttentionTasks';
import ClientAccountRadar from './ClientAccountRadar';
import ExecutiveBriefing from './ExecutiveBriefing';
import ProductionAlert from './ProductionAlert';
import ProductionFunnel from './ProductionFunnel';
import ProductionOverview from './ProductionOverview';
import ProjectHealth from './ProjectHealth';
import StatsCards from './StatsCards';
import TeamWorkload from './TeamWorkload';
export default function Dashboard(){
 const [mode,setMode]=useState<'executive'|'operations'>('executive');const [view,setView]=useState('today');const location=useLocation();const navigate=useNavigate();
 const active=location.hash==='#attention'?'today':view;
 const tabs=[{id:'today',label:'Today',icon:LayoutGrid},{id:'projects',label:'Projects & people',icon:FolderKanban},{id:'insights',label:'Studio insights',icon:ChartNoAxesCombined}];
 return <div className="future-dashboard"><ExecutiveBriefing viewMode={mode} onToggleViewMode={setMode}/>
 <div className="future-dashboard-navigation"><div className="future-section-title"><span className="future-eyebrow">MAKE SPACE FOR GREAT WORK</span><h2>Your workspace <ArrowUpRight size={20}/></h2></div><div className="future-dashboard-tabs" aria-label="Dashboard views">{tabs.map(t=><button key={t.id} aria-pressed={active===t.id} onClick={()=>{if(location.hash)navigate(location.pathname,{replace:true});setView(t.id);}}><t.icon size={16}/>{t.label}</button>)}</div></div>
 <div className="future-dashboard-panel" key={active}>
 {active==='today'&&<><Announcements/>{mode==='executive'?<section aria-label="Agency Velocity Pipeline"><ProductionFunnel/></section>:<section aria-label="Dashboard summary"><StatsCards/></section>}<section id="attention" className="scroll-mt-24" aria-label="Tasks requiring attention"><AttentionTasks/></section>{mode==='operations'&&<ProductionAlert/>}</>}
 {active==='projects'&&<><div className="future-two-column"><section aria-label="Active projects"><ActiveProjects/></section><section aria-label="Team workload"><TeamWorkload/></section></div><section aria-label="Project health"><ProjectHealth/></section></>}
 {active==='insights'&&<><section aria-label="Client Account Radar"><ClientAccountRadar/></section><section aria-label="Production overview"><ProductionOverview/></section><section aria-label="Production alerts"><ProductionAlert/></section></>}
 </div></div>;
}
