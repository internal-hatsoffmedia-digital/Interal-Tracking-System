import { supabase } from './supabase';
import { getWorkspaceProfile } from './profile.service';
import { canManageWork } from './access';
import type {
  CreateProjectInput,
  Project,
  ProjectWithRelations,
  UpdateProjectInput,
} from '../types';

async function getProjectRelations() {
  const [clientsResult, employeesResult] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, short_name')
      .order('name', { ascending: true }),

    supabase
      .from('employees')
      .select('id, full_name, employee_code')
      .order('full_name', { ascending: true }),
  ]);

  if (clientsResult.error) throw new Error(`Unable to load project clients: ${clientsResult.error.message}`);
  if (employeesResult.error) throw new Error(`Unable to load project people: ${employeesResult.error.message}`);

  return {
    clients: clientsResult.data ?? [],
    employees: employeesResult.data ?? [],
  };
}

function attachRelations(
  projects: Project[],
  clients: { id: string; name: string; short_name: string | null }[],
  employees: { id: string; full_name: string; employee_code: string }[]
): ProjectWithRelations[] {
  return projects.map((project) => ({
    ...project,
    client: clients.find((client) => client.id === project.client_id) ?? null,
    lead_employee: employees.find((employee) => employee.id === project.lead_employee_id) ?? null,
  }));
}

export async function getProjects(): Promise<ProjectWithRelations[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Unable to load projects: ${error.message}`);
  }

  const projects = (data ?? []) as Project[];
  if (projects.length === 0) return [];

  const { clients, employees } = await getProjectRelations();
  return attachRelations(projects, clients, employees);
}

export async function getActiveProjects(): Promise<ProjectWithRelations[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Unable to load active projects: ${error.message}`);
  }

  const projects = (data ?? []) as Project[];
  if (projects.length === 0) return [];

  const { clients, employees } = await getProjectRelations();
  return attachRelations(projects, clients, employees);
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to create a project.');
  const profile = await getWorkspaceProfile(user.id);
  if (!canManageWork(profile)) throw new Error('Your role cannot create projects.');
  if (profile.role !== 'admin' && !profile.team_id) throw new Error('Your coordinator team is missing. Contact your administrator.');

  if (!input.client_id) throw new Error('Client is required.');
  if (!input.name?.trim()) throw new Error('Project name is required.');

  const totalAssets = Math.max(0, Number(input.total_assets_required ?? 0));
  const completedAssets = Math.max(0, Number(input.completed_assets ?? 0));
  if (!Number.isFinite(totalAssets) || !Number.isFinite(completedAssets) || completedAssets > totalAssets) {
    throw new Error('Asset counts must be valid and completed assets cannot exceed the total.');
  }
  const pendingAssets = Math.max(0, totalAssets - completedAssets);

  const { data, error } = await supabase
    .from('projects')
    .insert({
      client_id: input.client_id,
      name: input.name.trim(),
      series_title: input.series_title?.trim() || null,
      description: input.description?.trim() || null,
      total_assets_required: totalAssets,
      completed_assets: completedAssets,
      pending_assets: pendingAssets,
      lead_employee_id: input.lead_employee_id || null,
      start_date: input.start_date || null,
      target_deadline: input.target_deadline || null,
      status: input.status,
      health: input.health,
      invoice_status: input.invoice_status,
      is_active: true,
      created_by: user?.id ?? null,
      team_id: profile.team_id,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Unable to create project: ${error.message}`);
  return data as Project;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Unable to update project: ${error.message}`);
  return data as Project;
}
