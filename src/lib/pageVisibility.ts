export function rolePageDefault(role:string|undefined,page:string):boolean {
 if(!role)return false;
 if(role==='employee'&&['teams','employees','planner','sales'].includes(page))return false;
 if(role==='project_coordinator'&&page==='sales')return false;
 return true;
}
export function pageVisible(role:string|undefined,page:string,override?:boolean|null):boolean {
 if(['qc','qc-activity','planner'].includes(page))return false;
 if(page==='clients'&&['admin','associate_lead','manager','director'].includes(role||''))return true;
 if(page==='sales'&&['employee','project_coordinator'].includes(role||''))return false;
 // Actual financial authority is still checked by team_sales_access() on every API call.
 if(page==='sales'&&['admin','manager','director','associate_lead'].includes(role||''))return true;
 return override??rolePageDefault(role,page);
}
