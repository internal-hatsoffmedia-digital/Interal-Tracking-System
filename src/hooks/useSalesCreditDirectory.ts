import {useEffect,useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../lib/supabase';
import type {EmployeeCredit} from '../lib/employeeSalesReport';
export interface SalesCreditDirectory {people:{id:string;name:string;team:string|null}[];credits:EmployeeCredit[]}
const empty:SalesCreditDirectory={people:[],credits:[]};
export function useSalesCreditDirectory(enabled:boolean){
 const {profile}=useAuth();const key=[profile?.id,profile?.role,profile?.team_id,enabled].join(':');
 const [state,setState]=useState<{key:string;data:SalesCreditDirectory;error:string;loading:boolean}|null>(null);
 useEffect(()=>{if(!enabled)return;let active=true;let request=0;
  const refresh=async()=>{const n=++request;const {data,error}=await supabase.rpc('project_sales_credit_directory');if(active&&n===request)setState({key,data:error?empty:data as SalesCreditDirectory,error:error?.message??'',loading:false});};
  void refresh();window.addEventListener('sales-credits-updated',refresh);window.addEventListener('focus',refresh);const timer=window.setInterval(refresh,60000);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('sales-credits-updated',refresh);window.removeEventListener('focus',refresh);};
 },[key,enabled]);
 return state?.key===key?state:{key,data:empty,error:'',loading:enabled};
}
