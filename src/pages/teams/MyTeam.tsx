import {useEffect,useState} from 'react';
import {Users,RefreshCw} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import {getMyTeam,type MyTeamData} from '../../services/teams/myTeam.service';
export default function MyTeam(){
 const {profile}=useAuth();
 const [team,setTeam]=useState<MyTeamData|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  let cancelled=false;setLoading(true);setTeam(null);setError('');
  getMyTeam().then(data=>{if(!cancelled)setTeam(data)}).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'Unable to load your team.')}).finally(()=>{if(!cancelled)setLoading(false)});
  return()=>{cancelled=true};
 },[profile?.id,profile?.team_id,profile?.role,revision]);
 return <div className="space-y-6">
  <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="flex items-center gap-3 text-2xl font-semibold"><Users size={24}/>My Team</h1><p className="mt-2 text-sm text-slate-500">Your assigned team and its members.</p></div><button onClick={()=>setRevision(v=>v+1)} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={16}/>Refresh</button></header>
  {loading?<p role="status">Loading your team…</p>:error?<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>:!team?<p className="rounded-xl border border-slate-200 bg-white p-6">No team is assigned to your account. Ask an administrator to assign your team in Team Members.</p>:<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-200 p-6"><h2 className="text-xl font-semibold">{team.name}</h2>{team.description&&<p className="mt-2 text-sm text-slate-500">{team.description}</p>}<p className="mt-3 text-sm font-medium">{team.members.length} team members</p></div>{team.members.length===0?<p className="p-6 text-slate-500">No employees have been added to this team yet.</p>:<ul className="divide-y divide-slate-100">{team.members.map(member=><li key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-semibold">{member.full_name}</p><p className="text-sm text-slate-500">{member.job_title||'Team member'}</p>{member.email&&<p className="text-sm text-slate-500 break-all">{member.email}</p>}</div><span className={'rounded-full px-3 py-1 text-xs font-medium '+(member.is_active?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500')}>{member.is_active?'Active':'Inactive'}</span></li>)}</ul>}</section>}
 </div>;
}
