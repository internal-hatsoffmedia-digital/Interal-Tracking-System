export interface FinanceProject {
  sales_completed_at?:string|null; team_id?:string|null; production_team_ids?:string[]; id: string; project_code: string; name: string; client_id: string; client_name: string;
  status: string; rate: number | string | null; created_at: string; is_active: boolean; can_edit: boolean;
}
export interface FinanceItem {
  id: string; project_id: string; label: string; kind: 'charge' | 'expense'; amount: number | string;
  frequency: 'once' | 'monthly'; start_month: string; end_month: string | null; notes: string;
  created_by: string; creator_name: string; created_at: string; updated_at: string;
}
export interface FinanceClient { id: string; name: string }
export interface OpeningSale { month:string; category:string; team_name:string; amount:number|string; salesperson:string }
export interface OpeningPeriod { month:string; target:number|string; tracking_starts_on:string; source_note:string }
export interface ProjectFinanceData { teams?:{id:string;name:string}[]; opening_sales?:OpeningSale[]; opening_periods?:OpeningPeriod[]; clients?: FinanceClient[]; projects: FinanceProject[]; items: FinanceItem[] }
export type FinanceInput = Pick<FinanceItem,'project_id'|'label'|'kind'|'frequency'|'start_month'|'end_month'|'notes'> & {amount: number; id?:string; updated_at?:string};
