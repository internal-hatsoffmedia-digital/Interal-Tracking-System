export type QCFilterItem={updated_at?:string|null;assignees:{id:string;name:string}[]};
export function qcDay(timestamp?:string|null){
 if(!timestamp||!Number.isFinite(Date.parse(timestamp)))return '';
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp));
}
export function matchesQCFilters(item:QCFilterItem,employee:string,from:string,through:string){
 const day=qcDay(item.updated_at);
 return (!employee||item.assignees.some(p=>p.id===employee))&&
  (!(from||through)||!!day&&(!from||day>=from)&&(!through||day<=through));
}
