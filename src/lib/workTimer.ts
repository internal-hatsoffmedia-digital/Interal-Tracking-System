export const durationClock=(seconds:number)=>{const n=Math.max(0,Math.floor(seconds));return `${String(Math.floor(n/3600)).padStart(2,'0')}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
export function timerSeconds(start:string,end:string){return Math.max(0,(Date.parse(end)-Date.parse(start))/1000);}
export const workTime=(value:string)=>new Date(value).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})+' IST';
