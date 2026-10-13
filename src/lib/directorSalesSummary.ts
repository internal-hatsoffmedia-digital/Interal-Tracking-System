import type {ProjectFinanceData} from '../types/projectFinance';
import {financeSummary} from './projectFinanceMetrics';
import {studioDay} from './dashboardCelebrations';
export function directorSalesSummary(data:ProjectFinanceData,target:number|null,now=new Date()){
 const day=studioDay(now),month=day.slice(0,7);const summary=financeSummary(data,month);
 const projects=new Map(data.projects.map(p=>[p.id,p]));
 const todayBase=summary.projects.filter(p=>p.status==='completed'&&p.sales_completed_at&&studioDay(new Date(p.sales_completed_at))===day).reduce((sum,p)=>sum+Number(p.rate??0),0);
 const todayCharges=summary.items.filter(i=>i.kind==='charge').filter(i=>{const p=projects.get(i.project_id);if(!p?.sales_completed_at)return false;const dates=[month+'-01',studioDay(new Date(p.sales_completed_at)),studioDay(new Date(i.created_at))];return dates.sort().at(-1)===day;}).reduce((sum,i)=>sum+Number(i.amount),0);
 const [year,m,date]=day.split('-').map(Number);const daysLeft=new Date(Date.UTC(year,m,0)).getUTCDate()-date+1;
 const remaining=target===null?null:Math.max(0,target-summary.revenue);
 return {today:todayBase+todayCharges,month:summary.revenue,target,remaining,daysLeft,perDay:remaining===null?null:remaining/daysLeft};
}
