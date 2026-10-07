import { supabase } from "../../lib/supabase";

import type {
  CreateTaskInput,
  Task,
  TaskWithRelations,
  UpdateTaskInput,
} from "../../types/task";


/* =========================================================
   RELATION TYPES
========================================================= */

interface ClientRelation {
  id: string;
  name: string;
  short_name: string | null;
}

interface ProjectRelation {
  id: string;
  name: string;
  series_title: string | null;
  client_id?: string | null;
}

interface EmployeeRelation {
  id: string;
  full_name: string;
  employee_code: string;
  email: string;
  job_title: string | null;
  team_id: string | null;
}

interface AssignmentRelation {
  id: string;
  assigned_by: string | null;
  task_id: string;
  employee_id: string;
  status: string;
  notes: string | null;
  assigned_at: string;
}


/* =========================================================
   LOAD ACTIVE RELATIONS
========================================================= */

async function getTaskRelations() {
  const [
    clientsResult,
    projectsResult,
    assignmentsResult,
    employeesResult,
    profilesResult,
  ] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, name, short_name",
      )
      .eq("is_active", true)
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("projects")
      .select(
        "id, name, series_title, client_id",
      )
      .eq("is_active", true)
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("task_assignments")
      .select(
        "id, task_id, employee_id, assigned_by, status, notes, assigned_at",
      )
      .order("assigned_at", {
        ascending: false,
      }),

    supabase
      .from("employees")
      .select(
        "id, full_name, employee_code, email, job_title, team_id, profile_id",
      ),

    supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, team_id",
      ),
  ]);


  if (clientsResult.error) {
    throw new Error(
      `Unable to load clients: ${clientsResult.error.message}`,
    );
  }


  if (projectsResult.error) {
    throw new Error(
      `Unable to load projects: ${projectsResult.error.message}`,
    );
  }


  if (assignmentsResult.error) throw new Error(`Unable to load assignments: ${assignmentsResult.error.message}`);
  if (employeesResult.error) throw new Error(`Unable to load assignees: ${employeesResult.error.message}`);
  if (profilesResult.error) throw new Error(`Unable to load assigners: ${profilesResult.error.message}`);

  return {
    clients:
      (clientsResult.data ??
        []) as ClientRelation[],

    projects:
      (projectsResult.data ??
        []) as ProjectRelation[],

    assignments:
      (assignmentsResult.data ??
        []) as AssignmentRelation[],

    employees:
      (employeesResult.data ??
        []) as (EmployeeRelation & { profile_id?: string | null })[],

    profiles:
      (profilesResult.data ??
        []) as { id: string; full_name: string; email?: string }[],
  };
}


/* =========================================================
   ATTACH RELATIONS
========================================================= */

function attachRelations(
  tasks: Task[],
  clients: ClientRelation[],
  projects: ProjectRelation[],
  assignments: AssignmentRelation[] = [],
  employees: (EmployeeRelation & { profile_id?: string | null })[] = [],
  profiles: { id: string; full_name: string; email?: string }[] = [],
): TaskWithRelations[] {
  const userMap = new Map<string, { id: string; full_name: string; email?: string }>();
  for (const prof of profiles) {
    if (prof.id && prof.full_name) {
      userMap.set(prof.id, prof);
    }
  }
  for (const emp of employees) {
    if (emp.id && emp.full_name && !userMap.has(emp.id)) {
      userMap.set(emp.id, { id: emp.id, full_name: emp.full_name, email: emp.email });
    }
    if (emp.profile_id && emp.full_name && !userMap.has(emp.profile_id)) {
      userMap.set(emp.profile_id, { id: emp.profile_id, full_name: emp.full_name, email: emp.email });
    }
  }

  return tasks.map(
    (task) => {
      const taskAssignment =
        assignments.find(
          (assignment) =>
            assignment.task_id ===
            task.id,
        );

      const assignedEmployee =
        taskAssignment
          ? employees.find(
              (employee) =>
                employee.id ===
                taskAssignment.employee_id,
            ) ?? null
          : null;

      const creatorObj = task.created_by ? userMap.get(task.created_by) ?? null : null;
      const creatorName = creatorObj ? creatorObj.full_name : null;

      return {
        ...task,

        creator_name: creatorName,
        assignments: assignments.filter(assignment => assignment.task_id === task.id).map(assignment => ({
          ...assignment,
          assigner_name: assignment.assigned_by ? userMap.get(assignment.assigned_by)?.full_name ?? null : null,
          employee: employees.find(employee => employee.id === assignment.employee_id) ?? null,
        })),
        creator: creatorObj ? { id: creatorObj.id, full_name: creatorObj.full_name, email: creatorObj.email } : null,

        project:
          projects.find(
            (project) =>
              project.id ===
              task.project_id,
          ) ?? null,

        client:
          clients.find(
            (client) =>
              client.id ===
              (task.client_id || projects.find((p) => p.id === task.project_id)?.client_id),
          ) ?? null,

        assignment:
          taskAssignment
            ? {
                id: taskAssignment.id,
                status:
                  taskAssignment.status,
                notes:
                  taskAssignment.notes,
                assigned_at:
                  taskAssignment.assigned_at,
                employee_id:
                  taskAssignment.employee_id,
                employee:
                  assignedEmployee,
              }
            : null,
      };
    },
  );
}


/* =========================================================
   GET ALL TASKS
========================================================= */

export async function getTasks(): Promise<
  TaskWithRelations[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", {
      ascending: false,
    });


  if (error) {
    throw new Error(
      `Unable to load tasks: ${error.message}`,
    );
  }


  const tasks =
    (data ?? []) as Task[];


  if (tasks.length === 0) {
    return [];
  }


  const {
    clients,
    projects,
    assignments,
    employees,
    profiles,
  } =
    await getTaskRelations();


  return attachRelations(
    tasks,
    clients,
    projects,
    assignments,
    employees,
    profiles,
  );
}


/* =========================================================
   GET TASK BY ID
========================================================= */

export async function getTaskById(
  id: string,
): Promise<TaskWithRelations | null> {
  const {
    data,
    error,
  } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();


  if (error) {
    throw new Error(
      `Unable to load task: ${error.message}`,
    );
  }


  if (!data) {
    return null;
  }


  const {
    clients,
    projects,
    assignments,
    employees,
    profiles,
  } =
    await getTaskRelations();


  return (
    attachRelations(
      [data as Task],
      clients,
      projects,
      assignments,
      employees,
      profiles,
    )[0] ?? null
  );
}


/* =========================================================
   GET TASKS BY PROJECT
========================================================= */

export async function getTasksByProject(
  projectId: string,
): Promise<TaskWithRelations[]> {
  const {
    data,
    error,
  } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", {
      ascending: false,
    });


  if (error) {
    throw new Error(
      `Unable to load project tasks: ${error.message}`,
    );
  }


  const tasks =
    (data ?? []) as Task[];


  if (tasks.length === 0) {
    return [];
  }


  const {
    clients,
    projects,
    assignments,
    employees,
  } =
    await getTaskRelations();


  return attachRelations(
    tasks,
    clients,
    projects,
    assignments,
    employees,
  );
}


/* =========================================================
   GET TASKS BY CLIENT
========================================================= */

export async function getTasksByClient(
  clientId: string,
): Promise<TaskWithRelations[]> {
  const { data: clientProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", clientId);

  const projectIds = (clientProjects ?? []).map((p) => p.id).filter(Boolean);

  let query = supabase.from("tasks").select("*");

  if (projectIds.length > 0) {
    query = query.or(
      `client_id.eq.${clientId},project_id.in.(${projectIds.join(",")})`,
    );
  } else {
    query = query.eq("client_id", clientId);
  }

  const {
    data,
    error,
  } = await query.order("created_at", {
    ascending: false,
  });


  if (error) {
    throw new Error(
      `Unable to load client tasks: ${error.message}`,
    );
  }


  const tasks =
    (data ?? []) as Task[];


  if (tasks.length === 0) {
    return [];
  }


  const {
    clients,
    projects,
    assignments,
    employees,
  } =
    await getTaskRelations();


  return attachRelations(
    tasks,
    clients,
    projects,
    assignments,
    employees,
  );
}


/* =========================================================
   CREATE TASK
========================================================= */

export async function createTask(
  input: CreateTaskInput,
): Promise<Task> {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();


  if (!input.project_id) {
    throw new Error(
      "Please select a project.",
    );
  }


  if (!input.client_id) {
    throw new Error(
      "Please select a client.",
    );
  }


  if (!input.title.trim()) {
    throw new Error(
      "Task title is required.",
    );
  }


  const estimatedHours =
    Math.max(
      0,
      Number(
        input.estimated_hours ??
          0,
      ),
    );


  const actualHours =
    Math.max(
      0,
      Number(
        input.actual_hours ??
          0,
      ),
    );


  const {
    data,
    error,
  } =
    await supabase
      .from("tasks")
      .insert({
        project_id:
          input.project_id,

        client_id:
          input.client_id || (input.project_id ? (await supabase.from("projects").select("client_id").eq("id", input.project_id).maybeSingle()).data?.client_id : null) || null,

        title:
          input.title.trim(),

        description:
          input.description?.trim() ||
          null,

        category:
          input.category,

        revision_status:
          input.revision_status,

        priority:
          input.priority,

        status:
          input.status,

        planned_date:
          input.planned_date ||
          null,

        start_date:
          input.start_date ||
          null,

        due_date:
          input.due_date ||
          null,

        estimated_hours:
          estimatedHours,

        actual_hours:
          actualHours,

        footage_link:
          input.footage_link?.trim() ||
          null,

        special_notes:
          input.special_notes?.trim() ||
          null,

        delay_reason:
          input.delay_reason?.trim() ||
          null,

        created_by:
          user?.id ?? null,
      })
      .select("*")
      .single();


  if (error) {
    throw new Error(
      `Unable to create task: ${error.message}`,
    );
  }


  return data as Task;
}


/* =========================================================
   UPDATE TASK
========================================================= */

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const updates: Record<
    string,
    unknown
  > = {};


  if (
    input.project_id !==
    undefined
  ) {
    updates.project_id =
      input.project_id;
  }


  if (
    input.client_id !==
    undefined
  ) {
    updates.client_id =
      input.client_id;
  }


  if (
    input.title !==
    undefined
  ) {
    if (!input.title.trim()) {
      throw new Error(
        "Task title is required.",
      );
    }

    updates.title =
      input.title.trim();
  }


  if (
    input.description !==
    undefined
  ) {
    updates.description =
      input.description?.trim() ||
      null;
  }


  if (
    input.category !==
    undefined
  ) {
    updates.category =
      input.category;
  }


  if (
    input.revision_status !==
    undefined
  ) {
    updates.revision_status =
      input.revision_status;
  }


  if (
    input.priority !==
    undefined
  ) {
    updates.priority =
      input.priority;
  }


  if (
    input.status !==
    undefined
  ) {
    updates.status =
      input.status;
  }


  if (
    input.planned_date !==
    undefined
  ) {
    updates.planned_date =
      input.planned_date ||
      null;
  }


  if (
    input.start_date !==
    undefined
  ) {
    updates.start_date =
      input.start_date ||
      null;
  }


  if (
    input.due_date !==
    undefined
  ) {
    updates.due_date =
      input.due_date ||
      null;
  }


  if (
    input.estimated_hours !==
    undefined
  ) {
    updates.estimated_hours =
      Math.max(
        0,
        Number(
          input.estimated_hours,
        ),
      );
  }


  if (
    input.actual_hours !==
    undefined
  ) {
    updates.actual_hours =
      Math.max(
        0,
        Number(
          input.actual_hours,
        ),
      );
  }


  if (
    input.footage_link !==
    undefined
  ) {
    updates.footage_link =
      input.footage_link?.trim() ||
      null;
  }


  if (
    input.special_notes !==
    undefined
  ) {
    updates.special_notes =
      input.special_notes?.trim() ||
      null;
  }


  if (
    input.delay_reason !==
    undefined
  ) {
    updates.delay_reason =
      input.delay_reason?.trim() ||
      null;
  }


  if (
    Object.keys(
      updates,
    ).length === 0
  ) {
    throw new Error(
      "No task changes were provided.",
    );
  }


  const {
    data,
    error,
  } =
    await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();


  if (error) {
    throw new Error(
      `Unable to update task: ${error.message}`,
    );
  }


  return data as Task;
}


/* =========================================================
   UPDATE TASK STATUS
========================================================= */

export async function updateTaskStatus(
  id: string,
  taskStatus: string,
): Promise<Task> {
  return updateTask(
    id,
    {
      status:
        taskStatus,
    },
  );
}


/* =========================================================
   UPDATE TASK ACTUAL HOURS
========================================================= */

export async function updateTaskActualHours(
  id: string,
  actualHours: number,
): Promise<Task> {
  return updateTask(
    id,
    {
      actual_hours:
        Math.max(
          0,
          Number(
            actualHours,
          ),
        ),
    },
  );
}
