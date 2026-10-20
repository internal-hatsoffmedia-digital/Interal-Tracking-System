import {financeClients,financeForTeam,financeSummary,financeBookingMonth} from './projectFinanceMetrics';
import type {ProjectFinanceData,FinanceProject} from '../types/projectFinance';
import type {EmployeeCredit} from './employeeSalesReport';
export type RevenueGroup='client'|'employee'|'team';
const projectCounts=(projects:FinanceProject[])=>({completed:projects.filter(p=>p.status==='completed').length,ratesPending:projects.filter(p=>p.status==='completed'&&p.rate==null).length});
export function rateProjects(projects:FinanceProject[],credits:EmployeeCredit[],filters:{client:string;team:string;employee:string}){
 const credited=new Set(credits.filter(c=>c.profile_id===filters.employee&&Number(c.amount)>0).map(c=>c.project_id));
 return projects.filter(p=>(!filters.client||p.client_id===filters.client)&&(!filters.team||p.production_team_ids?.includes(filters.team))&&(!filters.employee||credited.has(p.id)));
}
export function revenueBreakdown(data:ProjectFinanceData,month:string,group:RevenueGroup,credits:EmployeeCredit[],people:{id:string;name:string}[]){
 const result=group==='client'?financeClients(data).map(([id,name])=>{const s=financeSummary(data,month,id);return{id,name,revenue:s.revenue,projects:s.projects.length,...projectCounts(s.projects)};}):
 group==='team'?(data.teams??[]).map(t=>{const scoped=financeForTeam(data,t.id);scoped.projects=scoped.projects.filter(p=>p.production_team_ids?.includes(t.id));const s=financeSummary(scoped,month);return{id:t.id,name:t.name,revenue:s.revenue,projects:s.projects.length,...projectCounts(s.projects)};}):
 [...new Map([...people.map(p=>[p.id,p.name] as const),...credits.filter(c=>data.projects.some(p=>p.id===c.project_id)).map(c=>[c.profile_id,c.name] as const)]).entries()].map(([id,name])=>{
  const booked=new Set(data.projects.filter(p=>financeBookingMonth(p)===month).map(p=>p.id));const rows=credits.filter(c=>c.profile_id===id&&booked.has(c.project_id)&&Number(c.amount)>0);
  return{id,name,revenue:rows.reduce((n,c)=>n+Number(c.amount),0),projects:new Set(rows.map(c=>c.project_id)).size,completed:new Set(rows.map(c=>c.project_id)).size,ratesPending:0};
 });
 return result.sort((a,b)=>b.revenue-a.revenue||a.name.localeCompare(b.name));
}
