import type {FinanceProject} from '../types/projectFinance';
export interface EmployeeCredit {project_id:string;profile_id:string;name:string;amount:number|string}
export interface EmployeeSaleRow extends EmployeeCredit {project_code:string;project_name:string;client_name:string;completion_day:string}
export const istSalesDay=(timestamp:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp));
export function employeeSalesRows(projects:FinanceProject[],credits:EmployeeCredit[],employee:string,from:string,through:string):EmployeeSaleRow[]{
 if(!from||!through||from>through)return [];
 const byId=new Map(projects.filter(p=>p.status==='completed'&&p.sales_completed_at).map(p=>[p.id,p]));
 return credits.flatMap(c=>{const p=byId.get(c.project_id);if(!p||Number(c.amount)<=0||employee&&c.profile_id!==employee)return [];
 const day=istSalesDay(p.sales_completed_at!);if(day<from||day>through)return [];
 return [{...c,project_code:p.project_code,project_name:p.name,client_name:p.client_name,completion_day:day}];
 }).sort((a,b)=>b.completion_day.localeCompare(a.completion_day)||a.name.localeCompare(b.name));
}
export function employeeSalesTotals(rows:EmployeeSaleRow[]){return {amount:rows.reduce((sum,r)=>sum+Number(r.amount),0),employees:new Set(rows.map(r=>r.profile_id)).size,projects:new Set(rows.map(r=>r.project_id)).size};}
