import { supabase } from './supabase';
import type { SalesLead } from '../types';

export async function getSalesLeads(): Promise<SalesLead[]> {
  const { data, error } = await supabase
    .from('sales_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }
  return (data ?? []).map((lead: any) => ({
    id: lead.id,
    name: lead.name,
    company: lead.company,
    ownerId: lead.owner_id || lead.ownerId || '',
    ownerName: lead.owner_name || lead.ownerName || 'Unassigned',
    source: lead.source || 'Website',
    stage: lead.stage || 'lead',
    createdOn: lead.created_at || lead.createdOn || new Date().toISOString(),
    wonOn: lead.won_on || null,
    revenue: lead.revenue || 0,
    nextFollowUp: lead.next_follow_up || null,
    contactName: lead.contact_name,
    email: lead.email,
    phone: lead.phone,
    notes: lead.notes,
  }));
}
