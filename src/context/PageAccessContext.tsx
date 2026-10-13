import {useEffect,useState,type ReactNode} from 'react';
import {useAuth} from './AuthContext';
import {supabase} from '../lib/supabase';
import {Context,type AccessData} from './pageAccess';
export function PageAccessProvider({children}:{children:ReactNode}){
 const {profile}=useAuth();const [data,setData]=useState<AccessData>({manager:false,members:[],rules:[]});const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 async function reload(){setLoading(true);const {data:result,error:failure}=await supabase.rpc('member_page_access_data');if(failure){setError('Page access is unavailable. Ask an administrator to apply the workspace update.');setData({manager:false,members:[],rules:[]});}else{setData(result as AccessData);setError('');}setLoading(false);}
 useEffect(()=>{let live=true;const update=async()=>{const {data:result,error:failure}=await supabase.rpc('member_page_access_data');if(!live)return;if(failure){setError('Page access is unavailable. Ask an administrator to apply the workspace update.');setData({manager:false,members:[],rules:[]});}else{setData(result as AccessData);setError('');}setLoading(false);};void update();window.addEventListener('focus',update);const interval=window.setInterval(update,60000);return()=>{live=false;window.removeEventListener('focus',update);window.clearInterval(interval);};},[profile?.id]);
 const allowed=(path:string)=>{const page=path.split('/').filter(Boolean)[0]||'dashboard';if(page==='access')return !!profile?.is_active&&['admin','manager','director'].includes(profile.role);return data.rules.find(rule=>rule.profile_id===profile?.id&&rule.page===page)?.allowed!==false;};
 return <Context.Provider value={{data,loading,error,reload,allowed}}>{children}</Context.Provider>;
}
