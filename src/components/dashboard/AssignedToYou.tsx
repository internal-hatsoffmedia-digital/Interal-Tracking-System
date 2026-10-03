import {useCallback,useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {getMyWork} from '../../services/tasks/myWork.service';
import {useAssignmentRefresh} from '../../hooks/useAssignmentRefresh';
import type {MyWorkItem} from '../../types/myWork';
export default function AssignedToYou(){
 const [items,setItems]=useState<MyWorkItem[]>([]);const [error,setError]=useState('');
 const load=useCallback(async()=>{try{setItems(await getMyWork());setError('')}catch(e){setError(e instanceof Error?e.message:'Unable to load assigned work')}},[]);
 useEffect(()=>{void load()},[load]);useAssignmentRefresh(load);
 return <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3" aria-label="Assigned to you"><div className="flex justify-between gap-4"><h2 className="font-semibold text-lg">Assigned to you</h2><Link className="text-sm font-semibold" to="/my-work">View all my work</Link></div>{error?<p role="alert" className="text-sm text-red-700">{error}</p>:items.length===0?<p className="text-sm text-slate-500">No tasks assigned to your linked account.</p>:<p className="text-sm text-slate-600">{items.length} task assignments are available in My Work, including work assigned by administrators and project coordinators.</p>}</section>;
}
