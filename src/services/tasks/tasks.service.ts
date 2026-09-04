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
}


/* =========================================================
   LOAD ACTIVE RELATIONS
========================================================= */

async function getTaskRelations() {
  const [
    clientsResult,
    projectsResult,
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
        "id, name, series_title",
      )
      .eq("is_active", true)
      .order("name", {
        ascending: true,
      }),
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


  return {
    clients:
      (clientsResult.data ??
        []) as ClientRelation[],

    projects:
      (projectsResult.data ??
        []) as ProjectRelation[],
  };
}


/* =========================================================
   ATTACH RELATIONS
========================================================= */

function attachRelations(
  tasks: Task[],
  clients: ClientRelation[],
  projects: ProjectRelation[],
): TaskWithRelations[] {
  return tasks.map(
    (task) => ({
      ...task,

      client:
        clients.find(
          (client) =>
            client.id ===
            task.client_id,
        ) ?? null,

      project:
        projects.find(
          (project) =>
            project.id ===
            task.project_id,
        ) ?? null,
    }),
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
  } =
    await getTaskRelations();


  return attachRelations(
    tasks,
    clients,
    projects,
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
  } =
    await getTaskRelations();


  return (
    attachRelations(
      [data as Task],
      clients,
      projects,
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
  } =
    await getTaskRelations();


  return attachRelations(
    tasks,
    clients,
    projects,
  );
}


/* =========================================================
   GET TASKS BY CLIENT
========================================================= */

export async function getTasksByClient(
  clientId: string,
): Promise<TaskWithRelations[]> {
  const {
    data,
    error,
  } = await supabase
    .from("tasks")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", {
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
  } =
    await getTaskRelations();


  return attachRelations(
    tasks,
    clients,
    projects,
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
          input.client_id,

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