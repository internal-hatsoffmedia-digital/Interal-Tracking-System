import { supabase } from "../../lib/supabase";

import type {
  CreateTaskAssignmentInput,
  TaskAssignment,
  TaskAssignmentWithRelations,
  UpdateTaskAssignmentInput,
  UpdateTaskAssignmentStatusInput,
} from "../../types/taskAssignment";

/* =========================================================
   RELATION TYPES
========================================================= */

interface TaskRelation {
  id: string;
  title: string;
  project_id: string;
  client_id: string;
  category: string;
  priority: string;
  status: string;
  planned_date: string | null;
  due_date: string | null;
  estimated_hours: number;
}

interface EmployeeRelation {
  id: string;
  full_name: string;
  employee_code: string;
  email: string;
  job_title: string | null;
  team_id: string | null;
}

interface ProfileRelation {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
}

/* =========================================================
   LOAD RELATIONS
========================================================= */

async function getAssignmentRelations(
  assignments: TaskAssignment[],
) {
  const taskIds = [
    ...new Set(
      assignments
        .map(
          (assignment) =>
            assignment.task_id,
        )
        .filter(Boolean),
    ),
  ];

  const employeeIds = [
    ...new Set(
      assignments
        .map(
          (assignment) =>
            assignment.employee_id,
        )
        .filter(Boolean),
    ),
  ];

  const assignedByIds = [
    ...new Set(
      assignments
        .map(
          (assignment) =>
            assignment.assigned_by,
        )
        .filter(Boolean),
    ),
  ];

  const [
    tasksResult,
    employeesResult,
    profilesResult,
  ] = await Promise.all([
    taskIds.length > 0
      ? supabase
          .from("tasks")
          .select(
            `
              id,
              title,
              project_id,
              client_id,
              category,
              priority,
              status,
              planned_date,
              due_date,
              estimated_hours
            `,
          )
          .in("id", taskIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    employeeIds.length > 0
      ? supabase
          .from("employees")
          .select(
            `
              id,
              full_name,
              employee_code,
              email,
              job_title,
              team_id
            `,
          )
          .in("id", employeeIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    assignedByIds.length > 0
      ? supabase
          .from("profiles")
          .select(
            `
              id,
              full_name,
              email,
              role
            `,
          )
          .in("id", assignedByIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  if (tasksResult.error) {
    throw new Error(
      `Unable to load assignment tasks: ${tasksResult.error.message}`,
    );
  }

  if (employeesResult.error) {
    throw new Error(
      `Unable to load assignment employees: ${employeesResult.error.message}`,
    );
  }

  if (profilesResult.error) {
    throw new Error(
      `Unable to load assignment profiles: ${profilesResult.error.message}`,
    );
  }

  return {
    tasks:
      (tasksResult.data ??
        []) as TaskRelation[],

    employees:
      (employeesResult.data ??
        []) as EmployeeRelation[],

    profiles:
      (profilesResult.data ??
        []) as ProfileRelation[],
  };
}

/* =========================================================
   ATTACH RELATIONS
========================================================= */

function attachRelations(
  assignments: TaskAssignment[],
  tasks: TaskRelation[],
  employees: EmployeeRelation[],
  profiles: ProfileRelation[],
): TaskAssignmentWithRelations[] {
  return assignments.map(
    (assignment) => ({
      ...assignment,

      task:
        tasks.find(
          (task) =>
            task.id ===
            assignment.task_id,
        ) ?? null,

      employee:
        employees.find(
          (employee) =>
            employee.id ===
            assignment.employee_id,
        ) ?? null,

      assigned_by_profile:
        profiles.find(
          (profile) =>
            profile.id ===
            assignment.assigned_by,
        ) ?? null,
    }),
  );
}

/* =========================================================
   GET ALL ASSIGNMENTS
========================================================= */

export async function getTaskAssignments(): Promise<
  TaskAssignmentWithRelations[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("task_assignments")
    .select("*")
    .order("assigned_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Unable to load task assignments: ${error.message}`,
    );
  }

  const assignments =
    (data ?? []) as TaskAssignment[];

  if (assignments.length === 0) {
    return [];
  }

  const {
    tasks,
    employees,
    profiles,
  } =
    await getAssignmentRelations(
      assignments,
    );

  return attachRelations(
    assignments,
    tasks,
    employees,
    profiles,
  );
}

/* =========================================================
   GET ASSIGNMENT BY ID
========================================================= */

export async function getTaskAssignmentById(
  id: string,
): Promise<TaskAssignmentWithRelations | null> {
  const {
    data,
    error,
  } = await supabase
    .from("task_assignments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load task assignment: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  const assignment =
    data as TaskAssignment;

  const {
    tasks,
    employees,
    profiles,
  } =
    await getAssignmentRelations([
      assignment,
    ]);

  return (
    attachRelations(
      [assignment],
      tasks,
      employees,
      profiles,
    )[0] ?? null
  );
}

/* =========================================================
   GET ASSIGNMENTS BY TASK
========================================================= */

export async function getTaskAssignmentsByTask(
  taskId: string,
): Promise<TaskAssignmentWithRelations[]> {
  const {
    data,
    error,
  } = await supabase
    .from("task_assignments")
    .select("*")
    .eq("task_id", taskId)
    .order("assigned_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Unable to load task assignments: ${error.message}`,
    );
  }

  const assignments =
    (data ?? []) as TaskAssignment[];

  if (assignments.length === 0) {
    return [];
  }

  const {
    tasks,
    employees,
    profiles,
  } =
    await getAssignmentRelations(
      assignments,
    );

  return attachRelations(
    assignments,
    tasks,
    employees,
    profiles,
  );
}

/* =========================================================
   GET ASSIGNMENTS BY EMPLOYEE
========================================================= */

export async function getTaskAssignmentsByEmployee(
  employeeId: string,
): Promise<TaskAssignmentWithRelations[]> {
  const {
    data,
    error,
  } = await supabase
    .from("task_assignments")
    .select("*")
    .eq("employee_id", employeeId)
    .order("assigned_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Unable to load employee assignments: ${error.message}`,
    );
  }

  const assignments =
    (data ?? []) as TaskAssignment[];

  if (assignments.length === 0) {
    return [];
  }

  const {
    tasks,
    employees,
    profiles,
  } =
    await getAssignmentRelations(
      assignments,
    );

  return attachRelations(
    assignments,
    tasks,
    employees,
    profiles,
  );
}

/* =========================================================
   CREATE ASSIGNMENT
========================================================= */

export async function createTaskAssignment(
  input: CreateTaskAssignmentInput,
): Promise<TaskAssignment> {
  if (!input.task_id) {
    throw new Error(
      "Task is required.",
    );
  }

  if (!input.employee_id) {
    throw new Error(
      "Employee is required.",
    );
  }

  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "You must be logged in to assign a task.",
    );
  }

  /*
   * assigned_by is deliberately taken
   * from the authenticated Supabase user.
   *
   * This prevents the browser from
   * pretending another user assigned
   * the task.
   */

  const {
    data,
    error,
  } = await supabase
    .from("task_assignments")
    .insert({
      task_id:
        input.task_id,

      employee_id:
        input.employee_id,

      assigned_by:
        user.id,

      notes:
        input.notes?.trim() ||
        null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Unable to assign task: ${error.message}`,
    );
  }

  return data as TaskAssignment;
}

/* =========================================================
   UPDATE ASSIGNMENT
========================================================= */

export async function updateTaskAssignment(
  id: string,
  input: UpdateTaskAssignmentInput,
): Promise<TaskAssignment> {
  const updates: Record<
    string,
    unknown
  > = {};

  if (
    input.employee_id !==
    undefined
  ) {
    if (!input.employee_id) {
      throw new Error(
        "Employee is required.",
      );
    }

    updates.employee_id =
      input.employee_id;
  }

  if (
    input.status !==
    undefined
  ) {
    updates.status =
      input.status;
  }

  if (
    input.notes !==
    undefined
  ) {
    updates.notes =
      input.notes?.trim() ||
      null;
  }

  if (
    Object.keys(updates)
      .length === 0
  ) {
    throw new Error(
      "No assignment changes were provided.",
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("task_assignments")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Unable to update task assignment: ${error.message}`,
    );
  }

  return data as TaskAssignment;
}

/* =========================================================
   UPDATE ASSIGNMENT STATUS
========================================================= */

export async function updateTaskAssignmentStatus(
  id: string,
  input:
    | UpdateTaskAssignmentStatusInput
    | string,
): Promise<TaskAssignment> {
  const status =
    typeof input === "string"
      ? input
      : input.status;

  const notes =
    typeof input === "string"
      ? undefined
      : input.notes;

  if (!status) {
    throw new Error(
      "Assignment status is required.",
    );
  }

  const updates: Record<
    string,
    unknown
  > = {
    status,
  };

  if (notes !== undefined) {
    updates.notes =
      notes?.trim() || null;
  }

  /*
   * Automatically record acceptance
   * and completion timestamps.
   */

  if (
    status === "accepted"
  ) {
    updates.accepted_at =
      new Date().toISOString();
  }

  if (
    status === "completed"
  ) {
    updates.completed_at =
      new Date().toISOString();
  }

  const {
    data,
    error,
  } = await supabase
    .from("task_assignments")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Unable to update assignment status: ${error.message}`,
    );
  }

  return data as TaskAssignment;
}

/* =========================================================
   ACCEPT ASSIGNMENT
========================================================= */

export async function acceptTaskAssignment(
  id: string,
): Promise<TaskAssignment> {
  return updateTaskAssignmentStatus(
    id,
    {
      status: "accepted",
    },
  );
}

/* =========================================================
   COMPLETE ASSIGNMENT
========================================================= */

export async function completeTaskAssignment(
  id: string,
): Promise<TaskAssignment> {
  return updateTaskAssignmentStatus(
    id,
    {
      status: "completed",
    },
  );
}

/* =========================================================
   REJECT ASSIGNMENT
========================================================= */

export async function rejectTaskAssignment(
  id: string,
  notes?: string,
): Promise<TaskAssignment> {
  return updateTaskAssignmentStatus(
    id,
    {
      status: "rejected",
      notes,
    },
  );
}

/* =========================================================
   DELETE / UNASSIGN
========================================================= */

export async function deleteTaskAssignment(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("task_assignments")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(
      `Unable to unassign task: ${error.message}`,
    );
  }
}