import type {SalesLead} from '../types/sales';
export function verifiedSalesMembers(harish:string='',abinaya:string=''){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(harish)||!uuid.test(abinaya)||harish.toLowerCase()===abinaya.toLowerCase())return [];
 return [{id:harish.toLowerCase(),name:'Harish'},{id:abinaya.toLowerCase(),name:'Abinaya'}];
}
export function salesChartWins(leads:SalesLead[],members:{id:string}[],month:string,ownerId=''){
 const ids=new Set(members.map(m=>m.id));
 return leads.filter(l=>ids.has(l.ownerId)&&(!ownerId||l.ownerId===ownerId)&&l.stage==='won'&&l.wonOn?.startsWith(month));
}
