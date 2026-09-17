const leads=new Set(['muskan','ganesh','sudeesh','vijay','janani']);
const coordinators=new Set(['lavanya','esther']);
export function employeeIdentity(fullName){
 const first=String(fullName??'').trim().split(/\s+/)[0];
 if(!/^[a-zA-Z]{2,}$/.test(first))throw new Error(`Review the first name for ${fullName || 'unnamed employee'}`);
 const name=first[0].toUpperCase()+first.slice(1).toLowerCase();
 return {key:first.toLowerCase(),email:(first.toLowerCase()==='vijay'?'vijayr':first.toLowerCase())+'@hatsoffmedia.in',password:name+'41@'};
}
export function buildProvisionPlan(employees,users,profiles){
 const seen=new Set();
 return employees.map(e=>{
  const identity=employeeIdentity(e.full_name);
  if(seen.has(identity.email))throw new Error(`Duplicate generated email ${identity.email}. Resolve employee names before provisioning.`);
  seen.add(identity.email);
  const web=['nadeem','snega','vijay'].includes(identity.key);
  const linked=e.profile_id?users.find(u=>u.id===e.profile_id):null;
  const match=users.find(u=>u.email?.toLowerCase()===identity.email);
  if(e.profile_id&&!linked)throw new Error(`Employee ${e.id} has a profile without a matching Auth account. Review it first.`);
  if(match&&match.id!==linked?.id&&match.app_metadata?.hatsoff_employee_id!==e.id)throw new Error(`Email ${identity.email} already belongs to an unlinked account. Verify ownership before linking it.`);
  const existing=linked||match;
  const profile=profiles.find(p=>p.id===existing?.id);
  if(web&&profile&&['admin','director'].includes(profile.role))throw new Error(`Review privileged account ${e.full_name} before changing its team role.`);
  return {employee:e,key:identity.key,email:identity.email,web,accountId:existing?.id??null,
   action:linked?'keep_existing':existing?'resume_link':'create',
   role:web?(identity.key==='vijay'?'associate_lead':'employee'):profile?.role??(leads.has(identity.key)?'associate_lead':coordinators.has(identity.key)?'project_coordinator':'employee')};
 });
}
