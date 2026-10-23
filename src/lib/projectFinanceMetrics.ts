import type { FinanceItem, FinanceProject, ProjectFinanceData } from '../types/projectFinance';
export const financeMoney = (value: number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(value);
export const financeMonth = (value: string) => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit'}).format(new Date(value)).replace(/(\d{2})\/(\d{4})/,'$2-$1');
export function isFinanceMonth(value: string) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(value); }
export function itemApplies(item: FinanceItem, month: string) {
  if (!isFinanceMonth(month)) return false;
  const first=item.start_month.slice(0,7),last=item.end_month?.slice(0,7);
  return item.frequency==='once' ? month===first : month>=first && (!last || month<=last);
}
export const financeBookingMonth=(p:FinanceProject)=>p.status==='completed'&&p.sales_completed_at?financeMonth(p.sales_completed_at):null;
export function financeSummary(data: ProjectFinanceData, month: string, clientId='', projectId='') {
  const projects=data.projects.filter(p=>(!clientId||p.client_id===clientId)&&(!projectId||p.id===projectId));
  const projectIds=new Set(projects.map(p=>p.id));
  const items=data.items.filter(i=>{
    if(!projectIds.has(i.project_id))return false;
    if(i.kind==='expense')return itemApplies(i,month);
    const completed=financeBookingMonth(projects.find(p=>p.id===i.project_id)!);
    if(!completed)return false;
    const booking=completed>i.start_month.slice(0,7)?completed:i.start_month.slice(0,7);
    return i.frequency==='once'?month===booking:month>=booking&&(!i.end_month||month<=i.end_month.slice(0,7));
  });
  const booked=projects.filter(p=>financeBookingMonth(p)===month);
  // Work/task counts never participate in financial totals.
  const projectRevenue=booked.reduce((sum,p)=>sum+Number(p.rate??0),0);
  const charges=items.filter(i=>i.kind==='charge').reduce((sum,i)=>sum+Number(i.amount),0);
  const expenses=items.filter(i=>i.kind==='expense').reduce((sum,i)=>sum+Number(i.amount),0);
  const openingSales=clientId||projectId?[]:(data.opening_sales??[]).filter(s=>s.month.slice(0,7)===month);
  const openingRevenue=openingSales.reduce((sum,s)=>sum+Number(s.amount),0);
  return {projects,items,openingSales,openingRevenue,projectRevenue,charges,expenses,revenue:projectRevenue+charges+openingRevenue,
    net:projectRevenue+charges+openingRevenue-expenses,unpriced:booked.filter(p=>p.rate==null).length};
}
export function trailingFinanceMonths(month: string) {
  const [year,part]=month.split('-').map(Number);
  return Array.from({length:6},(_,index)=>{const d=new Date(Date.UTC(year,part-1-5+index,1));return d.toISOString().slice(0,7);});
}

export function financeClients(data: ProjectFinanceData): [string,string][] {
  const names=new Map(data.projects.map(p=>[p.client_id,p.client_name]));
  for(const client of data.clients??[])names.set(client.id,client.name);
  return [...names.entries()].sort((a,b)=>a[1].localeCompare(b[1]));
}

export function financeForTeam(data:ProjectFinanceData, teamId:string):ProjectFinanceData {
 if(!teamId)return data;
 const name=data.teams?.find(t=>t.id===teamId)?.name;
 const projects=data.projects.filter(p=>p.monthly_team_project&&p.sales_credit_team_id?p.sales_credit_team_id===teamId:p.team_id===teamId||p.production_team_ids?.includes(teamId));
 const ids=new Set(projects.map(p=>p.id));
 return {...data,projects,items:data.items.filter(i=>ids.has(i.project_id)),opening_periods:[],
 opening_sales:(data.opening_sales??[]).filter(s=>s.team_name===name)};
}
