import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileBarChart,
  Plus,
  RefreshCw,
  Target,
  Users,
  XCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

import PerformanceFilters, {
  type PerformanceFiltersValue,
  type PerformanceFilterEmployee,
} from "../../components/performance/PerformanceFilters";

import EmployeePerformanceCard, {
  type EmployeePerformanceData,
} from "../../components/performance/EmployeePerformanceCard";

import PerformanceForm, {
  type PerformanceFormData,
  type PerformanceFormEmployee,
  type PerformanceFormRecord,
  type PerformanceFormTask,
} from "../../components/performance/PerformanceForm";

import PerformanceRecordTable, {
  type PerformanceRecordRow,
} from "../../components/performance/PerformanceTable";

/* ============================================================
   TYPES
============================================================ */

type PerformanceStatus = "green" | "orange" | "red";

interface PerformanceEmployeeRow {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  job_title: string;
  total_tasks: number;
  completed_tasks: number;
  delayed_tasks: number;
  total_hours: number;
  average_task_hours: number;
  completion_rate: number;
  performance: string;
}

interface Employee {
  id: string;
  full_name: string | null;
  employee_code: string | null;
  email: string | null;
  job_title: string | null;
  team_id: string | null;
  is_active: boolean;
}

interface Task {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  estimated_hours: number;
  actual_hours: number;
  due_date: string | null;
}

interface Timesheet {
  id: string;
  employee_id: string;
  task_id: string;
  work_date: string;
  total_hours: number;
}

interface PerformanceRecord {
  id: string;
  employee_id: string;
  task_id: string | null;
  period_start: string;
  period_end: string;
  tasks_completed: number;
  tasks_delayed: number;
  total_hours: number;
  average_task_hours: number;
  performance: string;
  remarks: string | null;
}

interface PeriodRange {
  start: string;
  end: string;
}

/* ============================================================
   DEFAULT FILTERS
============================================================ */

const DEFAULT_FILTERS: PerformanceFiltersValue = {
  search: "",
  employeeId: "",
  performance: "all",
  period: "this_month",
  startDate: "",
  endDate: "",
};

/* ============================================================
   HELPERS
============================================================ */

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isCompletedStatus(status: string | null | undefined): boolean {
  const normalized = normalizeStatus(status);

  return [
    "completed",
    "approved_delivered",
    "approved_and_delivered",
    "approved_&_delivered",
    "delivered",
    "closed",
  ].includes(normalized);
}

function isDelayedTask(task: Task, periodEnd: string): boolean {
  if (!task.due_date || isCompletedStatus(task.status)) {
    return false;
  }

  const dueDate = new Date(task.due_date);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  const endDate = new Date(`${periodEnd}T23:59:59`);

  if (dueDate > endDate) {
    return false;
  }

  return dueDate < new Date();
}

function calculatePerformance(
  completedTasks: number,
  delayedTasks: number,
  totalTasks: number,
): PerformanceStatus {
  if (totalTasks <= 0) {
    return "orange";
  }

  const completionRate = (completedTasks / totalTasks) * 100;

  const delayRate = (delayedTasks / totalTasks) * 100;

  if (completionRate >= 80 && delayRate <= 10) {
    return "green";
  }

  if (completionRate < 50 || delayRate > 30) {
    return "red";
  }

  return "orange";
}

function getPeriodRange(
  period: PerformanceFiltersValue["period"],
  customStart?: string,
  customEnd?: string,
): PeriodRange {
  const today = new Date();

  const toDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  if (period === "custom") {
    return {
      start: customStart || toDateString(today),
      end: customEnd || toDateString(today),
    };
  }

  if (period === "today") {
    const date = toDateString(today);

    return {
      start: date,
      end: date,
    };
  }

  if (period === "this_week") {
    const day = today.getDay();

    const difference = day === 0 ? -6 : 1 - day;

    const start = new Date(today);

    start.setDate(today.getDate() + difference);

    const end = new Date(start);

    end.setDate(start.getDate() + 6);

    return {
      start: toDateString(start),
      end: toDateString(end),
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);

  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const cleanValue = value.split("T")[0];

  const date = new Date(`${cleanValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatHours(value: number): string {
  if (!Number.isFinite(value)) {
    return "0.00";
  }

  return value.toFixed(2);
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (
    words[0].charAt(0).toUpperCase() +
    words[words.length - 1].charAt(0).toUpperCase()
  );
}

function getPerformanceClasses(performance: string) {
  switch (normalizeStatus(performance)) {
    case "green":
      return {
        wrapper: "border-emerald-200 bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };

    case "orange":
      return {
        wrapper: "border-orange-200 bg-orange-50",
        text: "text-orange-700",
        dot: "bg-orange-500",
      };

    case "red":
      return {
        wrapper: "border-red-200 bg-red-50",
        text: "text-red-700",
        dot: "bg-red-500",
      };

    default:
      return {
        wrapper: "border-slate-200 bg-slate-50",
        text: "text-slate-600",
        dot: "bg-slate-400",
      };
  }
}

/* ============================================================
   EMPLOYEE PERFORMANCE TABLE
============================================================ */

interface EmployeePerformanceTableProps {
  employees: PerformanceEmployeeRow[];
  loading: boolean;
  onEmployeeClick: (employee: PerformanceEmployeeRow) => void;
}

function EmployeePerformanceTable({
  employees,
  loading,
  onEmployeeClick,
}: EmployeePerformanceTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              {[
                "Employee",
                "Tasks",
                "Completed",
                "Delayed",
                "Hours",
                "Avg / Task",
                "Completion",
                "Performance",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <tr
                key={index}
                className="animate-pulse border-b border-slate-100"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-200" />

                    <div>
                      <div className="h-4 w-32 rounded bg-slate-200" />

                      <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
                    </div>
                  </div>
                </td>

                {Array.from({
                  length: 7,
                }).map((_, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4">
                    <div className="h-4 w-16 rounded bg-slate-100" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Users className="h-6 w-6 text-slate-400" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-slate-900">
          No employee performance data
        </h3>

        <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
          There are no employees matching the selected filters or no timesheet
          activity exists for this period.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1050px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Employee
              </th>

              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tasks
              </th>

              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed
              </th>

              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Delayed
              </th>

              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Hours
              </th>

              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Avg / Task
              </th>

              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completion
              </th>

              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Performance
              </th>
            </tr>
          </thead>

          <tbody>
            {employees.map((employee) => {
              const performance = getPerformanceClasses(employee.performance);

              return (
                <tr
                  key={employee.employee_id}
                  onClick={() => onEmployeeClick(employee)}
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                >
                  {/* Employee */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        {getInitials(employee.employee_name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {employee.employee_name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {employee.employee_code}

                          {employee.job_title !== "—" && (
                            <> · {employee.job_title}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Tasks */}
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-slate-800">
                      {employee.total_tasks}
                    </span>
                  </td>

                  {/* Completed */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />

                      <span className="text-sm font-semibold text-emerald-700">
                        {employee.completed_tasks}
                      </span>
                    </div>
                  </td>

                  {/* Delayed */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          employee.delayed_tasks > 0
                            ? "text-red-500"
                            : "text-slate-300"
                        }`}
                      />

                      <span
                        className={`text-sm font-semibold ${
                          employee.delayed_tasks > 0
                            ? "text-red-600"
                            : "text-slate-600"
                        }`}
                      >
                        {employee.delayed_tasks}
                      </span>
                    </div>
                  </td>

                  {/* Hours */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-400" />

                      <span className="text-sm font-medium text-slate-700">
                        {formatHours(employee.total_hours)}
                      </span>
                    </div>
                  </td>

                  {/* Average */}
                  <td className="px-4 py-4">
                    <span className="text-sm font-medium text-slate-700">
                      {formatHours(employee.average_task_hours)}h
                    </span>
                  </td>

                  {/* Completion */}
                  <td className="px-4 py-4">
                    <div className="flex min-w-[130px] items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900 transition-all"
                          style={{
                            width: `${Math.min(
                              employee.completion_rate,
                              100,
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="w-10 text-right text-xs font-semibold text-slate-700">
                        {employee.completion_rate.toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  {/* Performance */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${performance.wrapper} ${performance.text}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${performance.dot}`}
                      />

                      {employee.performance.toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="divide-y divide-slate-100 md:hidden">
        {employees.map((employee) => {
          const performance = getPerformanceClasses(employee.performance);

          return (
            <button
              key={employee.employee_id}
              type="button"
              onClick={() => onEmployeeClick(employee)}
              className="block w-full p-4 text-left transition hover:bg-slate-50"
            >
              {/* Employee header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {getInitials(employee.employee_name)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {employee.employee_name}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {employee.employee_code}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${performance.wrapper} ${performance.text}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${performance.dot}`}
                  />

                  {employee.performance.toUpperCase()}
                </span>
              </div>

              {/* Metrics */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricBox
                  label="Tasks"
                  value={employee.total_tasks}
                  icon={<Target className="h-4 w-4" />}
                />

                <MetricBox
                  label="Completed"
                  value={employee.completed_tasks}
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                />

                <MetricBox
                  label="Delayed"
                  value={employee.delayed_tasks}
                  icon={
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        employee.delayed_tasks > 0
                          ? "text-red-500"
                          : "text-slate-300"
                      }`}
                    />
                  }
                />

                <MetricBox
                  label="Hours"
                  value={`${formatHours(employee.total_hours)}h`}
                  icon={<Clock3 className="h-4 w-4" />}
                />
              </div>

              {/* Completion */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">
                    Completion Rate
                  </span>

                  <span className="font-bold text-slate-800">
                    {employee.completion_rate.toFixed(0)}%
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900"
                    style={{
                      width: `${Math.min(employee.completion_rate, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ============================================================
   METRIC BOX
============================================================ */

function MetricBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{label}</span>

        <span className="text-slate-400">{icon}</span>
      </div>

      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

function Performance() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);

  const [performanceRecords, setPerformanceRecords] = useState<
    PerformanceRecord[]
  >([]);

  const [filters, setFilters] =
    useState<PerformanceFiltersValue>(DEFAULT_FILTERS);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeePerformanceData | null>(null);

  const [formOpen, setFormOpen] = useState(false);

  const [editingRecord, setEditingRecord] =
    useState<PerformanceFormRecord | null>(null);

  /* ==========================================================
     LOAD
  ========================================================== */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        employeesResponse,
        tasksResponse,
        timesheetsResponse,
        performanceResponse,
      ] = await Promise.all([
        supabase
          .from("employees")
          .select(
            "id, full_name, employee_code, email, job_title, team_id, is_active",
          )
          .eq("is_active", true)
          .order("full_name"),

        supabase
          .from("tasks")
          .select(
            "id, title, category, priority, status, estimated_hours, actual_hours, due_date",
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("timesheets")
          .select("id, employee_id, task_id, work_date, total_hours")
          .order("work_date", {
            ascending: false,
          }),

        supabase
          .from("performance_records")
          .select(
            "id, employee_id, task_id, period_start, period_end, tasks_completed, tasks_delayed, total_hours, average_task_hours, performance, remarks",
          )
          .order("period_end", {
            ascending: false,
          }),
      ]);

      if (employeesResponse.error) {
        throw employeesResponse.error;
      }

      if (tasksResponse.error) {
        throw tasksResponse.error;
      }

      if (timesheetsResponse.error) {
        throw timesheetsResponse.error;
      }

      if (performanceResponse.error) {
        throw performanceResponse.error;
      }

      setEmployees((employeesResponse.data ?? []) as Employee[]);

      setTasks((tasksResponse.data ?? []) as Task[]);

      setTimesheets((timesheetsResponse.data ?? []) as Timesheet[]);

      setPerformanceRecords(
        (performanceResponse.data ?? []) as PerformanceRecord[],
      );
    } catch (err) {
      console.error("Failed to load performance:", err);

      setError(
        err instanceof Error ? err.message : "Unable to load performance data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ==========================================================
     PERIOD
  ========================================================== */

  const periodRange = useMemo(
    () => getPeriodRange(filters.period, filters.startDate, filters.endDate),
    [filters.period, filters.startDate, filters.endDate],
  );

  /* ==========================================================
     EMPLOYEE PERFORMANCE
  ========================================================== */

  const employeeRows = useMemo<PerformanceEmployeeRow[]>(() => {
    const search = filters.search.trim().toLowerCase();

    return employees
      .map((employee) => {
        const employeeTimesheets = timesheets.filter(
          (timesheet) =>
            timesheet.employee_id === employee.id &&
            timesheet.work_date >= periodRange.start &&
            timesheet.work_date <= periodRange.end,
        );

        const taskIds = Array.from(
          new Set(employeeTimesheets.map((item) => item.task_id)),
        );

        const employeeTasks = taskIds
          .map((taskId) => tasks.find((task) => task.id === taskId))
          .filter(Boolean) as Task[];

        const totalTasks = employeeTasks.length;

        const completedTasks = employeeTasks.filter((task) =>
          isCompletedStatus(task.status),
        ).length;

        const delayedTasks = employeeTasks.filter((task) =>
          isDelayedTask(task, periodRange.end),
        ).length;

        const totalHours = employeeTimesheets.reduce(
          (sum, item) => sum + Number(item.total_hours || 0),
          0,
        );

        const averageTaskHours = totalTasks > 0 ? totalHours / totalTasks : 0;

        const completionRate =
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const performance = calculatePerformance(
          completedTasks,
          delayedTasks,
          totalTasks,
        );

        return {
          employee_id: employee.id,

          employee_name: employee.full_name || "Unnamed Employee",

          employee_code: employee.employee_code || "—",

          job_title: employee.job_title || "—",

          total_tasks: totalTasks,

          completed_tasks: completedTasks,

          delayed_tasks: delayedTasks,

          total_hours: totalHours,

          average_task_hours: averageTaskHours,

          completion_rate: completionRate,

          performance,
        };
      })
      .filter((employee) => {
        if (filters.employeeId && employee.employee_id !== filters.employeeId) {
          return false;
        }

        if (
          filters.performance &&
          employee.performance !== filters.performance
        ) {
          return false;
        }

        if (!search) {
          return true;
        }

        return (
          employee.employee_name.toLowerCase().includes(search) ||
          employee.employee_code.toLowerCase().includes(search) ||
          employee.job_title.toLowerCase().includes(search)
        );
      });
  }, [
    employees,
    filters.employeeId,
    filters.performance,
    filters.search,
    periodRange.end,
    periodRange.start,
    tasks,
    timesheets,
  ]);

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const summary = useMemo(() => {
    const totalEmployees = employeeRows.length;

    const totalTasks = employeeRows.reduce(
      (sum, employee) => sum + employee.total_tasks,
      0,
    );

    const completedTasks = employeeRows.reduce(
      (sum, employee) => sum + employee.completed_tasks,
      0,
    );

    const delayedTasks = employeeRows.reduce(
      (sum, employee) => sum + employee.delayed_tasks,
      0,
    );

    const totalHours = employeeRows.reduce(
      (sum, employee) => sum + employee.total_hours,
      0,
    );

    const averageTaskHours = totalTasks > 0 ? totalHours / totalTasks : 0;

    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalEmployees,
      totalTasks,
      completedTasks,
      delayedTasks,
      totalHours,
      averageTaskHours,
      completionRate,

      greenCount: employeeRows.filter(
        (employee) => employee.performance === "green",
      ).length,

      orangeCount: employeeRows.filter(
        (employee) => employee.performance === "orange",
      ).length,

      redCount: employeeRows.filter(
        (employee) => employee.performance === "red",
      ).length,
    };
  }, [employeeRows]);

  /* ==========================================================
     FILTERED RECORDS
  ========================================================== */

  const filteredRecords = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return performanceRecords.filter((record) => {
      if (filters.employeeId && record.employee_id !== filters.employeeId) {
        return false;
      }

      if (
        filters.performance &&
        normalizeStatus(record.performance) !==
          normalizeStatus(filters.performance)
      ) {
        return false;
      }

      const overlapsPeriod =
        record.period_start <= periodRange.end &&
        record.period_end >= periodRange.start;

      if (!overlapsPeriod) {
        return false;
      }

      if (!search) {
        return true;
      }

      const employee = employees.find((item) => item.id === record.employee_id);

      const task = tasks.find((item) => item.id === record.task_id);

      return (
        employee?.full_name?.toLowerCase().includes(search) ||
        employee?.employee_code?.toLowerCase().includes(search) ||
        task?.title?.toLowerCase().includes(search) ||
        record.remarks?.toLowerCase().includes(search)
      );
    });
  }, [
    employees,
    filters.employeeId,
    filters.performance,
    filters.search,
    performanceRecords,
    periodRange.end,
    periodRange.start,
    tasks,
  ]);

  /* ==========================================================
     RECORD TABLE DATA
  ========================================================== */

  const performanceRecordRows = useMemo<PerformanceRecordRow[]>(
    () =>
      filteredRecords.map((record) => {
        const employee = employees.find(
          (item) => item.id === record.employee_id,
        );

        const task = tasks.find((item) => item.id === record.task_id);

        return {
          id: record.id,

          employee_id: record.employee_id,

          employee_name: employee?.full_name || "Unknown Employee",

          employee_code: employee?.employee_code || "—",

          task_id: record.task_id,

          task_title: task?.title || null,

          period_start: record.period_start,

          period_end: record.period_end,

          tasks_completed: Number(record.tasks_completed || 0),

          tasks_delayed: Number(record.tasks_delayed || 0),

          total_hours: Number(record.total_hours || 0),

          average_task_hours: Number(record.average_task_hours || 0),

          performance: record.performance,

          remarks: record.remarks,
        };
      }),
    [employees, filteredRecords, tasks],
  );

  /* ==========================================================
     FORM OPTIONS
  ========================================================== */

  const employeeFilterOptions = useMemo<PerformanceFilterEmployee[]>(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        full_name: employee.full_name,
        employee_code: employee.employee_code,
      })),
    [employees],
  );

  const formEmployees = useMemo<PerformanceFormEmployee[]>(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        full_name: employee.full_name,
        employee_code: employee.employee_code,
      })),
    [employees],
  );

  const formTasks = useMemo<PerformanceFormTask[]>(
    () =>
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
      })),
    [tasks],
  );

  /* ==========================================================
     HANDLERS
  ========================================================== */

  const handleCreateRecord = () => {
    setEditingRecord(null);
    setError("");
    setFormOpen(true);
  };

  const handleEditRecord = (record: PerformanceRecordRow) => {
    setEditingRecord({
      id: record.id,

      employee_id: record.employee_id,

      task_id: record.task_id,

      period_start: record.period_start,

      period_end: record.period_end,

      tasks_completed: Number(record.tasks_completed || 0),

      tasks_delayed: Number(record.tasks_delayed || 0),

      total_hours: Number(record.total_hours || 0),

      average_task_hours: Number(record.average_task_hours || 0),

      performance: record.performance,

      remarks: record.remarks || "",
    });

    setError("");
    setFormOpen(true);
  };

  const handleSubmitRecord = async (data: PerformanceFormData) => {
    try {
      setSaving(true);
      setError("");

      const payload = {
        employee_id: data.employee_id,

        task_id: data.task_id || null,

        period_start: data.period_start,

        period_end: data.period_end,

        tasks_completed: Number(data.tasks_completed || 0),

        tasks_delayed: Number(data.tasks_delayed || 0),

        total_hours: Number(data.total_hours || 0),

        average_task_hours: Number(data.average_task_hours || 0),

        performance: data.performance,

        remarks: data.remarks.trim() || null,
      };

      if (editingRecord) {
        const { error: updateError } = await supabase
          .from("performance_records")
          .update(payload)
          .eq("id", editingRecord.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from("performance_records")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }
      }

      setFormOpen(false);
      setEditingRecord(null);

      await loadData();
    } catch (err) {
      console.error("Failed to save performance record:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save performance record.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEmployeeClick = (employee: PerformanceEmployeeRow) => {
    setSelectedEmployee(employee as EmployeePerformanceData);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  /* ==========================================================
     UI
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

              <span>Performance Management</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Team Performance
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Track employee productivity, task completion, delays, working
              hours, and performance health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleCreateRecord}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add Record
            </button>
          </div>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Unable to complete the request</p>

              <p className="mt-1 break-words">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-md p-1 text-red-500 hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ======================================================
            FILTERS
        ====================================================== */}

        <PerformanceFilters
          value={filters}
          employees={employeeFilterOptions}
          employeesLoading={loading}
          onChange={setFilters}
          onReset={handleResetFilters}
        />

        {/* ======================================================
            SUMMARY
        ====================================================== */}

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
          <SummaryCard
            icon={Users}
            label="Employees"
            value={summary.totalEmployees}
            description="Tracked employees"
          />

          <SummaryCard
            icon={Target}
            label="Tasks"
            value={summary.totalTasks}
            description="Tasks in period"
          />

          <SummaryCard
            icon={CheckCircle2}
            label="Completed"
            value={summary.completedTasks}
            description={`${summary.completionRate.toFixed(0)}% completion`}
            iconClass="text-emerald-600"
          />

          <SummaryCard
            icon={AlertTriangle}
            label="Delayed"
            value={summary.delayedTasks}
            description="Delayed tasks"
            iconClass="text-red-600"
          />

          <SummaryCard
            icon={Clock3}
            label="Hours"
            value={formatHours(summary.totalHours)}
            description={`${formatHours(summary.averageTaskHours)} hrs / task`}
            iconClass="text-blue-600"
          />

          <SummaryCard
            icon={Activity}
            label="Healthy"
            value={summary.greenCount}
            description={`${summary.orangeCount} watch · ${summary.redCount} risk`}
            iconClass="text-emerald-600"
          />
        </div>

        {/* ======================================================
            DISTRIBUTION
        ====================================================== */}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Performance Distribution
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current employee health for the selected period.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm">
              <DistributionItem
                label="GREEN"
                value={summary.greenCount}
                dotClass="bg-emerald-500"
                textClass="text-emerald-600"
              />

              <DistributionItem
                label="ORANGE"
                value={summary.orangeCount}
                dotClass="bg-orange-500"
                textClass="text-orange-600"
              />

              <DistributionItem
                label="RED"
                value={summary.redCount}
                dotClass="bg-red-500"
                textClass="text-red-600"
              />
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="flex h-full">
              {summary.totalEmployees > 0 && (
                <>
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${
                        (summary.greenCount / summary.totalEmployees) * 100
                      }%`,
                    }}
                  />

                  <div
                    className="h-full bg-orange-500"
                    style={{
                      width: `${
                        (summary.orangeCount / summary.totalEmployees) * 100
                      }%`,
                    }}
                  />

                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${
                        (summary.redCount / summary.totalEmployees) * 100
                      }%`,
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </section>

        {/* ======================================================
            EMPLOYEE PERFORMANCE
        ====================================================== */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-500" />

                <h2 className="text-base font-semibold text-slate-900">
                  Employee Performance
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Click an employee to view detailed performance.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4" />

              <span>{formatDate(periodRange.start)}</span>

              <span>—</span>

              <span>{formatDate(periodRange.end)}</span>
            </div>
          </div>

          <EmployeePerformanceTable
            employees={employeeRows}
            loading={loading}
            onEmployeeClick={handleEmployeeClick}
          />
        </section>

        {/* ======================================================
            PERFORMANCE RECORDS
        ====================================================== */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-slate-500" />

                <h2 className="text-base font-semibold text-slate-900">
                  Performance Records
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Manually recorded performance reviews and historical results.
              </p>
            </div>

            <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {performanceRecordRows.length}{" "}
              {performanceRecordRows.length === 1 ? "record" : "records"}
            </div>
          </div>

          <PerformanceRecordTable
            records={performanceRecordRows}
            loading={loading}
            onEdit={handleEditRecord}
          />
        </section>

        {/* ======================================================
            EMPLOYEE DETAIL
        ====================================================== */}

        {selectedEmployee && (
          <EmployeePerformanceCard
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
          />
        )}
      </div>

      {/* ========================================================
          PERFORMANCE FORM
      ======================================================== */}

      <PerformanceForm
        open={formOpen}
        loading={saving}
        error={error}
        record={editingRecord}
        employees={formEmployees}
        tasks={formTasks}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setEditingRecord(null);
            setError("");
          }
        }}
        onSubmit={handleSubmitRecord}
      />
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

interface SummaryCardProps {
  icon: typeof Users;
  label: string;
  value: string | number;
  description: string;
  iconClass?: string;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass = "text-slate-600",
}: SummaryCardProps) {
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

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="rounded-lg bg-slate-100 p-2.5">
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DISTRIBUTION ITEM
============================================================ */

function DistributionItem({
  label,
  value,
  dotClass,
  textClass,
}: {
  label: string;
  value: number;
  dotClass: string;
  textClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />

      <span className={`font-semibold ${textClass}`}>{value}</span>

      <span className="text-slate-500">{label}</span>
    </div>
  );
}

export default Performance;
