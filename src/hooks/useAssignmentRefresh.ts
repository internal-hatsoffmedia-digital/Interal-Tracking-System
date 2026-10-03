import {useEffect,useRef} from 'react';
import {supabase} from '../lib/supabase';
/** Realtime when enabled; focus and polling cover projects without publications. */
export function useAssignmentRefresh(refresh:()=>Promise<unknown>){
 const latest=useRef(refresh);
 useEffect(()=>{latest.current=refresh},[refresh]);
 useEffect(()=>{
  let pending=false;let closed=false;
  const run=()=>{if(closed||pending||document.visibilityState==='hidden')return;pending=true;void latest.current().catch(()=>undefined).finally(()=>{pending=false})};
  const channel=supabase.channel('assignment-refresh-'+crypto.randomUUID())
   .on('postgres_changes',{event:'*',schema:'public',table:'task_assignments'},run)
   .on('postgres_changes',{event:'*',schema:'public',table:'tasks'},run).subscribe();
  window.addEventListener('focus',run);document.addEventListener('visibilitychange',run);
  const timer=window.setInterval(run,15000);
  return()=>{closed=true;clearInterval(timer);window.removeEventListener('focus',run);document.removeEventListener('visibilitychange',run);void supabase.removeChannel(channel)};
 },[]);
}
