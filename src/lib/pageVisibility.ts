export function rolePageDefault(role:string|undefined,page:string):boolean {
 if(!role)return false;
 if(role==='employee'&&['teams','employees','planner','sales'].includes(page))return false;
 if(role==='project_coordinator'&&page==='sales')return false;
 return true;
}
export function pageVisible(role:string|undefined,page:string,override?:boolean|null):boolean {
 if(page==='sales'&&['employee','project_coordinator'].includes(role||''))return false;
 return override??rolePageDefault(role,page);
}
