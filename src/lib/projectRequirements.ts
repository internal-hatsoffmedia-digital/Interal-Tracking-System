export function projectRequirementError(project:{client_id?:string|null;name?:string;production_team_ids?:string[];rate?:number|string|null;invoice_status?:string;status?:string}){
 if(!project.client_id)return 'Please select a client.';
 if(!project.name?.trim())return 'Project name is required.';
 if(!project.production_team_ids?.length)return 'Select at least one production team.';
 if(project.rate===null||project.rate===undefined||String(project.rate).trim()==='')return 'Project rate (INR) is required. Enter 0 for work with no charge.';
 if(!Number.isFinite(Number(project.rate))||Number(project.rate)<0)return 'Rate must be a non-negative number.';
 if(!project.invoice_status)return 'Please select the payment status.';
 if(!project.status)return 'Please select a project status.';
 return '';
}
