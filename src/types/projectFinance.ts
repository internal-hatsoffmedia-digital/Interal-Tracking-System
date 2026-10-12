export interface FinanceProject {
  id: string; project_code: string; name: string; client_id: string; client_name: string;
  status: string; rate: number | string | null; created_at: string; is_active: boolean; can_edit: boolean;
}
export interface FinanceItem {
  id: string; project_id: string; label: string; kind: 'charge' | 'expense'; amount: number | string;
  frequency: 'once' | 'monthly'; start_month: string; end_month: string | null; notes: string;
  created_by: string; creator_name: string; created_at: string; updated_at: string;
}
export interface FinanceClient { id: string; name: string }
export interface ProjectFinanceData { clients?: FinanceClient[]; projects: FinanceProject[]; items: FinanceItem[] }
export type FinanceInput = Pick<FinanceItem,'project_id'|'label'|'kind'|'frequency'|'start_month'|'end_month'|'notes'> & {amount: number; id?:string; updated_at?:string};
