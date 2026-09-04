import { supabase } from "../../lib/supabase";

import type {
  MyWorkItem,
  MyWorkStats,
} from "../../types/myWork";

/* =========================================================
   GET CURRENT EMPLOYEE
========================================================= */

async function getCurrentEmployee() {
  const {
    data: {
      user,
    },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Unable to get current user: ${userError.message}`,
    );
  }

  if (!user) {
    throw new Error(
      "No authenticated user found.",
    );
  }

  const {
    data: employee,
    error,
  } =
    await supabase
      .from("employees")
      .select("*")
      .eq(
        "profile_id",
        user.id,
      )
      .eq(
        "is_active",
        true,
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load employee profile: ${error.message}`,
    );
  }

  if (!employee) {
    throw new Error(
      "No active employee record is linked to this account.",
    );
  }

  return employee;
}

/* =========================================================
   LOAD RELATIONS
========================================================= */

async function getRelations() {
  const [
    tasksResult,
    clientsResult,
    projectsResult,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*"),

    supabase
      .from("clients")
      .select(
        "id, name, short_name",
      ),

    supabase
      .from("projects")
      .select(
        "id, name, series_title",
      ),
  ]);

  if (tasksResult.error) {
    throw new Error(
      `Unable to load tasks: ${tasksResult.error.message}`,
    );
  }

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
    tasks:
      tasksResult.data ?? [],

    clients:
      clientsResult.data ?? [],

    projects:
      projectsResult.data ?? [],
  };
}

/* =========================================================
   GET MY WORK
========================================================= */

export async function getMyWork(): Promise<
  MyWorkItem[]
> {
  const employee =
    await getCurrentEmployee();

  const {
    data: assignments,
    error: assignmentError,
  } =
    await supabase
      .from(
        "task_assignments",
      )
      .select("*")
      .eq(
        "employee_id",
        employee.id,
      )
      .order(
        "assigned_at",
        {
          ascending: false,
        },
      );

  if (assignmentError) {
    throw new Error(
      `Unable to load assigned tasks: ${assignmentError.message}`,
    );
  }

  if (
    !assignments ||
    assignments.length === 0
  ) {
    return [];
  }

  const {
    tasks,
    clients,
    projects,
  } =
    await getRelations();

  return assignments
    .map(
      (assignment) => {
        const task =
          tasks.find(
            (item) =>
              item.id ===
              assignment.task_id,
          );

        if (!task) {
          return null;
        }

        const client =
          clients.find(
            (item) =>
              item.id ===
              task.client_id,
          );

        const project =
          projects.find(
            (item) =>
              item.id ===
              task.project_id,
          );

        return {
          assignment_id:
            assignment.id,

          task_id:
            task.id,

          task_title:
            task.title,

          task_description:
            task.description ??
            null,

          client_id:
            client?.id ?? null,

          client_name:
            client?.name ??
            null,

          client_short_name:
            client?.short_name ??
            null,

          project_id:
            project?.id ?? null,

          project_name:
            project?.name ??
            null,

          series_title:
            project?.series_title ??
            null,

          category:
            task.category,

          revision_status:
            task.revision_status,

          priority:
            task.priority,

          task_status:
            task.status,

          assignment_status:
            assignment.status,

          planned_date:
            task.planned_date ??
            null,

          start_date:
            task.start_date ??
            null,

          due_date:
            task.due_date ??
            null,

          estimated_hours:
            Number(
              task.estimated_hours ??
                0,
            ),

          actual_hours:
            Number(
              task.actual_hours ??
                0,
            ),

          footage_link:
            task.footage_link ??
            null,

          special_notes:
            task.special_notes ??
            null,

          delay_reason:
            task.delay_reason ??
            null,

          assigned_at:
            assignment.assigned_at,

          accepted_at:
            assignment.accepted_at ??
            null,

          completed_at:
            assignment.completed_at ??
            null,

          assignment_notes:
            assignment.notes ??
            null,
        } satisfies MyWorkItem;
      },
    )
    .filter(
      (
        item,
      ): item is MyWorkItem =>
        item !== null,
    );
}

/* =========================================================
   GET MY WORK STATS
========================================================= */

export async function getMyWorkStats(): Promise<
  MyWorkStats
> {
  const work =
    await getMyWork();

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  const stats: MyWorkStats = {
    total: work.length,
    assigned: 0,
    accepted: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    estimatedHours: 0,
    actualHours: 0,
  };

  work.forEach(
    (item) => {
      const status =
        String(
          item.assignment_status ??
            "",
        ).toLowerCase();

      if (
        status ===
        "assigned"
      ) {
        stats.assigned++;
      }

      if (
        status ===
        "accepted"
      ) {
        stats.accepted++;
      }

      if (
        status ===
        "in_progress"
      ) {
        stats.inProgress++;
      }

      if (
        status ===
        "completed"
      ) {
        stats.completed++;
      }

      stats.estimatedHours +=
        Number(
          item.estimated_hours ??
            0,
        );

      stats.actualHours +=
        Number(
          item.actual_hours ??
            0,
        );

      if (
        item.due_date &&
        status !==
          "completed"
      ) {
        const dueDate =
          new Date(
            item.due_date,
          );

        if (
          dueDate <
          today
        ) {
          stats.overdue++;
        }
      }
    },
  );

  return stats;
}

/* =========================================================
   UPDATE MY WORK STATUS
========================================================= */

export async function updateMyWorkStatus(
  assignmentId: string,
  status: string,
): Promise<void> {
  /*
   * Do not guess or introduce enum values here.
   * The UI should only send values supported
   * by the database.
   */

  const updates: Record<
    string,
    unknown
  > = {
    status,
  };

  const now =
    new Date().toISOString();

  if (
    status ===
    "accepted"
  ) {
    updates.accepted_at =
      now;
  }

  if (
    status ===
    "completed"
  ) {
    updates.completed_at =
      now;
  }

  const {
    error,
  } =
    await supabase
      .from(
        "task_assignments",
      )
      .update(updates)
      .eq(
        "id",
        assignmentId,
      );

  if (error) {
    throw new Error(
      `Unable to update task status: ${error.message}`,
    );
  }
}