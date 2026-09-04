import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

export type EmployeePerformanceStatus =
  | "green"
  | "orange"
  | "red";

export interface EmployeePerformanceData {
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

interface EmployeePerformanceCardProps {
  employee: EmployeePerformanceData;
  onClose?: () => void;
}

/* ============================================================
   HELPERS
============================================================ */

function formatHours(hours: number) {
  return `${Number(hours || 0).toFixed(1)}h`;
}

function formatPercentage(value: number) {
  return `${Math.round(Number(value || 0))}%`;
}

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (
    words[0].charAt(0) +
    words[words.length - 1].charAt(0)
  ).toUpperCase();
}

function getPerformanceLabel(
  performance: string,
) {
  switch (performance.toLowerCase()) {
    case "green":
      return "GREEN";

    case "orange":
      return "ORANGE";

    case "red":
      return "RED";

    default:
      return "N/A";
  }
}

function getPerformanceClasses(
  performance: string,
) {
  switch (performance.toLowerCase()) {
    case "green":
      return {
        container:
          "border-emerald-200 bg-emerald-50",
        text: "text-emerald-700",
        icon: "text-emerald-600",
      };

    case "orange":
      return {
        container:
          "border-orange-200 bg-orange-50",
        text: "text-orange-700",
        icon: "text-orange-600",
      };

    case "red":
      return {
        container:
          "border-red-200 bg-red-50",
        text: "text-red-700",
        icon: "text-red-600",
      };

    default:
      return {
        container:
          "border-slate-200 bg-slate-50",
        text: "text-slate-600",
        icon: "text-slate-500",
      };
  }
}

function getPerformanceIcon(
  performance: string,
) {
  switch (performance.toLowerCase()) {
    case "green":
      return (
        <CheckCircle2 className="h-5 w-5" />
      );

    case "orange":
      return (
        <AlertTriangle className="h-5 w-5" />
      );

    case "red":
      return (
        <XCircle className="h-5 w-5" />
      );

    default:
      return (
        <Activity className="h-5 w-5" />
      );
  }
}

function getProgressClass(
  completionRate: number,
) {
  if (completionRate >= 80) {
    return "bg-emerald-500";
  }

  if (completionRate >= 50) {
    return "bg-orange-500";
  }

  return "bg-red-500";
}

/* ============================================================
   COMPONENT
============================================================ */

export default function EmployeePerformanceCard({
  employee,
  onClose,
}: EmployeePerformanceCardProps) {
  const performance =
    getPerformanceClasses(
      employee.performance,
    );

  const completionRate = Math.min(
    100,
    Math.max(
      0,
      Number(employee.completion_rate || 0),
    ),
  );

  const remainingTasks = Math.max(
    0,
    employee.total_tasks -
      employee.completed_tasks,
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4">

          <div className="flex min-w-0 items-center gap-4">
            {/* Avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-base font-bold text-white">
              {getInitials(
                employee.employee_name,
              )}
            </div>

            {/* Employee Info */}
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900">
                {employee.employee_name}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>
                  {employee.employee_code}
                </span>

                {employee.job_title &&
                  employee.job_title !== "-" && (
                    <>
                      <span className="text-slate-300">
                        •
                      </span>

                      <span>
                        {employee.job_title}
                      </span>
                    </>
                  )}
              </div>
            </div>
          </div>

          {/* Performance */}
          <div
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 ${performance.container}`}
          >
            <span className={performance.icon}>
              {getPerformanceIcon(
                employee.performance,
              )}
            </span>

            <span
              className={`text-xs font-bold ${performance.text}`}
            >
              {getPerformanceLabel(
                employee.performance,
              )}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
          >
            Close Details
          </button>
        )}
      </div>

      {/* ======================================================
          OVERVIEW
      ====================================================== */}

      <div className="p-5">

        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-400" />

          <h4 className="text-sm font-semibold text-slate-900">
            Performance Overview
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          {/* Total Tasks */}
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total Tasks
              </span>

              <Target className="h-4 w-4 text-slate-400" />
            </div>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {employee.total_tasks}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Assigned tasks
            </p>
          </div>

          {/* Completed */}
          <div className="rounded-xl bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-700">
                Completed
              </span>

              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>

            <p className="mt-2 text-xl font-bold text-emerald-800">
              {employee.completed_tasks}
            </p>

            <p className="mt-1 text-xs text-emerald-600">
              Successfully completed
            </p>
          </div>

          {/* Delayed */}
          <div className="rounded-xl bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-700">
                Delayed
              </span>

              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>

            <p className="mt-2 text-xl font-bold text-red-700">
              {employee.delayed_tasks}
            </p>

            <p className="mt-1 text-xs text-red-600">
              Past deadline
            </p>
          </div>

          {/* Hours */}
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total Hours
              </span>

              <Clock3 className="h-4 w-4 text-slate-400" />
            </div>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {formatHours(
                employee.total_hours,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Tracked work
            </p>
          </div>
        </div>

        {/* ====================================================
            COMPLETION RATE
        ==================================================== */}

        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />

              <span className="text-sm font-semibold text-slate-700">
                Completion Rate
              </span>
            </div>

            <span className="text-lg font-bold text-slate-900">
              {formatPercentage(
                completionRate,
              )}
            </span>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${getProgressClass(
                completionRate,
              )}`}
              style={{
                width: `${completionRate}%`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {employee.completed_tasks} completed
            </span>

            <span>
              {remainingTasks} remaining
            </span>
          </div>
        </div>

        {/* ====================================================
            PRODUCTIVITY
        ==================================================== */}

        <div className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-400" />

            <h4 className="text-sm font-semibold text-slate-900">
              Productivity
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {/* Average Task Time */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Average Task Time
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatHours(
                      employee.average_task_hours,
                    )}
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <Clock3 className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Remaining Work */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Remaining Tasks
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {remainingTasks}
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <Target className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            PERFORMANCE MESSAGE
        ==================================================== */}

        <div
          className={`mt-6 rounded-xl border p-4 ${performance.container}`}
        >
          <div className="flex items-start gap-3">
            <div className={performance.icon}>
              {getPerformanceIcon(
                employee.performance,
              )}
            </div>

            <div>
              <p
                className={`text-sm font-semibold ${performance.text}`}
              >
                {employee.performance ===
                "green"
                  ? "Performance is on track"
                  : employee.performance ===
                      "orange"
                    ? "Performance needs monitoring"
                    : "Performance requires attention"}
              </p>

              <p
                className={`mt-1 text-xs opacity-80 ${performance.text}`}
              >
                {employee.performance ===
                "green"
                  ? "Task completion and delay levels are within the expected range."
                  : employee.performance ===
                      "orange"
                    ? "Review workload, deadlines and task progress to prevent further delays."
                    : "Review delayed tasks and workload immediately to improve delivery performance."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}