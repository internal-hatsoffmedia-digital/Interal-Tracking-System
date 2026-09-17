// Run on a trusted admin machine only. Never expose the service key in VITE_* variables.
// Default: preview. --apply creates missing Auth users without sending email.
import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {buildProvisionPlan,employeeIdentity} from './employee-account-plan.mjs';
const apply=process.argv.includes('--apply');
const env=await readFile(new URL('../.env',import.meta.url),'utf8').catch(()=>'');
const url=process.env.SUPABASE_URL||env.match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)?.[1];
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Set SUPABASE_SERVICE_ROLE_KEY in this admin terminal. Never put it in a VITE_* variable or paste it into chat. No accounts have been changed.');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
async function check(result){if(result.error)throw new Error(result.error.message);return result.data;}
async function rows(table,columns){let all=[];for(let start=0;;start+=500){const data=await check(await db.from(table).select(columns).order('id').range(start,start+499));all.push(...data);if(data.length<500)return all;}}
const employees=await rows('employees','id,profile_id,full_name,email,team_id,is_active');
const profiles=await rows('profiles','id,role,team_id,is_active');
const teams=await rows('teams','id,name,is_active');
const users=[];for(let page=1;;page++){const data=await check(await db.auth.admin.listUsers({page,perPage:500}));users.push(...data.users);if(data.users.length<500)break;}
const plan=buildProvisionPlan(employees,users,profiles);
for(const name of ['nadeem','snega','vijay'])if(!plan.some(p=>p.key===name))throw new Error(`No unique ${name} employee was found. Add/verify the employee directory entry first. Nothing was changed.`);
const named=teams.filter(t=>t.name.trim().toLowerCase()==='web runners');
const legacy=teams.filter(t=>t.name.trim().toLowerCase()==='web development');
if(named.length>1||(!named.length&&legacy.length>1))throw new Error('Ambiguous Web team names; resolve duplicates first.');
if((named[0]||legacy[0])?.is_active===false)throw new Error('The Web team is inactive. Review it before provisioning.');
console.table(plan.map(p=>({employee:p.employee.full_name,email:p.accountId?users.find(u=>u.id===p.accountId)?.email:p.email,action:p.action,role:p.role,team:p.web?'Web Runners':teams.find(t=>t.id===p.employee.team_id)?.name??'Unmapped',active:p.employee.is_active})));
console.log('Existing accounts retain their current email and password. New account passwords use the requested name pattern; passwords are not printed or saved. Inactive employees remain inactive and new inactive Auth accounts are banned.');
if(!apply){console.log('PREVIEW ONLY. Review this list, then run again with --apply.');process.exit(0);}
let team=named[0];
if(!team&&legacy[0])team=await check(await db.from('teams').update({name:'Web Runners'}).eq('id',legacy[0].id).select('id,name').single());
if(!team)team=await check(await db.from('teams').insert({name:'Web Runners',team_type:'other',is_active:true}).select('id,name').single());
let completed=0;
for(const p of plan){
 try{
  let uid=p.accountId;
  if(!uid){
   const data=await check(await db.auth.admin.createUser({email:p.email,password:employeeIdentity(p.employee.full_name).password,email_confirm:true,
    user_metadata:{full_name:p.employee.full_name},app_metadata:{hatsoff_employee_id:p.employee.id},...(p.employee.is_active?{}:{ban_duration:'876000h'})}));
   uid=data.user.id;
  }
  const teamId=p.web?team.id:p.employee.team_id;
  // Preserve already linked accounts; change only the requested Web team mapping for them.
  if(p.action!=='keep_existing')await check(await db.from('profiles').upsert({id:uid,full_name:p.employee.full_name,email:users.find(u=>u.id===uid)?.email??p.email,role:p.role,team_id:teamId,is_active:p.employee.is_active},{onConflict:'id'}));
  else if(p.web)await check(await db.from('profiles').update({team_id:team.id,role:p.role}).eq('id',uid).select('id').single());
  await check(await db.from('employees').update({profile_id:uid,...(p.web?{team_id:team.id}:{}),...(p.action==='keep_existing'?{}:{email:p.email})}).eq('id',p.employee.id).select('id').single());
  if(p.key==='vijay')await check(await db.from('teams').update({team_lead_id:uid}).eq('id',team.id).select('id').single());
  completed++;console.log(`${p.employee.full_name}: ${p.action==='create'?'created':'verified'}; linked successfully.`);
 }catch(error){console.error(`Stopped at employee ${p.employee.id}: ${error.message}. ${completed} employees completed. Rerun after resolving the error; newly created accounts are identified using trusted app metadata. Existing passwords were not reset.`);process.exitCode=1;break;}
}
