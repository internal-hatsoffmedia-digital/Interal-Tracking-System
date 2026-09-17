// Supabase sales module view model; see 202609050003_sales_tracker.sql.
export type SalesSource = 'Cold Call' | 'Cold DM' | 'Field Visit' | 'Website' | 'Digital Mktg';
export type SalesStage = 'lead' | 'prospect' | 'proposal' | 'won' | 'lost';
export interface SalesLead {
  id: string;
  name: string;
  company: string;
  ownerId: string;
  ownerName: string;
  source: SalesSource;
  stage: SalesStage;
  createdOn: string;
  wonOn: string | null;
  revenue: number;
  nextFollowUp: string | null;
  contactName?:string;
  email?:string;
  phone?:string;
  campaign?:string;
  notes?:string;
  updatedAt?:string;
}
export interface SalesActivity { id: string; leadId: string; ownerId: string; occurredOn: string; kind?:string; notes?:string }
export type SalesAccess='admin'|'manager'|'member'|'viewer';
export interface SalesPerson {id:string;full_name:string;access_level:SalesAccess|null}
export interface SalesData {
  leads: SalesLead[];
  activities: SalesActivity[];
  monthlyTargets: Record<string, number>;
  people?:SalesPerson[];
  access?:SalesAccess;
}
