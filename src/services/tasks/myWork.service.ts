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

  const rpc = await supabase.rpc("get_current_employee_profile");
  if (!rpc.error && Array.isArray(rpc.data) && rpc.data.length && rpc.data[0].profile_id === user.id && rpc.data[0].is_active) return rpc.data[0];
  // Never guess a login identity by similar names or email prefixes.
  const {data:employee,error} = await supabase.from("employees").select("*")
    .eq("profile_id",user.id).eq("is_active",true).maybeSingle();
  if(error)throw new Error(`Unable to resolve your employee account: ${error.message}`);
  if(employee)return employee;
  throw new Error("No active employee record is linked to your login. Ask an administrator to link your Auth account in Employees. " + (rpc.error?.message || ""));

}

/* =========================================================
   LOAD RELATIONS
========================================================= */

async function getRelations(taskIds: string[]) {
  async function rows(table:string, ids:string[], columns="*") {
    const result: Record<string, any>[]=[];
    const unique=[...new Set(ids)];
    for(let i=0;i<unique.length;i+=100){
      const {data,error}=await supabase.from(table).select(columns).in("id",unique.slice(i,i+100));
      if(error)throw new Error(`Unable to load ${table}: ${error.message}`);
      result.push(...(data??[]));
    }
    return result;
  }
  const tasks=await rows("tasks",taskIds);
  const missing=taskIds.filter(id=>!tasks.some(t=>t.id===id));
  if(missing.length)throw new Error(`${missing.length} assigned task(s) are hidden by database access rules. Ask the administrator to run the assignment visibility repair SQL.`);
  const projects=await rows("projects",tasks.map(t=>t.project_id).filter(Boolean),"id,name,series_title,client_id");
  const allClientIds=[...tasks.map(t=>t.client_id),...projects.map(p=>p.client_id)].filter(Boolean);
  const clients=await rows("clients",allClientIds,"id,name,short_name");
  return {tasks,clients,projects};
}

/* =========================================================
   GET MY WORK
========================================================= */

export async function getMyWork(): Promise<
  MyWorkItem[]
> {
  const employee =
    await getCurrentEmployee();

  const assignments: Record<string, any>[]=[];
  for(let offset=0;;offset+=500){
    const {data,error}=await supabase.from("task_assignments").select("*")
      .eq("employee_id",employee.id).order("assigned_at",{ascending:false}).order("id").range(offset,offset+499);
    if(error)throw new Error(`Unable to load assigned tasks: ${error.message}`);
    assignments.push(...(data??[]).filter(a=>a.status!=="rejected"));if(!data||data.length<500)break;
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
    await getRelations(assignments.map(a=>a.task_id));

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
              (task.client_id || project?.client_id),
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