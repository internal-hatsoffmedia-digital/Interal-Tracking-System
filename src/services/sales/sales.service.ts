import {supabase} from '../../lib/supabase';
import type {SalesAccess,SalesData,SalesLead,SalesPerson,SalesSource,SalesStage} from '../../types/sales';

interface LeadRow {
  id:string;name:string;company:string;owner_id:string;source:SalesSource;stage:SalesStage;
  created_at:string;won_at:string|null;deal_value:number|string;next_follow_up:string|null;
  contact_name:string;email:string;phone:string;campaign:string;notes:string;updated_at:string;
}
export class SalesSetupError extends Error {}
export async function loadSales():Promise<SalesData|null> {
  const access=await supabase.rpc('sales_my_access');
  if(access.error) {
    if(['PGRST202','42883'].includes(access.error.code))throw new SalesSetupError('The sales database update has not been applied yet.');
    throw new Error(access.error.message);
  }
  if(!access.data)return null;
  const rows:LeadRow[]=[];
  for(let start=0;;start+=500) {
    const r=await supabase.from('sales_leads').select('*').order('id').range(start,start+499);
    if(r.error)throw new Error(r.error.message);
    rows.push(...r.data as LeadRow[]);if(r.data.length<500)break;
  }
  const results=await Promise.allSettled([supabase.rpc('sales_people'),supabase.from('sales_targets').select('*')]);
  for(const r of results){if(r.status==='rejected')throw r.reason;if(r.value.error)throw new Error(r.value.error.message);}
  const people=(results[0].status==='fulfilled'?results[0].value.data:[]) as SalesPerson[];
  const targets=(results[1].status==='fulfilled'?results[1].value.data:[]) as {month:string;amount:number|string}[];
  const activities:SalesData['activities']=[];
  for(let start=0;;start+=500) {
    const r=await supabase.from('sales_activities').select('*').order('id').range(start,start+499);
    if(r.error)throw new Error(r.error.message);
    activities.push(...r.data.map(a=>({id:a.id,leadId:a.lead_id,ownerId:a.actor_id,occurredOn:a.occurred_at,kind:a.kind,notes:a.notes})));
    if(r.data.length<500)break;
  }
  return {access:access.data as SalesAccess,people,activities,monthlyTargets:Object.fromEntries(targets.map(t=>[t.month.slice(0,7),Number(t.amount)])),
    leads:rows.map(l=>({id:l.id,name:l.name,company:l.company,ownerId:l.owner_id,ownerName:people.find(p=>p.id===l.owner_id)?.full_name ?? 'Owner unavailable',source:l.source,stage:l.stage,
      createdOn:l.created_at.slice(0,10),wonOn:l.won_at?.slice(0,10) ?? null,revenue:Number(l.deal_value),nextFollowUp:l.next_follow_up,
      contactName:l.contact_name,email:l.email,phone:l.phone,campaign:l.campaign,notes:l.notes,updatedAt:l.updated_at}))};
}
export async function saveSalesLead(lead:SalesLead|null,input:Record<string,unknown>) {
  const {error}=await supabase.rpc('sales_save_lead',{p_id:lead?.id ?? null,p_input:input,p_expected_updated_at:lead?.updatedAt ?? null});
  if(error)throw new Error(error.message);
}
export async function logSalesActivity(id:string,kind:string,notes:string,next:string,complete:boolean) {
  const {error}=await supabase.rpc('sales_log_activity',{p_lead_id:id,p_kind:kind,p_notes:notes,p_follow_up:next || null,p_complete_follow_up:complete});
  if(error)throw new Error(error.message);
}
export async function setSalesTarget(month:string,amount:number) {
  const {error}=await supabase.rpc('sales_set_target',{p_month:`${month}-01`,p_amount:amount});if(error)throw new Error(error.message);
}
export async function grantSalesAccess(profileId:string,level:string|null) {
  const {error}=await supabase.rpc('sales_grant_access',{p_profile_id:profileId,p_access_level:level});if(error)throw new Error(error.message);
}
