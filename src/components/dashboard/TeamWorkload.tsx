import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

/* ============================================================
   CONSTANTS
============================================================ */

const DAILY_CAPACITY_HOURS = 8;

/* ============================================================
   TYPES
============================================================ */

interface EmployeeRow {
  id: string;
  full_name: string | null;
  employee_code: string | null;
  job_title: string | null;
  team_id: string | null;
  is_active: boolean;
}

interface TeamRow {
  id: string;
  name: string;
  is_active: boolean;
}

interface AssignmentRow {
  id: string;
  employee_id: string;
  task_id: string;
  status: string | null;
}

interface TaskRow {
  id: string;
  estimated_hours: number | null;
  status: string | null;
  planned_date: string | null;
}

interface TimesheetRow {
  id: string;
  employee_id: string;
  work_date: string;
  total_hours: number | null;
}

interface WorkloadPerson {
  id: string;
  name: string;
  role: string;
  teamName: string;
  estimatedHours: number;
  loggedHours: number;
  capacity: number;
  assignedTasks: number;
}

/* ============================================================
   HELPERS
============================================================ */

function getTodayDate(): string {
  const today = new Date();

  const year =
    today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeStatus(
  value: string | null | undefined,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isActiveAssignment(
  status: string | null,
): boolean {
  const normalized =
    normalizeStatus(status);

  return ![
    "completed",
    "rejected",
    "cancelled",
    "canceled",
  ].includes(normalized);
}

function mapEmployee(
  value: unknown,
): EmployeeRow {
  const row =
    value as Record<
      string,
      unknown
    >;

  return {
    id: String(
      row.id ?? "",
    ),
    full_name:
      typeof row.full_name ===
      "string"
        ? row.full_name
        : null,
    employee_code:
      typeof row.employee_code ===
      "string"
        ? row.employee_code
        : null,
    job_title:
      typeof row.job_title ===
      "string"
        ? row.job_title
        : null,
    team_id:
      typeof row.team_id ===
      "string"
        ? row.team_id
        : null,
    is_active:
      typeof row.is_active ===
      "boolean"
        ? row.is_active
        : true,
  };
}

function mapTeam(
  value: unknown,
): TeamRow {
  const row =
    value as Record<
      string,
      unknown
    >;

  return {
    id: String(
      row.id ?? "",
    ),
    name: String(
      row.name ?? "No Team",
    ),
    is_active:
      typeof row.is_active ===
      "boolean"
        ? row.is_active
        : true,
  };
}

function mapAssignment(
  value: unknown,
): AssignmentRow {
  const row =
    value as Record<
      string,
      unknown
    >;

  return {
    id: String(
      row.id ?? "",
    ),
    employee_id: String(
      row.employee_id ?? "",
    ),
    task_id: String(
      row.task_id ?? "",
    ),
    status:
      typeof row.status ===
      "string"
        ? row.status
        : null,
  };
}

function mapTask(
  value: unknown,
): TaskRow {
  const row =
    value as Record<
      string,
      unknown
    >;

  return {
    id: String(
      row.id ?? "",
    ),
    estimated_hours:
      typeof row.estimated_hours ===
      "number"
        ? row.estimated_hours
        : Number(
            row.estimated_hours ??
              0,
          ),
    status:
      typeof row.status ===
      "string"
        ? row.status
        : null,
    planned_date:
      typeof row.planned_date ===
      "string"
        ? row.planned_date
        : null,
  };
}

function mapTimesheet(
  value: unknown,
): TimesheetRow {
  const row =
    value as Record<
      string,
      unknown
    >;

  return {
    id: String(
      row.id ?? "",
    ),
    employee_id: String(
      row.employee_id ?? "",
    ),
    work_date: String(
      row.work_date ?? "",
    ),
    total_hours:
      typeof row.total_hours ===
      "number"
        ? row.total_hours
        : Number(
            row.total_hours ??
              0,
          ),
  };
}

function getInitials(
  name: string,
): string {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length ===
    0
  ) {
    return "?";
  }

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0]
      .charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase();
}

function formatHours(
  hours: number,
): string {
  return `${hours.toFixed(1)}h`;
}

/* ============================================================
   COMPONENT
============================================================ */

function TeamWorkload() {
  const [employees, setEmployees] =
    useState<EmployeeRow[]>(
      [],
    );

  const [teams, setTeams] =
    useState<TeamRow[]>([]);

  const [assignments, setAssignments] =
    useState<AssignmentRow[]>(
      [],
    );

  const [tasks, setTasks] =
    useState<TaskRow[]>([]);

  const [timesheets, setTimesheets] =
    useState<TimesheetRow[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD WORKLOAD DATA
  ========================================================== */

  const loadWorkload =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const today =
          getTodayDate();

        /*
         * Load each dataset separately.
         *
         * This avoids depending on Supabase
         * relationship inference.
         */

        const [
          employeesResult,
          teamsResult,
          assignmentsResult,
          tasksResult,
          timesheetsResult,
        ] = await Promise.all([
          supabase
            .from("employees")
            .select(
              [
                "id",
                "full_name",
                "employee_code",
                "job_title",
                "team_id",
                "is_active",
              ].join(", "),
            )
            .eq(
              "is_active",
              true,
            ),

          supabase
            .from("teams")
            .select(
              [
                "id",
                "name",
                "is_active",
              ].join(", "),
            )
            .eq(
              "is_active",
              true,
            ),

          supabase
            .from("task_assignments")
            .select(
              [
                "id",
                "employee_id",
                "task_id",
                "status",
              ].join(", "),
            ),

          supabase
            .from("tasks")
            .select(
              [
                "id",
                "estimated_hours",
                "status",
                "planned_date",
              ].join(", "),
            ),

          supabase
            .from("timesheets")
            .select(
              [
                "id",
                "employee_id",
                "work_date",
                "total_hours",
              ].join(", "),
            )
            .eq(
              "work_date",
              today,
            ),
        ]);

        if (
          employeesResult.error
        ) {
          throw employeesResult.error;
        }

        if (
          teamsResult.error
        ) {
          throw teamsResult.error;
        }

        if (
          assignmentsResult.error
        ) {
          throw assignmentsResult.error;
        }

        if (
          tasksResult.error
        ) {
          throw tasksResult.error;
        }

        if (
          timesheetsResult.error
        ) {
          throw timesheetsResult.error;
        }

        setEmployees(
          Array.isArray(
            employeesResult.data,
          )
            ? employeesResult.data.map(
                mapEmployee,
              )
            : [],
        );

        setTeams(
          Array.isArray(
            teamsResult.data,
          )
            ? teamsResult.data.map(
                mapTeam,
              )
            : [],
        );

        setAssignments(
          Array.isArray(
            assignmentsResult.data,
          )
            ? assignmentsResult.data.map(
                mapAssignment,
              )
            : [],
        );

        setTasks(
          Array.isArray(
            tasksResult.data,
          )
            ? tasksResult.data.map(
                mapTask,
              )
            : [],
        );

        setTimesheets(
          Array.isArray(
            timesheetsResult.data,
          )
            ? timesheetsResult.data.map(
                mapTimesheet,
              )
            : [],
        );
      } catch (err) {
        console.error(
          "Failed to load team workload:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load team workload.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadWorkload();
  }, [loadWorkload]);

  /* ==========================================================
     CALCULATE WORKLOAD
  ========================================================== */

  const workload =
    useMemo<WorkloadPerson[]>(
      () => {
        const teamMap =
          new Map(
            teams.map(
              (team) => [
                team.id,
                team,
              ],
            ),
          );

        const taskMap =
          new Map(
            tasks.map(
              (task) => [
                task.id,
                task,
              ],
            ),
          );

        const hoursByEmployee =
          new Map<
            string,
            number
          >();

        timesheets.forEach(
          (timesheet) => {
            const current =
              hoursByEmployee.get(
                timesheet.employee_id,
              ) ?? 0;

            hoursByEmployee.set(
              timesheet.employee_id,
              current +
                Number(
                  timesheet.total_hours ??
                    0,
                ),
            );
          },
        );

        return employees
          .map(
            (employee) => {
              /*
               * Find active assignments
               * belonging to this employee.
               */

              const employeeAssignments =
                assignments.filter(
                  (assignment) =>
                    assignment.employee_id ===
                      employee.id &&
                    isActiveAssignment(
                      assignment.status,
                    ),
                );

              /*
               * Only count tasks that actually
               * exist in the task table.
               */

              const assignedTasks =
                employeeAssignments
                  .map(
                    (assignment) =>
                      taskMap.get(
                        assignment.task_id,
                      ),
                  )
                  .filter(
                    (
                      task,
                    ): task is TaskRow =>
                      Boolean(task),
                  );

              const estimatedHours =
                assignedTasks.reduce(
                  (
                    total,
                    task,
                  ) =>
                    total +
                    Number(
                      task.estimated_hours ??
                        0,
                    ),
                  0,
                );

              const loggedHours =
                hoursByEmployee.get(
                  employee.id,
                ) ?? 0;

              const capacity =
                Math.min(
                  100,
                  Math.round(
                    (estimatedHours /
                      DAILY_CAPACITY_HOURS) *
                      100,
                  ),
                );

              const team =
                employee.team_id
                  ? teamMap.get(
                      employee.team_id,
                    )
                  : null;

              return {
                id: employee.id,
                name:
                  employee.full_name ||
                  employee.employee_code ||
                  "Unnamed Employee",
                role:
                  employee.job_title ||
                  "Team Member",
                teamName:
                  team?.name ||
                  "No Team",
                estimatedHours,
                loggedHours,
                capacity,
                assignedTasks:
                  assignedTasks.length,
              };
            },
          )
          /*
           * Show people with workload first.
           * Then sort by estimated hours.
           */
          .filter(
            (person) =>
              person.assignedTasks >
                0 ||
              person.loggedHours >
                0,
          )
          .sort(
            (a, b) =>
              b.estimatedHours -
              a.estimatedHours,
          );
      },
      [
        employees,
        teams,
        assignments,
        tasks,
        timesheets,
      ],
    );

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const workloadSummary =
    useMemo(() => {
      const totalEstimated =
        workload.reduce(
          (
            total,
            person,
          ) =>
            total +
            person.estimatedHours,
          0,
        );

      const totalLogged =
        workload.reduce(
          (
            total,
            person,
          ) =>
            total +
            person.loggedHours,
          0,
        );

      const overloaded =
        workload.filter(
          (person) =>
            person.capacity >=
            100,
        ).length;

      return {
        totalEstimated,
        totalLogged,
        overloaded,
      };
    }, [workload]);

  /* ==========================================================
     DISPLAY LIMIT
  ========================================================== */

  const visiblePeople =
    workload.slice(
      0,
      6,
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-950">
            Team Workload
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Today&apos;s estimated capacity.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 sm:flex">
            <span>
              {formatHours(
                workloadSummary.totalEstimated,
              )}
            </span>

            <span className="text-slate-300">
              /
            </span>

            <span>
              {formatHours(
                workloadSummary.totalLogged,
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadWorkload()
            }
            disabled={loading}
            aria-label="Refresh team workload"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </div>
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      {!loading &&
        !error &&
        workload.length >
          0 && (
          <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-5 sm:grid-cols-3 sm:px-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Assigned
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {workload.reduce(
                  (
                    total,
                    person,
                  ) =>
                    total +
                    person.assignedTasks,
                  0,
                )}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Estimated
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatHours(
                  workloadSummary.totalEstimated,
                )}
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Capacity
              </p>

              <p
                className={`mt-1 text-lg font-semibold ${
                  workloadSummary.overloaded >
                  0
                    ? "text-orange-600"
                    : "text-emerald-600"
                }`}
              >
                {workloadSummary.overloaded >
                0
                  ? `${workloadSummary.overloaded} overloaded`
                  : "Healthy"}
              </p>
            </div>
          </div>
        )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {!loading &&
        error && (
          <div className="p-5 sm:p-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-700">
                    Unable to load team workload
                  </p>

                  <p className="mt-1 break-words text-xs leading-5 text-red-600">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void loadWorkload()
                    }
                    className="mt-3 text-xs font-semibold text-red-700 underline underline-offset-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="divide-y divide-slate-100">
          {[
            1,
            2,
            3,
            4,
          ].map((item) => (
            <div
              key={item}
              className="animate-pulse px-5 py-4 sm:px-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100" />

                  <div className="space-y-2">
                    <div className="h-3.5 w-24 rounded bg-slate-100" />

                    <div className="h-3 w-20 rounded bg-slate-100" />
                  </div>
                </div>

                <div className="h-4 w-10 rounded bg-slate-100" />
              </div>

              <div className="mt-3 h-1.5 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* ======================================================
          TEAM MEMBERS
      ====================================================== */}

      {!loading &&
        !error &&
        visiblePeople.length >
          0 && (
          <div className="divide-y divide-slate-100">
            {visiblePeople.map(
              (person) => {
                const isOverloaded =
                  person.capacity >=
                  100;

                const isHighLoad =
                  person.capacity >=
                  80;

                return (
                  <div
                    key={
                      person.id
                    }
                    className="px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                  >
                    <div className="flex items-center justify-between gap-3">

                      {/* ------------------------------------
                          PERSON
                      ------------------------------------- */}

                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                          {getInitials(
                            person.name,
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {
                              person.name
                            }
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {
                              person.teamName
                            }
                            {" · "}
                            {
                              person.assignedTasks
                            }{" "}
                            {person.assignedTasks ===
                            1
                              ? "task"
                              : "tasks"}
                          </p>
                        </div>
                      </div>

                      {/* ------------------------------------
                          HOURS
                      ------------------------------------- */}

                      <div className="shrink-0 text-right">
                        <p
                          className={`text-sm font-semibold ${
                            isOverloaded
                              ? "text-orange-600"
                              : "text-slate-700"
                          }`}
                        >
                          {formatHours(
                            person.estimatedHours,
                          )}
                        </p>

                        <p className="text-[10px] text-slate-400">
                          estimated
                        </p>
                      </div>
                    </div>

                    {/* --------------------------------------
                        CAPACITY BAR
                    --------------------------------------- */}

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverloaded
                              ? "bg-orange-500"
                              : isHighLoad
                                ? "bg-amber-500"
                                : "bg-slate-700"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              person.capacity,
                            )}%`,
                          }}
                        />
                      </div>

                      <span
                        className={`w-10 text-right text-xs font-semibold ${
                          isOverloaded
                            ? "text-orange-600"
                            : "text-slate-600"
                        }`}
                      >
                        {
                          person.capacity
                        }
                        %
                      </span>
                    </div>

                    {/* --------------------------------------
                        LOGGED HOURS
                    --------------------------------------- */}

                    {person.loggedHours >
                      0 && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Logged today
                        </span>

                        <span className="text-[11px] font-medium text-slate-500">
                          {formatHours(
                            person.loggedHours,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {!loading &&
        !error &&
        visiblePeople.length ===
          0 && (
          <div className="p-8 text-center sm:p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Users className="h-6 w-6 text-slate-400" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              No workload assigned
            </p>

            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-400">
              Team members with assigned
              production tasks will
              appear here.
            </p>
          </div>
        )}

      {/* ======================================================
          FOOTER
      ====================================================== */}

      {!loading &&
        !error &&
        workload.length >
          6 && (
          <div className="border-t border-slate-100 px-5 py-3 sm:px-6">
            <button
              type="button"
              onClick={() =>
                window.location.assign(
                  "/employees",
                )
              }
              className="flex w-full items-center justify-center gap-2 text-xs font-semibold text-slate-600 transition hover:text-slate-950"
            >
              View all team members

              <Users className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

      {/* ======================================================
          HEALTH INDICATOR
      ====================================================== */}

      {!loading &&
        !error &&
        workload.length >
          0 &&
        workloadSummary.overloaded ===
          0 && (
          <div className="border-t border-slate-100 px-5 py-3 sm:px-6">
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />

              <span className="font-medium">
                Team capacity is within
                today's limits.
              </span>
            </div>
          </div>
        )}
    </div>
  );
}

export default TeamWorkload;