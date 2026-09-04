import { supabase } from "../../lib/supabase";

import type {
  CreateTimesheetInput,
  Timesheet,
  TimesheetWithRelations,
  UpdateTimesheetInput,
} from "../../types/timesheet";

/* =========================================================
   TYPES
========================================================= */

interface EmployeeRelation {
  id: string;
  full_name: string;
  employee_code: string;
  email: string;
}

interface TaskRelation {
  id: string;
  title: string;
  client_id: string;
  project_id: string;
  category: string;
  priority: string;
  status: string;
  estimated_hours: number;
  due_date: string | null;
}

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
   CALCULATE HOURS
========================================================= */

export function calculateTotalHours(
  startTime: string,
  endTime: string | null | undefined,
): number {
  if (
    !startTime ||
    !endTime
  ) {
    return 0;
  }

  const start =
    new Date(
      startTime,
    ).getTime();

  const end =
    new Date(
      endTime,
    ).getTime();

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    end <= start
  ) {
    return 0;
  }

  const hours =
    (end - start) /
    (1000 * 60 * 60);

  return Number(
    hours.toFixed(2),
  );
}

/* =========================================================
   LOAD RELATIONS
========================================================= */

async function getTimesheetRelations() {
  const [
    employeesResult,
    tasksResult,
    clientsResult,
    projectsResult,
  ] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "id, full_name, employee_code, email",
      )
      .eq(
        "is_active",
        true,
      )
      .order(
        "full_name",
        {
          ascending: true,
        },
      ),

    supabase
      .from("tasks")
      .select(
        `
          id,
          title,
          client_id,
          project_id,
          category,
          priority,
          status,
          estimated_hours,
          due_date
        `,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),

    supabase
      .from("clients")
      .select(
        "id, name, short_name",
      )
      .eq(
        "is_active",
        true,
      )
      .order(
        "name",
        {
          ascending: true,
        },
      ),

    supabase
      .from("projects")
      .select(
        "id, name, series_title",
      )
      .eq(
        "is_active",
        true,
      )
      .order(
        "name",
        {
          ascending: true,
        },
      ),
  ]);

  if (
    employeesResult.error
  ) {
    throw new Error(
      `Unable to load employees: ${employeesResult.error.message}`,
    );
  }

  if (
    tasksResult.error
  ) {
    throw new Error(
      `Unable to load tasks: ${tasksResult.error.message}`,
    );
  }

  if (
    clientsResult.error
  ) {
    throw new Error(
      `Unable to load clients: ${clientsResult.error.message}`,
    );
  }

  if (
    projectsResult.error
  ) {
    throw new Error(
      `Unable to load projects: ${projectsResult.error.message}`,
    );
  }

  return {
    employees:
      (employeesResult.data ??
        []) as EmployeeRelation[],

    tasks:
      (tasksResult.data ??
        []) as TaskRelation[],

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
  timesheets: Timesheet[],
  relations: {
    employees: EmployeeRelation[];
    tasks: TaskRelation[];
    clients: ClientRelation[];
    projects: ProjectRelation[];
  },
): TimesheetWithRelations[] {
  return timesheets.map(
    (timesheet) => {
      const employee =
        relations.employees.find(
          (item) =>
            item.id ===
            timesheet.employee_id,
        ) ?? null;

      const task =
        relations.tasks.find(
          (item) =>
            item.id ===
            timesheet.task_id,
        ) ?? null;

      const client =
        task
          ? relations.clients.find(
              (item) =>
                item.id ===
                task.client_id,
            ) ?? null
          : null;

      const project =
        task
          ? relations.projects.find(
              (item) =>
                item.id ===
                task.project_id,
            ) ?? null
          : null;

      return {
        ...timesheet,

        employee,

        task,

        client,

        project,
      };
    },
  );
}

/* =========================================================
   GET ALL TIMESHEETS
========================================================= */

export async function getTimesheets(): Promise<
  TimesheetWithRelations[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("timesheets")
    .select("*")
    .order(
      "work_date",
      {
        ascending: false,
      },
    )
    .order(
      "start_time",
      {
        ascending: false,
      },
    );

  if (error) {
    throw new Error(
      `Unable to load timesheets: ${error.message}`,
    );
  }

  const timesheets =
    (data ?? []) as Timesheet[];

  if (
    timesheets.length ===
    0
  ) {
    return [];
  }

  const relations =
    await getTimesheetRelations();

  return attachRelations(
    timesheets,
    relations,
  );
}

/* =========================================================
   GET TIMESHEETS BY EMPLOYEE
========================================================= */

export async function getTimesheetsByEmployee(
  employeeId: string,
): Promise<
  TimesheetWithRelations[]
> {
  if (!employeeId) {
    throw new Error(
      "Employee ID is required.",
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("timesheets")
    .select("*")
    .eq(
      "employee_id",
      employeeId,
    )
    .order(
      "work_date",
      {
        ascending: false,
      },
    )
    .order(
      "start_time",
      {
        ascending: false,
      },
    );

  if (error) {
    throw new Error(
      `Unable to load employee timesheets: ${error.message}`,
    );
  }

  const timesheets =
    (data ?? []) as Timesheet[];

  if (
    timesheets.length ===
    0
  ) {
    return [];
  }

  const relations =
    await getTimesheetRelations();

  return attachRelations(
    timesheets,
    relations,
  );
}

/* =========================================================
   GET TIMESHEETS BY TASK
========================================================= */

export async function getTimesheetsByTask(
  taskId: string,
): Promise<
  TimesheetWithRelations[]
> {
  if (!taskId) {
    throw new Error(
      "Task ID is required.",
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("timesheets")
    .select("*")
    .eq(
      "task_id",
      taskId,
    )
    .order(
      "work_date",
      {
        ascending: false,
      },
    );

  if (error) {
    throw new Error(
      `Unable to load task timesheets: ${error.message}`,
    );
  }

  const timesheets =
    (data ?? []) as Timesheet[];

  if (
    timesheets.length ===
    0
  ) {
    return [];
  }

  const relations =
    await getTimesheetRelations();

  return attachRelations(
    timesheets,
    relations,
  );
}

/* =========================================================
   GET TIMESHEET BY ID
========================================================= */

export async function getTimesheetById(
  id: string,
): Promise<
  TimesheetWithRelations | null
> {
  if (!id) {
    throw new Error(
      "Timesheet ID is required.",
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("timesheets")
    .select("*")
    .eq(
      "id",
      id,
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load timesheet: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  const relations =
    await getTimesheetRelations();

  return (
    attachRelations(
      [data as Timesheet],
      relations,
    )[0] ?? null
  );
}

/* =========================================================
   GET ACTIVE EMPLOYEES
========================================================= */

export async function getTimesheetEmployees(): Promise<
  EmployeeRelation[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("employees")
    .select(
      "id, full_name, employee_code, email",
    )
    .eq(
      "is_active",
      true,
    )
    .order(
      "full_name",
      {
        ascending: true,
      },
    );

  if (error) {
    throw new Error(
      `Unable to load employees: ${error.message}`,
    );
  }

  return (
    data ?? []
  ) as EmployeeRelation[];
}

/* =========================================================
   GET TASK OPTIONS
========================================================= */

export async function getTimesheetTasks(): Promise<
  TaskRelation[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("tasks")
    .select(
      `
        id,
        title,
        client_id,
        project_id,
        category,
        priority,
        status,
        estimated_hours,
        due_date
      `,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    throw new Error(
      `Unable to load tasks: ${error.message}`,
    );
  }

  return (
    data ?? []
  ) as TaskRelation[];
}

/* =========================================================
   CREATE TIMESHEET
========================================================= */

export async function createTimesheet(
  input: CreateTimesheetInput,
  employeeId: string,
): Promise<Timesheet> {
  if (!employeeId) {
    throw new Error(
      "Employee is required.",
    );
  }

  if (!input.task_id) {
    throw new Error(
      "Task is required.",
    );
  }

  if (!input.work_date) {
    throw new Error(
      "Work date is required.",
    );
  }

  if (!input.start_time) {
    throw new Error(
      "Start time is required.",
    );
  }

  if (!input.performance) {
    throw new Error(
      "Performance status is required.",
    );
  }

  const totalHours =
    calculateTotalHours(
      input.start_time,
      input.end_time,
    );

  if (
    input.end_time &&
    totalHours <= 0
  ) {
    throw new Error(
      "End time must be later than start time.",
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("timesheets")
      .insert({
        employee_id:
          employeeId,

        task_id:
          input.task_id,

        work_date:
          input.work_date,

        start_time:
          input.start_time,

        end_time:
          input.end_time ||
          null,

        total_hours:
          totalHours,

        delay_reason:
          input.delay_reason?.trim() ||
          null,

        performance:
          input.performance,

        notes:
          input.notes?.trim() ||
          null,
      })
      .select("*")
      .single();

  if (error) {
    throw new Error(
      `Unable to create timesheet: ${error.message}`,
    );
  }

  return data as Timesheet;
}

/* =========================================================
   UPDATE TIMESHEET
========================================================= */

export async function updateTimesheet(
  id: string,
  input: UpdateTimesheetInput,
): Promise<Timesheet> {
  if (!id) {
    throw new Error(
      "Timesheet ID is required.",
    );
  }

  const updates: Record<
    string,
    unknown
  > = {};

  if (
    input.task_id !==
    undefined
  ) {
    updates.task_id =
      input.task_id;
  }

  if (
    input.work_date !==
    undefined
  ) {
    updates.work_date =
      input.work_date;
  }

  if (
    input.start_time !==
    undefined
  ) {
    updates.start_time =
      input.start_time;
  }

  if (
    input.end_time !==
    undefined
  ) {
    updates.end_time =
      input.end_time ||
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
    input.performance !==
    undefined
  ) {
    updates.performance =
      input.performance;
  }

  if (
    input.notes !==
    undefined
  ) {
    updates.notes =
      input.notes?.trim() ||
      null;
  }

  /* -----------------------------------------------
     RECALCULATE HOURS
  ------------------------------------------------ */

  if (
    input.start_time !==
      undefined ||
    input.end_time !==
      undefined
  ) {
    const {
      data: current,
      error:
        currentError,
    } = await supabase
      .from("timesheets")
      .select(
        "start_time, end_time",
      )
      .eq(
        "id",
        id,
      )
      .single();

    if (currentError) {
      throw new Error(
        `Unable to read current timesheet: ${currentError.message}`,
      );
    }

    const start =
      input.start_time !==
      undefined
        ? input.start_time
        : current.start_time;

    const end =
      input.end_time !==
      undefined
        ? input.end_time
        : current.end_time;

    const totalHours =
      calculateTotalHours(
        start,
        end,
      );

    if (
      end &&
      totalHours <= 0
    ) {
      throw new Error(
        "End time must be later than start time.",
      );
    }

    updates.total_hours =
      totalHours;
  }

  if (
    Object.keys(
      updates,
    ).length === 0
  ) {
    throw new Error(
      "No timesheet changes were provided.",
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("timesheets")
      .update(updates)
      .eq(
        "id",
        id,
      )
      .select("*")
      .single();

  if (error) {
    throw new Error(
      `Unable to update timesheet: ${error.message}`,
    );
  }

  return data as Timesheet;
}

/* =========================================================
   UPDATE TIMESHEET END TIME
========================================================= */

export async function stopTimesheet(
  id: string,
  endTime?: string,
): Promise<Timesheet> {
  if (!id) {
    throw new Error(
      "Timesheet ID is required.",
    );
  }

  const finalEndTime =
    endTime ??
    new Date().toISOString();

  const {
    data: current,
    error:
      currentError,
  } = await supabase
    .from("timesheets")
    .select(
      "start_time",
    )
    .eq(
      "id",
      id,
    )
    .single();

  if (currentError) {
    throw new Error(
      `Unable to load timesheet: ${currentError.message}`,
    );
  }

  const totalHours =
    calculateTotalHours(
      current.start_time,
      finalEndTime,
    );

  if (
    totalHours <= 0
  ) {
    throw new Error(
      "End time must be later than start time.",
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("timesheets")
      .update({
        end_time:
          finalEndTime,

        total_hours:
          totalHours,
      })
      .eq(
        "id",
        id,
      )
      .select("*")
      .single();

  if (error) {
    throw new Error(
      `Unable to stop timesheet: ${error.message}`,
    );
  }

  return data as Timesheet;
}