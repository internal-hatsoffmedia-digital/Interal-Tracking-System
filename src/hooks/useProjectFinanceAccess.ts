import {useEffect,useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../lib/supabase';
export function useProjectFinanceAccess(mode:'sales'|'costs'='costs') {
  const {profile}=useAuth();
  const key=[profile?.id,profile?.role,profile?.team_id,mode].join(':');
  const [access,setAccess]=useState<{key:string;allowed:boolean}|null>(null);
  useEffect(()=>{let active=true;const load=()=>{void supabase.rpc(mode==='sales'?'team_sales_access':'project_finance_access').then(({data,error})=>{if(active&&profile)setAccess({key,allowed:!error&&data===true});});};load();window.addEventListener('focus',load);return()=>{active=false;window.removeEventListener('focus',load);};},[profile?.id,profile?.role,profile,mode,key]);
  return !!profile?.is_active&&(profile?.role==='admin'||(access?.key===key&&access?.allowed===true));
}
