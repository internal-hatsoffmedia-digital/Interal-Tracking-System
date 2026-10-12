export const indiaDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function plannerDay(task:{planned_date:string|null;status:string;project?:{status?:string}|null},today:string):string|null {
 if(!task.planned_date)return null;
 if(task.project?.status==='completed')return task.planned_date;
 return task.planned_date<today&&!['completed','approved_delivered','approved_and_delivered','cancelled','rejected'].includes(task.status)?today:task.planned_date;
}
