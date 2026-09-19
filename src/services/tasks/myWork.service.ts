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

  // 1. Try RPC get_current_employee_profile (handles auto-linking & self-provisioning)
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "get_current_employee_profile"
    );

    if (!rpcErr && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      return rpcData[0];
    }
  } catch (e) {
    console.warn("get_current_employee_profile RPC failed, falling back to direct table queries:", e);
  }

  // 2. Direct match by profile_id
  let {
    data: employee,
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

  if (employee) {
    return employee;
  }

  // 3. Self-healing fallback: match by email or name if profile_id link is missing
  if (user.email) {
    const userEmail = user.email.trim().toLowerCase();
    const userPrefix = userEmail.split("@")[0].replace(/[^a-zA-Z]/g, "");

    const { data: allActiveEmployees } = await supabase
      .from("employees")
      .select("*")
      .eq("is_active", true);

    if (allActiveEmployees && allActiveEmployees.length > 0) {
      const match = allActiveEmployees.find((e) => {
        const empEmail = (e.email ?? "").trim().toLowerCase();
        const empName = (e.full_name ?? "").trim().toLowerCase();
        return (
          (empEmail && empEmail === userEmail) ||
          (userPrefix && userPrefix.length > 2 && empEmail.includes(userPrefix)) ||
          (userPrefix && userPrefix.length > 2 && empName.includes(userPrefix))
        );
      });

      if (match) {
        employee = match;
        void supabase
          .from("employees")
          .update({ profile_id: user.id })
          .eq("id", match.id);
        return employee;
      }
    }
  }

  throw new Error(
    "No active employee record is linked to this account.",
  );
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

  // 1. Fetch assignment to get task_id
  const { data: assignmentData, error: fetchErr } = await supabase
    .from("task_assignments")
    .select("id, task_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (fetchErr) {
    console.error("Failed to fetch assignment details:", fetchErr);
  }

  // 2. Update assignment status
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

  // 3. Reflect status onto parent task so coordinator & admin dashboards update
  if (assignmentData?.task_id) {
    let parentTaskStatus: string | null = null;

    if (status === "in_progress") {
      parentTaskStatus = "editing_in_progress";
    } else if (status === "completed") {
      // Moves to Internal Review for the Project Coordinator & Admin to review and approve!
      parentTaskStatus = "internal_review";
    }

    if (parentTaskStatus) {
      const { data: updatedTask, error: taskUpdateErr } = await supabase
        .from("tasks")
        .update({
          status: parentTaskStatus,
          updated_at: now,
        })
        .eq("id", assignmentData.task_id)
        .select("id, project_id, status")
        .maybeSingle();

      if (taskUpdateErr) {
        console.error("Failed to update parent task status:", taskUpdateErr);
      }

      // If task has an associated project, refresh project assets progress
      if (updatedTask?.project_id) {
        try {
          const { data: projectTasks } = await supabase
            .from("tasks")
            .select("id, status")
            .eq("project_id", updatedTask.project_id);

          if (projectTasks && projectTasks.length > 0) {
            const completedCount = projectTasks.filter(
              (t) =>
                t.status === "approved_delivered" ||
                t.status === "approved_and_delivered" ||
                t.status === "completed"
            ).length;

            const { data: projectRow } = await supabase
              .from("projects")
              .select("total_assets_required")
              .eq("id", updatedTask.project_id)
              .maybeSingle();

            const total = Number(
              projectRow?.total_assets_required ?? projectTasks.length
            );
            const pending = Math.max(0, total - completedCount);

            await supabase
              .from("projects")
              .update({
                completed_assets: completedCount,
                pending_assets: pending,
                updated_at: now,
              })
              .eq("id", updatedTask.project_id);
          }
        } catch (projErr) {
          console.error("Failed to update project progress:", projErr);
        }
      }
    }
  }
}