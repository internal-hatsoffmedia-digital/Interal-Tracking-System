export type WorkTab='ongoing'|'review'|'completed'|'next';
export const workTabs:{id:WorkTab;label:string}[]=[{id:'ongoing',label:'Ongoing'},{id:'review',label:'In review'},{id:'completed',label:'Completed'},{id:'next',label:'Next in line'}];
const reviews=new Set(['internal_review','client_review','sent_for_internal_review','sent_for_client_review']);
export function assignmentTab(assignment:string,task:string):WorkTab{
 if(assignment==='completed')return reviews.has(task)?'review':'completed';
 return ['assigned','accepted','not_started'].includes(assignment)?'next':'ongoing';
}
export function projectTab(status:string,taskStates:string[]):WorkTab{
 if(status==='completed')return 'completed';
 if(status==='on_hold')return 'ongoing';
 if(taskStates.some(s=>['editing_in_progress','in_progress','raw_footage_received'].includes(s)))return 'ongoing';
 if(taskStates.some(s=>reviews.has(s)))return 'review';
 return status==='planning'?'next':'ongoing';
}
