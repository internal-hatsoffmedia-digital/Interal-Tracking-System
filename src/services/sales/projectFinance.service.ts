import {supabase} from '../../lib/supabase';
import type {FinanceInput, ProjectFinanceData} from '../../types/projectFinance';
import {isFinanceMonth} from '../../lib/projectFinanceMetrics';
export async function loadProjectFinance(): Promise<ProjectFinanceData> {
  const {data,error}=await supabase.rpc('project_finance_data');
  if(error)throw new Error(error.message);
  if(!data || !Array.isArray(data.projects) || !Array.isArray(data.items))throw new Error('Project finance returned an invalid response.');
  // Read the client directory under the caller's existing RLS, independently of projects.
  const clients: {id:string;name:string}[]=[];
  for(let offset=0;;offset+=500){
    const page=await supabase.from('clients').select('id,name').order('id').range(offset,offset+499);
    if(page.error)throw new Error(page.error.message);
    clients.push(...(page.data??[]));
    if((page.data?.length??0)<500)break;
  }
  return {...data,clients} as ProjectFinanceData;
}
export async function saveProjectFinanceItem(input: FinanceInput) {
  if(!input.project_id || !input.label.trim() || input.label.trim().length>120)throw new Error('Select a project and enter a label of up to 120 characters.');
  if(!Number.isFinite(input.amount)||input.amount<0)throw new Error('Enter a non-negative amount.');
  if(!isFinanceMonth(input.start_month.slice(0,7)) || !input.start_month.endsWith('-01'))throw new Error('Choose a valid starting month.');
  if(input.end_month && (input.frequency!=='monthly'||!isFinanceMonth(input.end_month.slice(0,7))||!input.end_month.endsWith('-01')||input.end_month<input.start_month))throw new Error('The ending month cannot precede the starting month.');
  const {error}=await supabase.rpc('save_project_finance_item',{
    p_project_id:input.project_id,p_label:input.label.trim(),p_kind:input.kind,p_amount:input.amount,
    p_frequency:input.frequency,p_start_month:input.start_month,p_end_month:input.end_month,
    p_notes:input.notes,p_id:input.id??null,p_expected_updated_at:input.updated_at??null,
  });
  if(error)throw new Error(error.message);
}
