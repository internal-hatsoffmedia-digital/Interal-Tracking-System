import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Team } from "../../types/team";
type Account = { id: string; full_name: string; email: string; team_id: string | null; is_active: boolean };
export default function AssignTeamAccount({ teams, onSaved }: { teams: Team[]; onSaved: () => Promise<void> }) {
 const [accounts,setAccounts]=useState<Account[]>([]);
 const [account,setAccount]=useState(""); const [team,setTeam]=useState("");
 const [busy,setBusy]=useState(false); const [loading,setLoading]=useState(true);
 const [error,setError]=useState(""); const [success,setSuccess]=useState("");
 async function load(){setLoading(true);setError("");try {
 const r=await supabase.rpc("admin_team_accounts");
 if(r.error) throw r.error; setAccounts(r.data??[]);
 }catch(e){setError((e as {message?:string}).message??"Unable to load users. Apply migration 202609230015 and retry.");}finally{setLoading(false);}}
 useEffect(()=>{
  let active=true;
  void supabase.rpc("admin_team_accounts").then(r=>{
   if(!active)return;
   if(r.error)setError(r.error.message);else setAccounts(r.data??[]);
   setLoading(false);
  });
  return ()=>{active=false;};
 },[]);
 async function save(){setBusy(true);setError("");setSuccess("");try{
 const r=await supabase.rpc("admin_assign_team_account",{p_account:account,p_team:team}); if(r.error)throw r.error;
 await load();await onSaved();setSuccess("Team membership saved. Login and role are unchanged.");
 }catch(e){setError((e as {message?:string}).message??"Unable to save team.");}finally{setBusy(false);}}
 const selected=accounts.find(a=>a.id===account);
 return <form className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5" onSubmit={e=>{e.preventDefault();void save();}}>
 <h2 className="font-semibold">Assign existing user</h2>
 <p className="text-sm text-slate-500">Create the user in Supabase Authentication, then refresh users here. Saving moves the selected user to one team.</p>
 <fieldset disabled={busy||loading} className="flex flex-wrap items-end gap-3">
 <label className="grid min-w-0 flex-1 gap-1 text-sm">User<select required className="min-w-0 rounded-lg border p-2" value={account} onChange={e=>{setAccount(e.target.value);setSuccess("");}}><option value="">Select existing account</option>{accounts.map(a=><option key={a.id} value={a.id} disabled={!a.is_active}>{a.full_name} — {a.email}{a.is_active?"":" (inactive)"}</option>)}</select></label>
 <label className="grid gap-1 text-sm">Team<select required className="rounded-lg border p-2" value={team} onChange={e=>setTeam(e.target.value)}><option value="">Select team</option>{teams.filter(t=>t.is_active).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
 <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">{busy?"Saving…":"Save team"}</button></fieldset>
 {selected&&<p className="text-sm">Current team: {teams.find(t=>t.id===selected.team_id)?.name??"Not assigned"}</p>}
 <button type="button" disabled={busy||loading} onClick={()=>void load()} className="text-sm underline">{loading?"Loading users…":"Refresh users"}</button>
 {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{success&&<p role="status" className="text-sm text-emerald-700">{success}</p>}
 </form>;
}
