import {useEffect,useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../lib/supabase';
export function useProjectFinanceAccess() {
  const {profile}=useAuth();
  const [access,setAccess]=useState<{id:string;allowed:boolean}|null>(null);
  useEffect(()=>{let active=true;const load=()=>{void supabase.rpc('project_finance_access').then(({data,error})=>{if(active&&profile)setAccess({id:profile.id,allowed:!error&&data===true});});};load();window.addEventListener('focus',load);return()=>{active=false;window.removeEventListener('focus',load);};},[profile?.id,profile?.role,profile]);
  return profile?.role==='admin'||(access?.id===profile?.id&&access?.allowed===true);
}
