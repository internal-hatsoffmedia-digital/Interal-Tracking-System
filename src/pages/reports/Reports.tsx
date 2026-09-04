import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  RefreshCw,
  Target,
  Users,
  XCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

/* ============================================================
   TYPES
============================================================ */

type ReportTab =
  | "overview"
  | "tasks"
  | "timesheets"
  | "projects"
  | "performance"
  | "workload";

interface Employee {
  id: string;
  full_name: string | null;
  employee_code: string | null;
  job_title: string | null;
  team_id: string | null;
  is_active: boolean;
}

interface Client {
  id: string;
  name: string;
  short_name: string | null;
  is_active: boolean;
}

interface Project {
  id: string;
  client_id: string;
  name: string;
  series_title: string | null;
  total_assets_required: number;
  completed_assets: number;
  pending_assets: number;
  lead_employee_id: string | null;
  start_date: string | null;
  target_deadline: string | null;
  status: string;
  health: string;
  invoice_status: string;
  is_active: boolean;
}

interface Task {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  planned_date: string | null;
  due_date: string | null;
  estimated_hours: number;
  actual_hours: number;
}

interface Timesheet {
  id: string;
  employee_id: string;
  task_id: string;
  work_date: string;
  total_hours: number;
  performance: string;
}

interface TaskStatusRow {
  label: string;
  value: number;
}

interface EmployeeTaskRow {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  total_tasks: number;
  completed_tasks: number;
  delayed_tasks: number;
  estimated_hours: number;
  actual_hours: number;
  completion_rate: number;
}

interface ClientTaskRow {
  client_id: string;
  client_name: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
}

interface PriorityRow {
  priority: string;
  count: number;
}

interface EmployeeHoursRow {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  hours: number;
}

interface ClientHoursRow {
  client_id: string;
  client_name: string;
  hours: number;
}

interface ProjectHoursRow {
  project_id: string;
  project_name: string;
  hours: number;
}

interface WorkloadRow {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  active_tasks: number;
  allocated_hours: number;
  actual_hours: number;
  utilization: number;
}

interface PerformanceSummary {
  green: number;
  orange: number;
  red: number;
}

/* ============================================================
   HELPERS
============================================================ */

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function formatHours(value: number) {
  return Number(value || 0).toFixed(1);
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    `${value.split("T")[0]}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function isCompleted(
  status: string,
) {
  return [
    "completed",
    "approved_and_delivered",
    "approved_&_delivered",
    "delivered",
    "closed",
  ].includes(normalize(status));
}

function isDelayed(
  task: Task,
) {
  if (
    !task.due_date ||
    isCompleted(task.status)
  ) {
    return false;
  }

  const due = new Date(
    task.due_date,
  );

  if (Number.isNaN(due.getTime())) {
    return false;
  }

  return due < new Date();
}

function getInitials(
  name: string,
) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function prettifyStatus(
  value: string,
) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

/* ============================================================
   PAGE
============================================================ */

export default function Reports() {
  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [timesheets, setTimesheets] =
    useState<Timesheet[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<ReportTab>(
      "overview",
    );

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  const loadReports =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const [
          employeesResponse,
          clientsResponse,
          projectsResponse,
          tasksResponse,
          timesheetsResponse,
        ] = await Promise.all([
          supabase
            .from("employees")
            .select(
              "id, full_name, employee_code, job_title, team_id, is_active",
            )
            .eq("is_active", true)
            .order("full_name"),

          supabase
            .from("clients")
            .select(
              "id, name, short_name, is_active",
            )
            .eq("is_active", true)
            .order("name"),

          supabase
            .from("projects")
            .select(
              "id, client_id, name, series_title, total_assets_required, completed_assets, pending_assets, lead_employee_id, start_date, target_deadline, status, health, invoice_status, is_active",
            )
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("tasks")
            .select(
              "id, project_id, client_id, title, category, priority, status, planned_date, due_date, estimated_hours, actual_hours",
            )
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("timesheets")
            .select(
              "id, employee_id, task_id, work_date, total_hours, performance",
            )
            .order("work_date", {
              ascending: false,
            }),
        ]);

        if (employeesResponse.error) {
          throw employeesResponse.error;
        }

        if (clientsResponse.error) {
          throw clientsResponse.error;
        }

        if (projectsResponse.error) {
          throw projectsResponse.error;
        }

        if (tasksResponse.error) {
          throw tasksResponse.error;
        }

        if (timesheetsResponse.error) {
          throw timesheetsResponse.error;
        }

        setEmployees(
          (employeesResponse.data ??
            []) as Employee[],
        );

        setClients(
          (clientsResponse.data ??
            []) as Client[],
        );

        setProjects(
          (projectsResponse.data ??
            []) as Project[],
        );

        setTasks(
          (tasksResponse.data ??
            []) as Task[],
        );

        setTimesheets(
          (timesheetsResponse.data ??
            []) as Timesheet[],
        );
      } catch (err) {
        console.error(
          "Failed to load reports:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load reports.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  /* ==========================================================
     FILTERED TIMESHEETS
  ========================================================== */

  const filteredTimesheets =
    useMemo(() => {
      return timesheets.filter(
        (entry) => {
          if (
            startDate &&
            entry.work_date < startDate
          ) {
            return false;
          }

          if (
            endDate &&
            entry.work_date > endDate
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      endDate,
      startDate,
      timesheets,
    ]);

  /* ==========================================================
     FILTERED TASKS
  ========================================================== */

  const filteredTasks =
    useMemo(() => {
      return tasks.filter((task) => {
        const date =
          task.planned_date ||
          task.due_date?.split("T")[0] ||
          "";

        if (
          startDate &&
          date &&
          date < startDate
        ) {
          return false;
        }

        if (
          endDate &&
          date &&
          date > endDate
        ) {
          return false;
        }

        return true;
      });
    }, [
      endDate,
      startDate,
      tasks,
    ]);

  /* ==========================================================
     OVERVIEW
  ========================================================== */

  const overview = useMemo(() => {
    const completed =
      filteredTasks.filter(
        (task) =>
          isCompleted(
            task.status,
          ),
      ).length;

    const delayed =
      filteredTasks.filter(
        (task) =>
          isDelayed(task),
      ).length;

    const totalHours =
      filteredTimesheets.reduce(
        (sum, entry) =>
          sum +
          Number(
            entry.total_hours || 0,
          ),
        0,
      );

    const activeProjects =
      projects.filter(
        (project) =>
          project.is_active,
      ).length;

    const completionRate =
      filteredTasks.length > 0
        ? (completed /
            filteredTasks.length) *
          100
        : 0;

    return {
      totalTasks:
        filteredTasks.length,
      completed,
      delayed,
      totalHours,
      activeProjects,
      completionRate,
    };
  }, [
    filteredTasks,
    filteredTimesheets,
    projects,
  ]);

  /* ==========================================================
     TASK STATUS REPORT
  ========================================================== */

  const taskStatusRows =
    useMemo<TaskStatusRow[]>(() => {
      const counts =
        new Map<string, number>();

      filteredTasks.forEach(
        (task) => {
          const status =
            task.status || "unknown";

          counts.set(
            status,
            (counts.get(status) ||
              0) + 1,
          );
        },
      );

      return Array.from(
        counts.entries(),
      )
        .map(
          ([status, value]) => ({
            label: prettifyStatus(
              status,
            ),
            value,
          }),
        )
        .sort(
          (a, b) =>
            b.value - a.value,
        );
    }, [filteredTasks]);

  /* ==========================================================
     TASK BY EMPLOYEE
  ========================================================== */

  const employeeTaskRows =
    useMemo<EmployeeTaskRow[]>(
      () =>
        employees
          .map((employee) => {
            const employeeTimesheets =
              filteredTimesheets.filter(
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
              filteredTasks.filter(
                (task) =>
                  taskIds.has(
                    task.id,
                  ),
              );

            const completed =
              employeeTasks.filter(
                (task) =>
                  isCompleted(
                    task.status,
                  ),
              ).length;

            const delayed =
              employeeTasks.filter(
                (task) =>
                  isDelayed(task),
              ).length;

            const estimated =
              employeeTasks.reduce(
                (sum, task) =>
                  sum +
                  Number(
                    task.estimated_hours ||
                      0,
                  ),
                0,
              );

            const actual =
              employeeTimesheets.reduce(
                (sum, entry) =>
                  sum +
                  Number(
                    entry.total_hours ||
                      0,
                  ),
                0,
              );

            return {
              employee_id:
                employee.id,

              employee_name:
                employee.full_name ||
                "Unnamed",

              employee_code:
                employee.employee_code ||
                "—",

              total_tasks:
                employeeTasks.length,

              completed_tasks:
                completed,

              delayed_tasks:
                delayed,

              estimated_hours:
                estimated,

              actual_hours:
                actual,

              completion_rate:
                employeeTasks.length >
                0
                  ? (completed /
                      employeeTasks.length) *
                    100
                  : 0,
            };
          })
          .filter(
            (row) =>
              row.total_tasks > 0,
          )
          .sort(
            (a, b) =>
              b.total_tasks -
              a.total_tasks,
          ),
      [
        employees,
        filteredTasks,
        filteredTimesheets,
      ],
    );

  /* ==========================================================
     TASK BY CLIENT
  ========================================================== */

  const clientTaskRows =
    useMemo<ClientTaskRow[]>(
      () =>
        clients
          .map((client) => {
            const clientTasks =
              filteredTasks.filter(
                (task) =>
                  task.client_id ===
                  client.id,
              );

            const completed =
              clientTasks.filter(
                (task) =>
                  isCompleted(
                    task.status,
                  ),
              ).length;

            return {
              client_id:
                client.id,

              client_name:
                client.name,

              total_tasks:
                clientTasks.length,

              completed_tasks:
                completed,

              pending_tasks:
                clientTasks.length -
                completed,
            };
          })
          .filter(
            (row) =>
              row.total_tasks > 0,
          )
          .sort(
            (a, b) =>
              b.total_tasks -
              a.total_tasks,
          ),
      [clients, filteredTasks],
    );

  /* ==========================================================
     PRIORITY REPORT
  ========================================================== */

  const priorityRows =
    useMemo<PriorityRow[]>(() => {
      const map =
        new Map<string, number>();

      filteredTasks.forEach(
        (task) => {
          const priority =
            task.priority ||
            "unknown";

          map.set(
            priority,
            (map.get(priority) ||
              0) + 1,
          );
        },
      );

      return Array.from(
        map.entries(),
      )
        .map(
          ([priority, count]) => ({
            priority,
            count,
          }),
        )
        .sort(
          (a, b) =>
            b.count - a.count,
        );
    }, [filteredTasks]);

  /* ==========================================================
     HOURS BY EMPLOYEE
  ========================================================== */

  const employeeHoursRows =
    useMemo<EmployeeHoursRow[]>(
      () =>
        employees
          .map((employee) => {
            const hours =
              filteredTimesheets
                .filter(
                  (entry) =>
                    entry.employee_id ===
                    employee.id,
                )
                .reduce(
                  (sum, entry) =>
                    sum +
                    Number(
                      entry.total_hours ||
                        0,
                    ),
                  0,
                );

            return {
              employee_id:
                employee.id,

              employee_name:
                employee.full_name ||
                "Unnamed",

              employee_code:
                employee.employee_code ||
                "—",

              hours,
            };
          })
          .filter(
            (row) =>
              row.hours > 0,
          )
          .sort(
            (a, b) =>
              b.hours - a.hours,
          ),
      [
        employees,
        filteredTimesheets,
      ],
    );

  /* ==========================================================
     HOURS BY CLIENT
  ========================================================== */

  const clientHoursRows =
    useMemo<ClientHoursRow[]>(
      () =>
        clients
          .map((client) => {
            const clientTaskIds =
              new Set(
                filteredTasks
                  .filter(
                    (task) =>
                      task.client_id ===
                      client.id,
                  )
                  .map(
                    (task) =>
                      task.id,
                  ),
              );

            const hours =
              filteredTimesheets
                .filter((entry) =>
                  clientTaskIds.has(
                    entry.task_id,
                  ),
                )
                .reduce(
                  (sum, entry) =>
                    sum +
                    Number(
                      entry.total_hours ||
                        0,
                    ),
                  0,
                );

            return {
              client_id:
                client.id,

              client_name:
                client.name,

              hours,
            };
          })
          .filter(
            (row) =>
              row.hours > 0,
          )
          .sort(
            (a, b) =>
              b.hours - a.hours,
          ),
      [
        clients,
        filteredTasks,
        filteredTimesheets,
      ],
    );

  /* ==========================================================
     HOURS BY PROJECT
  ========================================================== */

  const projectHoursRows =
    useMemo<ProjectHoursRow[]>(
      () =>
        projects
          .map((project) => {
            const projectTaskIds =
              new Set(
                filteredTasks
                  .filter(
                    (task) =>
                      task.project_id ===
                      project.id,
                  )
                  .map(
                    (task) =>
                      task.id,
                  ),
              );

            const hours =
              filteredTimesheets
                .filter((entry) =>
                  projectTaskIds.has(
                    entry.task_id,
                  ),
                )
                .reduce(
                  (sum, entry) =>
                    sum +
                    Number(
                      entry.total_hours ||
                        0,
                    ),
                  0,
                );

            return {
              project_id:
                project.id,

              project_name:
                project.name,

              hours,
            };
          })
          .filter(
            (row) =>
              row.hours > 0,
          )
          .sort(
            (a, b) =>
              b.hours - a.hours,
          ),
      [
        filteredTasks,
        filteredTimesheets,
        projects,
      ],
    );

  /* ==========================================================
     PROJECT REPORT
  ========================================================== */

  const projectReportRows =
    useMemo(
      () =>
        projects
          .filter(
            (project) =>
              project.is_active,
          )
          .map((project) => {
            const total =
              Number(
                project.total_assets_required ||
                  0,
              );

            const completed =
              Number(
                project.completed_assets ||
                  0,
              );

            const completion =
              total > 0
                ? (completed /
                    total) *
                  100
                : 0;

            const delayed =
              project.target_deadline
                ? new Date(
                    `${project.target_deadline}T23:59:59`,
                  ) <
                  new Date() &&
                  completion < 100
                : false;

            const hours =
              projectHoursRows.find(
                (row) =>
                  row.project_id ===
                  project.id,
              )?.hours || 0;

            const client =
              clients.find(
                (item) =>
                  item.id ===
                  project.client_id,
              );

            return {
              ...project,
              clientName:
                client?.name ||
                "Unknown Client",
              completion,
              delayed,
              hours,
            };
          })
          .sort(
            (a, b) =>
              b.completion -
              a.completion,
          ),
      [
        clients,
        projectHoursRows,
        projects,
      ],
    );

  /* ==========================================================
     PERFORMANCE
  ========================================================== */

  const performanceSummary =
    useMemo<PerformanceSummary>(
      () => {
        const result = {
          green: 0,
          orange: 0,
          red: 0,
        };

        employeeTaskRows.forEach(
          (employee) => {
            const delayRate =
              employee.total_tasks >
              0
                ? (employee.delayed_tasks /
                    employee.total_tasks) *
                  100
                : 0;

            let status:
              | "green"
              | "orange"
              | "red";

            if (
              employee.total_tasks ===
              0
            ) {
              status = "orange";
            } else if (
              employee.completion_rate >=
                80 &&
              delayRate <= 10
            ) {
              status = "green";
            } else if (
              employee.completion_rate <
                50 ||
              delayRate > 30
            ) {
              status = "red";
            } else {
              status = "orange";
            }

            result[status] += 1;
          },
        );

        return result;
      },
      [employeeTaskRows],
    );

  /* ==========================================================
     WORKLOAD
  ========================================================== */

  const workloadRows =
    useMemo<WorkloadRow[]>(
      () =>
        employees
          .map((employee) => {
            const employeeTimesheets =
              filteredTimesheets.filter(
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

            const activeTasks =
              filteredTasks.filter(
                (task) =>
                  taskIds.has(
                    task.id,
                  ) &&
                  !isCompleted(
                    task.status,
                  ),
              );

            const allocated =
              activeTasks.reduce(
                (sum, task) =>
                  sum +
                  Number(
                    task.estimated_hours ||
                      0,
                  ),
                0,
              );

            const actual =
              employeeTimesheets.reduce(
                (sum, entry) =>
                  sum +
                  Number(
                    entry.total_hours ||
                      0,
                  ),
                0,
              );

            const utilization =
              40 > 0
                ? Math.min(
                    100,
                    (allocated / 40) *
                      100,
                  )
                : 0;

            return {
              employee_id:
                employee.id,

              employee_name:
                employee.full_name ||
                "Unnamed",

              employee_code:
                employee.employee_code ||
                "—",

              active_tasks:
                activeTasks.length,

              allocated_hours:
                allocated,

              actual_hours:
                actual,

              utilization,
            };
          })
          .filter(
            (row) =>
              row.active_tasks > 0 ||
              row.actual_hours > 0,
          )
          .sort(
            (a, b) =>
              b.allocated_hours -
              a.allocated_hours,
          ),
      [
        employees,
        filteredTasks,
        filteredTimesheets,
      ],
    );

  /* ==========================================================
     RESET DATE FILTER
  ========================================================== */

  const clearDateFilter =
    () => {
      setStartDate("");
      setEndDate("");
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <BarChart3 className="h-4 w-4" />

              Reports & Analytics
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Reports
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Operational reports across
              tasks, timesheets, projects,
              performance, and workload.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadReports()
            }
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Unable to load reports
              </p>

              <p className="mt-1 break-words">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ======================================================
            DATE FILTER
        ====================================================== */}

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-500" />

                <h2 className="text-sm font-semibold text-slate-900">
                  Report Period
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Filter task and timesheet
                reporting by date.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  From
                </label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value,
                    )
                  }
                  max={
                    endDate ||
                    undefined
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  To
                </label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(
                      event.target.value,
                    )
                  }
                  min={
                    startDate ||
                    undefined
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {(startDate ||
                endDate) && (
                <button
                  type="button"
                  onClick={
                    clearDateFilter
                  }
                  className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ======================================================
            SUMMARY
        ====================================================== */}

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
          <SummaryCard
            icon={Target}
            label="Tasks"
            value={
              overview.totalTasks
            }
            description="Reported tasks"
          />

          <SummaryCard
            icon={CheckCircle2}
            label="Completed"
            value={
              overview.completed
            }
            description={`${overview.completionRate.toFixed(
              0,
            )}% completion`}
            iconClass="text-emerald-600"
          />

          <SummaryCard
            icon={AlertTriangle}
            label="Delayed"
            value={
              overview.delayed
            }
            description="Past deadline"
            iconClass="text-red-600"
          />

          <SummaryCard
            icon={Clock3}
            label="Hours"
            value={formatHours(
              overview.totalHours,
            )}
            description="Tracked hours"
            iconClass="text-blue-600"
          />

          <SummaryCard
            icon={FolderKanban}
            label="Projects"
            value={
              overview.activeProjects
            }
            description="Active projects"
          />

          <SummaryCard
            icon={Users}
            label="Employees"
            value={
              employeeTaskRows.length
            }
            description="With tracked work"
          />
        </div>

        {/* ======================================================
            TABS
        ====================================================== */}

        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {[
              {
                id: "overview",
                label: "Overview",
                icon: BarChart3,
              },
              {
                id: "tasks",
                label: "Task Report",
                icon: Target,
              },
              {
                id: "timesheets",
                label: "Timesheet Report",
                icon: Clock3,
              },
              {
                id: "projects",
                label: "Project Report",
                icon: FolderKanban,
              },
              {
                id: "performance",
                label: "Performance",
                icon: Activity,
              },
              {
                id: "workload",
                label: "Workload",
                icon: Users,
              },
            ].map((tab) => {
              const Icon = tab.icon;

              const active =
                activeTab ===
                tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.id as ReportTab,
                    )
                  }
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />

                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================
            OVERVIEW TAB
        ====================================================== */}

        {activeTab ===
          "overview" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportCard
              title="Task Status"
              subtitle="Current task distribution"
            >
              <SimpleBarList
                rows={taskStatusRows.map(
                  (row) => ({
                    label: row.label,
                    value: row.value,
                  }),
                )}
              />
            </ReportCard>

            <ReportCard
              title="Performance"
              subtitle="Employee performance distribution"
            >
              <PerformanceDistribution
                summary={
                  performanceSummary
                }
              />
            </ReportCard>

            <ReportCard
              title="Top Employees by Hours"
              subtitle="Tracked work hours"
            >
              <SimpleBarList
                rows={employeeHoursRows
                  .slice(0, 6)
                  .map((row) => ({
                    label:
                      row.employee_name,
                    value: row.hours,
                    suffix: "h",
                  }))}
              />
            </ReportCard>

            <ReportCard
              title="Project Health"
              subtitle="Active project overview"
            >
              <ProjectHealthList
                projects={
                  projectReportRows.slice(
                    0,
                    6,
                  )
                }
              />
            </ReportCard>
          </div>
        )}

        {/* ======================================================
            TASK REPORT
        ====================================================== */}

        {activeTab === "tasks" && (
          <div className="space-y-6">
            <ReportCard
              title="Tasks by Status"
              subtitle="Distribution across workflow"
            >
              <SimpleBarList
                rows={taskStatusRows.map(
                  (row) => ({
                    label: row.label,
                    value: row.value,
                  }),
                )}
              />
            </ReportCard>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ReportCard
                title="Tasks by Employee"
                subtitle="Task ownership and completion"
              >
                <div className="overflow-x-auto">
                  <ReportTable>
                    <thead>
                      <tr>
                        <Th>
                          Employee
                        </Th>
                        <Th>
                          Tasks
                        </Th>
                        <Th>
                          Completed
                        </Th>
                        <Th>
                          Delayed
                        </Th>
                        <Th>
                          Completion
                        </Th>
                      </tr>
                    </thead>

                    <tbody>
                      {employeeTaskRows.map(
                        (row) => (
                          <tr
                            key={
                              row.employee_id
                            }
                            className="border-t border-slate-100"
                          >
                            <Td>
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                                  {getInitials(
                                    row.employee_name,
                                  )}
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {
                                      row.employee_name
                                    }
                                  </p>

                                  <p className="text-[11px] text-slate-400">
                                    {
                                      row.employee_code
                                    }
                                  </p>
                                </div>
                              </div>
                            </Td>

                            <Td>
                              {
                                row.total_tasks
                              }
                            </Td>

                            <Td>
                              <span className="font-semibold text-emerald-600">
                                {
                                  row.completed_tasks
                                }
                              </span>
                            </Td>

                            <Td>
                              <span className="font-semibold text-red-600">
                                {
                                  row.delayed_tasks
                                }
                              </span>
                            </Td>

                            <Td>
                              {row.completion_rate.toFixed(
                                0,
                              )}
                              %
                            </Td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </ReportTable>
                </div>
              </ReportCard>

              <ReportCard
                title="Tasks by Client"
                subtitle="Client workload"
              >
                <div className="overflow-x-auto">
                  <ReportTable>
                    <thead>
                      <tr>
                        <Th>
                          Client
                        </Th>
                        <Th>
                          Total
                        </Th>
                        <Th>
                          Completed
                        </Th>
                        <Th>
                          Pending
                        </Th>
                      </tr>
                    </thead>

                    <tbody>
                      {clientTaskRows.map(
                        (row) => (
                          <tr
                            key={
                              row.client_id
                            }
                            className="border-t border-slate-100"
                          >
                            <Td>
                              <span className="font-semibold text-slate-800">
                                {
                                  row.client_name
                                }
                              </span>
                            </Td>

                            <Td>
                              {
                                row.total_tasks
                              }
                            </Td>

                            <Td>
                              <span className="text-emerald-600">
                                {
                                  row.completed_tasks
                                }
                              </span>
                            </Td>

                            <Td>
                              <span className="text-orange-600">
                                {
                                  row.pending_tasks
                                }
                              </span>
                            </Td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </ReportTable>
                </div>
              </ReportCard>
            </div>

            <ReportCard
              title="Tasks by Priority"
              subtitle="Priority distribution"
            >
              <SimpleBarList
                rows={priorityRows.map(
                  (row) => ({
                    label:
                      prettifyStatus(
                        row.priority,
                      ),
                    value: row.count,
                  }),
                )}
              />
            </ReportCard>
          </div>
        )}

        {/* ======================================================
            TIMESHEET REPORT
        ====================================================== */}

        {activeTab ===
          "timesheets" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ReportCard
              title="Hours by Employee"
              subtitle="Tracked work hours"
            >
              <SimpleBarList
                rows={employeeHoursRows.map(
                  (row) => ({
                    label:
                      row.employee_name,
                    value: row.hours,
                    suffix: "h",
                  }),
                )}
              />
            </ReportCard>

            <ReportCard
              title="Hours by Client"
              subtitle="Client effort"
            >
              <SimpleBarList
                rows={clientHoursRows.map(
                  (row) => ({
                    label:
                      row.client_name,
                    value: row.hours,
                    suffix: "h",
                  }),
                )}
              />
            </ReportCard>

            <ReportCard
              title="Hours by Project"
              subtitle="Project effort"
            >
              <SimpleBarList
                rows={projectHoursRows
                  .slice(0, 10)
                  .map((row) => ({
                    label:
                      row.project_name,
                    value: row.hours,
                    suffix: "h",
                  }))}
              />
            </ReportCard>
          </div>
        )}

        {/* ======================================================
            PROJECT REPORT
        ====================================================== */}

        {activeTab ===
          "projects" && (
          <ReportCard
            title="Project Report"
            subtitle="Project completion, health, deadlines and hours"
          >
            <div className="overflow-x-auto">
              <ReportTable>
                <thead>
                  <tr>
                    <Th>
                      Project
                    </Th>

                    <Th>
                      Client
                    </Th>

                    <Th>
                      Completion
                    </Th>

                    <Th>
                      Health
                    </Th>

                    <Th>
                      Deadline
                    </Th>

                    <Th>
                      Hours
                    </Th>

                    <Th>
                      Status
                    </Th>
                  </tr>
                </thead>

                <tbody>
                  {projectReportRows.map(
                    (project) => (
                      <tr
                        key={
                          project.id
                        }
                        className="border-t border-slate-100"
                      >
                        <Td>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {
                                project.name
                              }
                            </p>

                            {project.series_title && (
                              <p className="mt-0.5 text-xs text-slate-400">
                                {
                                  project.series_title
                                }
                              </p>
                            )}
                          </div>
                        </Td>

                        <Td>
                          {
                            project.clientName
                          }
                        </Td>

                        <Td>
                          <div className="min-w-[130px]">
                            <div className="flex items-center justify-between text-xs">
                              <span>
                                {
                                  project.completed_assets
                                }{" "}
                                /{" "}
                                {
                                  project.total_assets_required
                                }
                              </span>

                              <span className="font-semibold">
                                {project.completion.toFixed(
                                  0,
                                )}
                                %
                              </span>
                            </div>

                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-slate-900"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    project.completion,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </Td>

                        <Td>
                          <StatusBadge
                            value={
                              project.health
                            }
                          />
                        </Td>

                        <Td>
                          <span
                            className={
                              project.delayed
                                ? "font-semibold text-red-600"
                                : "text-slate-600"
                            }
                          >
                            {formatDate(
                              project.target_deadline,
                            )}
                          </span>
                        </Td>

                        <Td>
                          {formatHours(
                            project.hours,
                          )}
                          h
                        </Td>

                        <Td>
                          <StatusBadge
                            value={
                              project.status
                            }
                          />
                        </Td>
                      </tr>
                    ),
                  )}
                </tbody>
              </ReportTable>
            </div>
          </ReportCard>
        )}

        {/* ======================================================
            PERFORMANCE REPORT
        ====================================================== */}

        {activeTab ===
          "performance" && (
          <div className="space-y-6">
            <PerformanceDistribution
              summary={
                performanceSummary
              }
              large
            />

            <ReportCard
              title="Employee Performance"
              subtitle="Completion, delays and actual hours"
            >
              <div className="overflow-x-auto">
                <ReportTable>
                  <thead>
                    <tr>
                      <Th>
                        Employee
                      </Th>

                      <Th>
                        Tasks
                      </Th>

                      <Th>
                        Completed
                      </Th>

                      <Th>
                        Delayed
                      </Th>

                      <Th>
                        Hours
                      </Th>

                      <Th>
                        Completion
                      </Th>

                      <Th>
                        Performance
                      </Th>
                    </tr>
                  </thead>

                  <tbody>
                    {employeeTaskRows.map(
                      (row) => {
                        const delayRate =
                          row.total_tasks >
                          0
                            ? (row.delayed_tasks /
                                row.total_tasks) *
                              100
                            : 0;

                        const status =
                          row.total_tasks ===
                          0
                            ? "orange"
                            : row.completion_rate >=
                                  80 &&
                                delayRate <=
                                  10
                              ? "green"
                              : row.completion_rate <
                                    50 ||
                                  delayRate >
                                    30
                                ? "red"
                                : "orange";

                        return (
                          <tr
                            key={
                              row.employee_id
                            }
                            className="border-t border-slate-100"
                          >
                            <Td>
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                                  {getInitials(
                                    row.employee_name,
                                  )}
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {
                                      row.employee_name
                                    }
                                  </p>

                                  <p className="text-[11px] text-slate-400">
                                    {
                                      row.employee_code
                                    }
                                  </p>
                                </div>
                              </div>
                            </Td>

                            <Td>
                              {
                                row.total_tasks
                              }
                            </Td>

                            <Td>
                              {
                                row.completed_tasks
                              }
                            </Td>

                            <Td>
                              {
                                row.delayed_tasks
                              }
                            </Td>

                            <Td>
                              {formatHours(
                                row.actual_hours,
                              )}
                              h
                            </Td>

                            <Td>
                              {row.completion_rate.toFixed(
                                0,
                              )}
                              %
                            </Td>

                            <Td>
                              <StatusBadge
                                value={
                                  status
                                }
                              />
                            </Td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </ReportTable>
              </div>
            </ReportCard>
          </div>
        )}

        {/* ======================================================
            WORKLOAD REPORT
        ====================================================== */}

        {activeTab ===
          "workload" && (
          <ReportCard
            title="Employee Workload"
            subtitle="Allocated hours versus available capacity"
          >
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 text-slate-500" />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Capacity assumption
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Initial workload utilization
                    uses a 40-hour weekly
                    capacity. This can later be
                    replaced with employee-specific
                    working hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <ReportTable>
                <thead>
                  <tr>
                    <Th>
                      Employee
                    </Th>

                    <Th>
                      Active Tasks
                    </Th>

                    <Th>
                      Allocated
                    </Th>

                    <Th>
                      Actual
                    </Th>

                    <Th>
                      Utilization
                    </Th>
                  </tr>
                </thead>

                <tbody>
                  {workloadRows.map(
                    (row) => (
                      <tr
                        key={
                          row.employee_id
                        }
                        className="border-t border-slate-100"
                      >
                        <Td>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                              {getInitials(
                                row.employee_name,
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-800">
                                {
                                  row.employee_name
                                }
                              </p>

                              <p className="text-[11px] text-slate-400">
                                {
                                  row.employee_code
                                }
                              </p>
                            </div>
                          </div>
                        </Td>

                        <Td>
                          {
                            row.active_tasks
                          }
                        </Td>

                        <Td>
                          {formatHours(
                            row.allocated_hours,
                          )}
                          h
                        </Td>

                        <Td>
                          {formatHours(
                            row.actual_hours,
                          )}
                          h
                        </Td>

                        <Td>
                          <div className="min-w-[150px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold">
                                {row.utilization.toFixed(
                                  0,
                                )}
                                %
                              </span>
                            </div>

                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-slate-900"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    row.utilization,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </Td>
                      </tr>
                    ),
                  )}
                </tbody>
              </ReportTable>
            </div>
          </ReportCard>
        )}

        {/* ======================================================
            LOADING OVERLAY
        ====================================================== */}

        {loading && (
          <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-600 shadow-lg">
            <RefreshCw className="h-4 w-4 animate-spin" />

            Loading reports...
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass = "text-slate-600",
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  description: string;
  iconClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-lg bg-slate-100 p-2.5">
          <Icon
            className={`h-5 w-5 ${iconClass}`}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   REPORT CARD
============================================================ */

function ReportCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

/* ============================================================
   TABLE
============================================================ */

function ReportTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <table className="w-full min-w-[700px] text-left text-sm">
      {children}
    </table>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Td({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-4 py-4 text-sm text-slate-600">
      {children}
    </td>
  );
}

/* ============================================================
   SIMPLE BAR LIST
============================================================ */

function SimpleBarList({
  rows,
}: {
  rows: {
    label: string;
    value: number;
    suffix?: string;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <EmptyReportState />
    );
  }

  const max = Math.max(
    ...rows.map(
      (row) => row.value,
    ),
    1,
  );

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-slate-700">
              {row.label}
            </span>

            <span className="shrink-0 font-bold text-slate-900">
              {row.value.toFixed
                ? row.value.toFixed(
                    row.suffix
                      ? 1
                      : 0,
                  )
                : row.value}
              {row.suffix || ""}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{
                width: `${
                  (row.value /
                    max) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   PERFORMANCE DISTRIBUTION
============================================================ */

function PerformanceDistribution({
  summary,
  large = false,
}: {
  summary: PerformanceSummary;
  large?: boolean;
}) {
  const total =
    summary.green +
    summary.orange +
    summary.red;

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${
        large
          ? ""
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Performance Distribution
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Current employee health.
          </p>
        </div>

        <Activity className="h-5 w-5 text-slate-400" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <PerformanceBox
          label="GREEN"
          value={
            summary.green
          }
          total={total}
          className="bg-emerald-50 text-emerald-700"
        />

        <PerformanceBox
          label="ORANGE"
          value={
            summary.orange
          }
          total={total}
          className="bg-orange-50 text-orange-700"
        />

        <PerformanceBox
          label="RED"
          value={
            summary.red
          }
          total={total}
          className="bg-red-50 text-red-700"
        />
      </div>

      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {total > 0 && (
          <>
            <div
              className="bg-emerald-500"
              style={{
                width: `${
                  (summary.green /
                    total) *
                  100
                }%`,
              }}
            />

            <div
              className="bg-orange-500"
              style={{
                width: `${
                  (summary.orange /
                    total) *
                  100
                }%`,
              }}
            />

            <div
              className="bg-red-500"
              style={{
                width: `${
                  (summary.red /
                    total) *
                  100
                }%`,
              }}
            />
          </>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   PERFORMANCE BOX
============================================================ */

function PerformanceBox({
  label,
  value,
  total,
  className,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
}) {
  const percentage =
    total > 0
      ? (value / total) * 100
      : 0;

  return (
    <div
      className={`rounded-xl p-4 ${className}`}
    >
      <p className="text-xs font-bold">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs opacity-70">
        {percentage.toFixed(0)}%
      </p>
    </div>
  );
}

/* ============================================================
   PROJECT HEALTH
============================================================ */

function ProjectHealthList({
  projects,
}: {
  projects: Array<{
    id: string;
    name: string;
    clientName: string;
    completion: number;
    health: string;
    delayed: boolean;
    hours: number;
  }>;
}) {
  if (projects.length === 0) {
    return (
      <EmptyReportState />
    );
  }

  return (
    <div className="space-y-4">
      {projects.map(
        (project) => (
          <div
            key={project.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {project.name}
                </p>

                <p className="mt-1 truncate text-xs text-slate-400">
                  {project.clientName}
                </p>
              </div>

              <StatusBadge
                value={
                  project.health
                }
              />
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Completion
                </span>

                <span className="font-semibold text-slate-800">
                  {project.completion.toFixed(
                    0,
                  )}
                  %
                </span>
              </div>

              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{
                    width: `${Math.min(
                      100,
                      project.completion,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Hours
              </span>

              <span className="font-semibold text-slate-700">
                {formatHours(
                  project.hours,
                )}
                h
              </span>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  value,
}: {
  value: string;
}) {
  const status =
    normalize(value);

  let classes =
    "border-slate-200 bg-slate-50 text-slate-600";

  if (
    [
      "green",
      "on_track",
      "completed",
      "approved_and_delivered",
      "delivered",
    ].includes(status)
  ) {
    classes =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "orange",
      "at_risk",
      "in_progress",
      "pending",
      "revision",
      "client_review",
      "internal_review",
    ].includes(status)
  ) {
    classes =
      "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (
    [
      "red",
      "delayed",
      "blocked",
      "cancelled",
      "on_hold",
    ].includes(status)
  ) {
    classes =
      "border-red-200 bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${classes}`}
    >
      {prettifyStatus(
        value || "Unknown",
      )}
    </span>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyReportState() {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center text-center">
      <BarChart3 className="h-7 w-7 text-slate-300" />

      <p className="mt-3 text-sm font-semibold text-slate-700">
        No report data
      </p>

      <p className="mt-1 text-xs text-slate-400">
        There is no data available for
        this report.
      </p>
    </div>
  );
}