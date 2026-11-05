import {useEffect,useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../lib/supabase';
export function useTaskManagement(){
 const {profile}=useAuth();
 const key=[profile?.id,profile?.role,profile?.team_id,profile?.is_active].join(':');
 const [access,setAccess]=useState<{key:string;allowed:boolean}|null>(null);
 useEffect(()=>{let active=true;void supabase.rpc('task_management_access').then(({data,error})=>{if(active)setAccess({key,allowed:!error&&data===true});});return()=>{active=false;};},[key]);
 return !!profile?.is_active&&(profile.role==='admin'||profile.role==='project_coordinator'||(access?.key===key&&access.allowed));
}
