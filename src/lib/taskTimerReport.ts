export type TaskTimerSession={id:string;assignment_id:string;started_at:string;ended_at:string|null;completed_at:string|null};
const istDay=(time:number)=>new Date(time+19800000).toISOString().slice(0,10);
export function taskTimerSummary(sessions:TaskTimerSession[],day='',now=Date.now()){
 const selected=sessions.filter(s=>!day||istDay(Date.parse(s.started_at))===day);
 let seconds=0;
 for(const s of selected){
  const start=Date.parse(s.started_at),midnight=Date.parse(istDay(start)+'T00:00:00+05:30')+86400000;
  const finish=Math.min(s.ended_at?Date.parse(s.ended_at):now,now,midnight,s.completed_at?Date.parse(s.completed_at):Infinity);
  seconds+=Math.max(0,(finish-start)/1000);
 }
 return {start:selected.length?selected.reduce((a,s)=>a<s.started_at?a:s.started_at,selected[0].started_at):null,
  end:sessions.find(s=>s.completed_at)?.completed_at??null,hours:seconds/3600,count:selected.length};
}
