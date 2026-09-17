import type { SalesData, SalesLead, SalesSource } from '../types/sales';
export const salesSources: SalesSource[] = ['Cold Call','Cold DM','Field Visit','Website','Digital Mktg'];
export const sourceChannels: Record<SalesSource, string> = {
  'Cold Call':'Outbound','Cold DM':'Outbound','Field Visit':'Field','Website':'Campaigns','Digital Mktg':'Campaigns',
};
export function followUpGroup(lead: SalesLead, today: string) {
  if (!lead.nextFollowUp || lead.stage==='won' || lead.stage==='lost') return null;
  return lead.nextFollowUp<today ? 'Overdue' : lead.nextFollowUp===today ? 'Today' : 'Upcoming';
}
export function salesSummary(data: SalesData, month: string) {
  const cohort=data.leads.filter(l=>l.createdOn.startsWith(month));
  const won=data.leads.filter(l=>l.stage==='won' && l.wonOn?.startsWith(month));
  const revenue=won.reduce((sum,l)=>sum+l.revenue,0);
  const target=data.monthlyTargets[month] ?? null;
  return {leads:cohort.length,prospects:cohort.filter(l=>l.stage==='prospect').length,
    proposals:cohort.filter(l=>l.stage==='proposal').length,won:won.length,revenue,target,
    achievement:target && target>0 ? revenue/target*100 : null};
}
