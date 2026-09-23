import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
type Account = { id: string; email: string; full_name: string };
export default function AuthEmployeeForm({ onSaved }: { onSaved: () => Promise<void> }) {
 const [accounts,setAccounts]=useState<Account[]>([]);
 const [account,setAccount]=useState(""); const [name,setName]=useState("");
 const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [success,setSuccess]=useState("");
 async function refresh(){const r=await supabase.rpc("admin_team_accounts");if(r.error)throw new Error(r.error.code === "PGRST202" ? "Apply migrations 015 and 016 in Supabase, then refresh users." : r.error.message);setAccounts((r.data??[]).filter((a:Account)=>a.email?.includes("@")));}
 useEffect(()=>{let active=true;void supabase.rpc("admin_team_accounts").then(r=>{if(!active)return;if(r.error)setError(r.error.code === "PGRST202" ? "Authentication user setup is not installed. Apply migrations 015 and 016 in Supabase, then click Refresh Authentication users." : r.error.message);else setAccounts((r.data??[]).filter((a:Account)=>a.email?.includes("@")));});return()=>{active=false;};},[]);
 async function run(save:boolean){setBusy(true);setError("");setSuccess("");try{
 if(save){const r=await supabase.rpc("admin_save_auth_employee",{p_account:account,p_name:name.trim()});if(r.error)throw r.error;await onSaved();setSuccess("Employee saved. You can now create or assign their team in Teams.");}
 await refresh();
 }catch(e){setError((e as {message?:string}).message??"Unable to save employee.");}finally{setBusy(false);}}
 return <form className="space-y-3 rounded-2xl border bg-white p-5" onSubmit={e=>{e.preventDefault();void run(true);}}>
 <h2 className="font-semibold">Add employee from Authentication</h2>
 <p className="text-sm text-slate-500">Select an existing login email and enter their name. No team is required yet. Saving an existing employee updates their name without creating a duplicate.</p>
 <fieldset disabled={busy} className="flex flex-wrap items-end gap-3">
 <label className="grid min-w-0 flex-1 gap-1 text-sm">Authentication email<select required className="min-w-0 rounded-lg border p-2" value={account} onChange={e=>{setAccount(e.target.value);const a=accounts.find(a=>a.id===e.target.value);setName(a&&a.full_name!==a.email?a.full_name:"");setSuccess("");}}><option value="">Select email</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.email}</option>)}</select></label>
 <label className="grid flex-1 gap-1 text-sm">Employee name<input required maxLength={200} className="rounded-lg border p-2" value={name} onChange={e=>setName(e.target.value)}/></label>
 <button disabled={!name.trim()} className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{busy?"Saving…":"Save employee"}</button>
 <button type="button" onClick={()=>void run(false)} className="p-2 text-sm underline">Refresh Authentication users</button></fieldset>
 {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{success&&<p role="status" className="text-sm text-emerald-700">{success}</p>}
 <Link className="text-sm underline" to="/teams">Create a team or assign membership →</Link>
 </form>;
}
