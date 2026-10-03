import { supabase } from './supabase';
import type {
  CreateTaskInput,
  Task,
  TaskWithRelations,
  UpdateTaskInput,
} from '../types';

async function getTaskRelations() {
  const [clientsResult, projectsResult, assignmentsResult, employeesResult] = await Promise.all([
    supabase.from('clients').select('id, name, short_name').eq('is_active', true).order('name', { ascending: true }),
    supabase.from('projects').select('id, name, series_title').eq('is_active', true).order('name', { ascending: true }),
    supabase.from('task_assignments').select('id, task_id, employee_id, status, notes, assigned_at').order('assigned_at', { ascending: false }),
    supabase.from('employees').select('id, full_name, employee_code, email, job_title, team_id'),
  ]);

  for (const result of [clientsResult, projectsResult, assignmentsResult, employeesResult]) {
    if (result.error) throw new Error(`Unable to load task details: ${result.error.message}`);
  }

  return {
    clients: clientsResult.data ?? [],
    projects: projectsResult.data ?? [],
    assignments: assignmentsResult.data ?? [],
    employees: employeesResult.data ?? [],
  };
}

function attachRelations(
  tasks: Task[],
  clients: any[],
  projects: any[],
  assignments: any[] = [],
  employees: any[] = []
): TaskWithRelations[] {
  return tasks.map((task) => {
    const taskAssignment = assignments.find((assignment) => assignment.task_id === task.id);
    const assignedEmployee = taskAssignment
      ? employees.find((employee) => employee.id === taskAssignment.employee_id) ?? null
      : null;

    return {
      ...task,
      client: clients.find((client) => client.id === task.client_id) ?? null,
      project: projects.find((project) => project.id === task.project_id) ?? null,
      assignment: taskAssignment
        ? {
            id: taskAssignment.id,
            status: taskAssignment.status,
            notes: taskAssignment.notes,
            assigned_at: taskAssignment.assigned_at,
            employee_id: taskAssignment.employee_id,
            employee: assignedEmployee,
          }
        : null,
    };
  });
}

export async function getTasks(): Promise<TaskWithRelations[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Unable to load tasks: ${error.message}`);
  const tasks = (data ?? []) as Task[];
  if (tasks.length === 0) return [];

  const { clients, projects, assignments, employees } = await getTaskRelations();
  return attachRelations(tasks, clients, projects, assignments, employees);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to create a task.');

  if (!input.project_id) throw new Error('Please select a project.');
  if (!input.client_id) throw new Error('Please select a client.');
  if (!input.title?.trim()) throw new Error('Task title is required.');
  const { data: project, error: projectError } = await supabase.from('projects')
    .select('client_id,is_active').eq('id', input.project_id).single();
  if (projectError) throw new Error(`Unable to verify project: ${projectError.message}`);
  if (!project?.is_active) throw new Error('Please select an active project.');
  if (project.client_id !== input.client_id) throw new Error('The task client must match the selected project.');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: input.project_id,
      client_id: input.client_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category,
      revision_status: input.revision_status,
      priority: input.priority,
      status: input.status,
      planned_date: input.planned_date || null,
      start_date: input.start_date || null,
      due_date: input.due_date || null,
      estimated_hours: input.estimated_hours || 0,
      actual_hours: input.actual_hours || 0,
      footage_link: input.footage_link?.trim() || null,
      special_notes: input.special_notes?.trim() || null,
      delay_reason: input.delay_reason?.trim() || null,
      created_by: user?.id ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Unable to create task: ${error.message}`);
  return data as Task;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Unable to update task: ${error.message}`);
  return data as Task;
}
