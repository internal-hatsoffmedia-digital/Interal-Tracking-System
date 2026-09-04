import { supabase } from "../../lib/supabase";

import type {
  CreatePerformanceRecordInput,
  EmployeePerformanceSummary,
  PerformanceDashboardSummary,
  PerformanceRecord,
  PerformanceRecordWithRelations,
  UpdatePerformanceRecordInput,
} from "../../types/performance";

/* =========================================================
   RELATION TYPES
========================================================= */

interface EmployeeRelation {
  id: string;
  full_name: string;
  employee_code: string;
  email: string;
  job_title: string | null;
  team_id: string | null;
}

interface TaskRelation {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  estimated_hours: number;
  actual_hours: number;
  due_date: string | null;
}

interface TimesheetRelation {
  id: string;
  employee_id: string;
  task_id: string;
  work_date: string;
  total_hours: number;
  performance: string;
}

/* =========================================================
   PERFORMANCE STATUS
========================================================= */

export function calculatePerformance(
  completedTasks: number,
  delayedTasks: number,
  totalTasks: number,
): string {
  if (totalTasks <= 0) {
    return "green";
  }

  const completionRate =
    (completedTasks /
      totalTasks) *
    100;

  const delayRate =
    (delayedTasks /
      totalTasks) *
    100;

  /*
   * GREEN
   * Strong completion and low delay.
   */

  if (
    completionRate >= 80 &&
    delayRate <= 10
  ) {
    return "green";
  }

  /*
   * RED
   * Significant delay or low completion.
   */

  if (
    delayRate > 30 ||
    completionRate < 50
  ) {
    return "red";
  }

  /*
   * ORANGE
   * Needs attention.
   */

  return "orange";
}

/* =========================================================
   COMPLETED TASK CHECK
========================================================= */

function isCompletedStatus(
  status: string,
): boolean {
  const normalized =
    String(status)
      .toLowerCase();

  return (
    normalized ===
      "approved_delivered" ||
    normalized ===
      "approved_and_delivered" ||
    normalized ===
      "completed"
  );
}

/* =========================================================
   DELAYED TASK CHECK
========================================================= */

function isDelayedTask(
  task: TaskRelation,
): boolean {
  if (
    isCompletedStatus(
      task.status,
    )
  ) {
    return false;
  }

  if (!task.due_date) {
    return false;
  }

  const dueDate =
    new Date(
      task.due_date,
    );

  return (
    dueDate.getTime() <
    Date.now()
  );
}

/* =========================================================
   LOAD EMPLOYEES
========================================================= */

async function getEmployees(): Promise<
  EmployeeRelation[]
> {
  const {
    data,
    error,
  } = await supabase
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
   LOAD TASKS
========================================================= */

async function getTasks(): Promise<
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
        category,
        priority,
        status,
        estimated_hours,
        actual_hours,
        due_date
      `,
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
   LOAD TIMESHEETS
========================================================= */

async function getTimesheets(): Promise<
  TimesheetRelation[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("timesheets")
    .select(
      `
        id,
        employee_id,
        task_id,
        work_date,
        total_hours,
        performance
      `,
    );

  if (error) {
    throw new Error(
      `Unable to load timesheets: ${error.message}`,
    );
  }

  return (
    data ?? []
  ) as TimesheetRelation[];
}

/* =========================================================
   EMPLOYEE PERFORMANCE
========================================================= */

export async function getEmployeePerformance(): Promise<
  EmployeePerformanceSummary[]
> {
  const [
    employees,
    tasks,
    timesheets,
  ] = await Promise.all([
    getEmployees(),
    getTasks(),
    getTimesheets(),
  ]);

  return employees.map(
    (employee) => {
      /*
       * Timesheet records tell us which employee
       * worked on which task.
       */

      const employeeTimesheets =
        timesheets.filter(
          (entry) =>
            entry.employee_id ===
            employee.id,
        );

      const taskIds =
        new Set(
          employeeTimesheets.map(
            (entry) =>
              entry.task_id,
          ),
        );

      const employeeTasks =
        tasks.filter(
          (task) =>
            taskIds.has(
              task.id,
            ),
        );

      let completedTasks = 0;
      let delayedTasks = 0;
      let totalHours = 0;

      employeeTimesheets.forEach(
        (entry) => {
          totalHours += Number(
            entry.total_hours ??
              0,
          );
        },
      );

      employeeTasks.forEach(
        (task) => {
          if (
            isCompletedStatus(
              task.status,
            )
          ) {
            completedTasks++;
          }

          if (
            isDelayedTask(
              task,
            )
          ) {
            delayedTasks++;
          }
        },
      );

      const totalTasks =
        employeeTasks.length;

      const averageTaskHours =
        totalTasks > 0
          ? totalHours /
            totalTasks
          : 0;

      const completionRate =
        totalTasks > 0
          ? (completedTasks /
              totalTasks) *
            100
          : 0;

      const performance =
        calculatePerformance(
          completedTasks,
          delayedTasks,
          totalTasks,
        );

      return {
        employee_id:
          employee.id,

        employee_name:
          employee.full_name,

        employee_code:
          employee.employee_code,

        total_tasks:
          totalTasks,

        completed_tasks:
          completedTasks,

        delayed_tasks:
          delayedTasks,

        total_hours:
          Number(
            totalHours.toFixed(
              2,
            ),
          ),

        average_task_hours:
          Number(
            averageTaskHours.toFixed(
              2,
            ),
          ),

        completion_rate:
          Number(
            completionRate.toFixed(
              1,
            ),
          ),

        performance,
      };
    },
  );
}

/* =========================================================
   DASHBOARD SUMMARY
========================================================= */

export async function getPerformanceDashboardSummary(): Promise<
  PerformanceDashboardSummary
> {
  const employeePerformance =
    await getEmployeePerformance();

  let totalTasks = 0;
  let completedTasks = 0;
  let delayedTasks = 0;
  let totalHours = 0;

  let greenCount = 0;
  let orangeCount = 0;
  let redCount = 0;

  employeePerformance.forEach(
    (employee) => {
      totalTasks +=
        employee.total_tasks;

      completedTasks +=
        employee.completed_tasks;

      delayedTasks +=
        employee.delayed_tasks;

      totalHours +=
        employee.total_hours;

      switch (
        String(
          employee.performance,
        ).toLowerCase()
      ) {
        case "green":
          greenCount++;
          break;

        case "orange":
          orangeCount++;
          break;

        case "red":
          redCount++;
          break;
      }
    },
  );

  const averageTaskHours =
    totalTasks > 0
      ? totalHours /
        totalTasks
      : 0;

  const completionRate =
    totalTasks > 0
      ? (completedTasks /
          totalTasks) *
        100
      : 0;

  return {
    totalEmployees:
      employeePerformance.length,

    totalTasks,

    completedTasks,

    delayedTasks,

    totalHours: Number(
      totalHours.toFixed(
        2,
      ),
    ),

    averageTaskHours:
      Number(
        averageTaskHours.toFixed(
          2,
        ),
      ),

    greenCount,

    orangeCount,

    redCount,

    completionRate:
      Number(
        completionRate.toFixed(
          1,
        ),
      ),
  };
}

/* =========================================================
   PERFORMANCE RECORDS
========================================================= */

export async function getPerformanceRecords(): Promise<
  PerformanceRecordWithRelations[]
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "performance_records",
    )
    .select("*")
    .order(
      "period_start",
      {
        ascending: false,
      },
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    throw new Error(
      `Unable to load performance records: ${error.message}`,
    );
  }

  const records =
    (data ??
      []) as PerformanceRecord[];

  if (
    records.length ===
    0
  ) {
    return [];
  }

  const [
    employees,
    tasks,
  ] = await Promise.all([
    getEmployees(),
    getTasks(),
  ]);

  return records.map(
    (record) => ({
      ...record,

      employee:
        employees.find(
          (employee) =>
            employee.id ===
            record.employee_id,
        ) ?? null,

      task:
        record.task_id
          ? tasks.find(
              (task) =>
                task.id ===
                record.task_id,
            ) ?? null
          : null,
    }),
  );
}

/* =========================================================
   GET PERFORMANCE RECORD
========================================================= */

export async function getPerformanceRecordById(
  id: string,
): Promise<
  PerformanceRecordWithRelations | null
> {
  if (!id) {
    throw new Error(
      "Performance record ID is required.",
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "performance_records",
    )
    .select("*")
    .eq(
      "id",
      id,
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load performance record: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  const [
    employees,
    tasks,
  ] = await Promise.all([
    getEmployees(),
    getTasks(),
  ]);

  const record =
    data as PerformanceRecord;

  return {
    ...record,

    employee:
      employees.find(
        (employee) =>
          employee.id ===
          record.employee_id,
      ) ?? null,

    task:
      record.task_id
        ? tasks.find(
            (task) =>
              task.id ===
              record.task_id,
          ) ?? null
        : null,
  };
}

/* =========================================================
   CREATE PERFORMANCE RECORD
========================================================= */

export async function createPerformanceRecord(
  input: CreatePerformanceRecordInput,
): Promise<PerformanceRecord> {
  if (!input.employee_id) {
    throw new Error(
      "Employee is required.",
    );
  }

  if (!input.period_start) {
    throw new Error(
      "Period start is required.",
    );
  }

  if (!input.period_end) {
    throw new Error(
      "Period end is required.",
    );
  }

  if (
    input.period_end <
    input.period_start
  ) {
    throw new Error(
      "Period end cannot be before period start.",
    );
  }

  if (!input.performance) {
    throw new Error(
      "Performance status is required.",
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "performance_records",
      )
      .insert({
        employee_id:
          input.employee_id,

        task_id:
          input.task_id ||
          null,

        period_start:
          input.period_start,

        period_end:
          input.period_end,

        tasks_completed:
          Math.max(
            0,
            Number(
              input.tasks_completed ??
                0,
            ),
          ),

        tasks_delayed:
          Math.max(
            0,
            Number(
              input.tasks_delayed ??
                0,
            ),
          ),

        total_hours:
          Math.max(
            0,
            Number(
              input.total_hours ??
                0,
            ),
          ),

        average_task_hours:
          Math.max(
            0,
            Number(
              input.average_task_hours ??
                0,
            ),
          ),

        performance:
          input.performance,

        remarks:
          input.remarks?.trim() ||
          null,
      })
      .select("*")
      .single();

  if (error) {
    throw new Error(
      `Unable to create performance record: ${error.message}`,
    );
  }

  return data as PerformanceRecord;
}

/* =========================================================
   UPDATE PERFORMANCE RECORD
========================================================= */

export async function updatePerformanceRecord(
  id: string,
  input: UpdatePerformanceRecordInput,
): Promise<PerformanceRecord> {
  if (!id) {
    throw new Error(
      "Performance record ID is required.",
    );
  }

  const updates: Record<
    string,
    unknown
  > = {};

  if (
    input.employee_id !==
    undefined
  ) {
    updates.employee_id =
      input.employee_id;
  }

  if (
    input.task_id !==
    undefined
  ) {
    updates.task_id =
      input.task_id ||
      null;
  }

  if (
    input.period_start !==
    undefined
  ) {
    updates.period_start =
      input.period_start;
  }

  if (
    input.period_end !==
    undefined
  ) {
    updates.period_end =
      input.period_end;
  }

  if (
    input.tasks_completed !==
    undefined
  ) {
    updates.tasks_completed =
      Math.max(
        0,
        Number(
          input.tasks_completed,
        ),
      );
  }

  if (
    input.tasks_delayed !==
    undefined
  ) {
    updates.tasks_delayed =
      Math.max(
        0,
        Number(
          input.tasks_delayed,
        ),
      );
  }

  if (
    input.total_hours !==
    undefined
  ) {
    updates.total_hours =
      Math.max(
        0,
        Number(
          input.total_hours,
        ),
      );
  }

  if (
    input.average_task_hours !==
    undefined
  ) {
    updates.average_task_hours =
      Math.max(
        0,
        Number(
          input.average_task_hours,
        ),
      );
  }

  if (
    input.performance !==
    undefined
  ) {
    updates.performance =
      input.performance;
  }

  if (
    input.remarks !==
    undefined
  ) {
    updates.remarks =
      input.remarks?.trim() ||
      null;
  }

  if (
    Object.keys(
      updates,
    ).length === 0
  ) {
    throw new Error(
      "No performance changes were provided.",
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "performance_records",
      )
      .update(updates)
      .eq(
        "id",
        id,
      )
      .select("*")
      .single();

  if (error) {
    throw new Error(
      `Unable to update performance record: ${error.message}`,
    );
  }

  return data as PerformanceRecord;
}

/* =========================================================
   EMPLOYEE PERFORMANCE BY ID
========================================================= */

export async function getEmployeePerformanceById(
  employeeId: string,
): Promise<EmployeePerformanceSummary | null> {
  if (!employeeId) {
    throw new Error(
      "Employee ID is required.",
    );
  }

  const summaries =
    await getEmployeePerformance();

  return (
    summaries.find(
      (summary) =>
        summary.employee_id ===
        employeeId,
    ) ?? null
  );
}