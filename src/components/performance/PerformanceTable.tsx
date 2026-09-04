import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  Target,
  XCircle,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

export interface PerformanceRecordRow {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  task_id: string | null;
  task_title: string | null;
  period_start: string;
  period_end: string;
  tasks_completed: number;
  tasks_delayed: number;
  total_hours: number;
  average_task_hours: number;
  performance: string;
  remarks: string | null;
}

interface PerformanceRecordTableProps {
  records: PerformanceRecordRow[];
  loading?: boolean;
  onEdit?: (record: PerformanceRecordRow) => void;
}

/* ============================================================
   HELPERS
============================================================ */

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "-";
  }

  const cleanValue = value.split("T")[0];

  const date = new Date(
    `${cleanValue}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatHours(
  value: number | null | undefined,
): string {
  const hours = Number(value || 0);

  if (!Number.isFinite(hours)) {
    return "0.0h";
  }

  return `${hours.toFixed(1)}h`;
}

function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    words[0]
      .charAt(0)
      .toUpperCase() +
    words[words.length - 1]
      .charAt(0)
      .toUpperCase()
  );
}

function getPerformanceClasses(
  performance: string,
) {
  switch (
    performance?.trim().toLowerCase()
  ) {
    case "green":
      return {
        wrapper:
          "border-emerald-200 bg-emerald-50",
        text: "text-emerald-700",
        icon: "text-emerald-600",
      };

    case "orange":
      return {
        wrapper:
          "border-orange-200 bg-orange-50",
        text: "text-orange-700",
        icon: "text-orange-600",
      };

    case "red":
      return {
        wrapper:
          "border-red-200 bg-red-50",
        text: "text-red-700",
        icon: "text-red-600",
      };

    default:
      return {
        wrapper:
          "border-slate-200 bg-slate-50",
        text: "text-slate-600",
        icon: "text-slate-500",
      };
  }
}

function getPerformanceIcon(
  performance: string,
) {
  switch (
    performance?.trim().toLowerCase()
  ) {
    case "green":
      return (
        <CheckCircle2 className="h-3.5 w-3.5" />
      );

    case "orange":
      return (
        <AlertTriangle className="h-3.5 w-3.5" />
      );

    case "red":
      return (
        <XCircle className="h-3.5 w-3.5" />
      );

    default:
      return (
        <Target className="h-3.5 w-3.5" />
      );
  }
}

/* ============================================================
   LOADING DESKTOP ROW
============================================================ */

function LoadingRow() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      {/* Employee */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-200" />

          <div>
            <div className="h-4 w-32 rounded bg-slate-200" />

            <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
          </div>
        </div>
      </td>

      {/* Period */}
      <td className="px-4 py-4">
        <div className="h-4 w-28 rounded bg-slate-100" />

        <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
      </td>

      {/* Task */}
      <td className="px-4 py-4">
        <div className="h-4 w-28 rounded bg-slate-100" />
      </td>

      {/* Completed */}
      <td className="px-4 py-4">
        <div className="h-4 w-10 rounded bg-slate-100" />
      </td>

      {/* Delayed */}
      <td className="px-4 py-4">
        <div className="h-4 w-10 rounded bg-slate-100" />
      </td>

      {/* Hours */}
      <td className="px-4 py-4">
        <div className="h-4 w-12 rounded bg-slate-100" />
      </td>

      {/* Performance */}
      <td className="px-4 py-4">
        <div className="h-7 w-20 rounded-full bg-slate-100" />
      </td>

      {/* Action */}
      <td className="px-4 py-4">
        <div className="ml-auto h-8 w-8 rounded-lg bg-slate-100" />
      </td>
    </tr>
  );
}

/* ============================================================
   LOADING MOBILE CARD
============================================================ */

function LoadingMobileCard() {
  return (
    <div className="animate-pulse p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200" />

        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-slate-200" />

          <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
        </div>

        <div className="h-7 w-20 rounded-full bg-slate-100" />
      </div>

      <div className="mt-4 h-12 rounded-xl bg-slate-100" />

      <div className="mt-3 h-4 w-40 rounded bg-slate-100" />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-16 rounded-xl bg-slate-100" />
        <div className="h-16 rounded-xl bg-slate-100" />
        <div className="h-16 rounded-xl bg-slate-100" />
        <div className="h-16 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <FileText className="h-6 w-6 text-slate-400" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        No performance records
      </h3>

      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
        No manually recorded performance
        records are available for the
        selected filters.
      </p>
    </div>
  );
}

/* ============================================================
   PERFORMANCE BADGE
============================================================ */

function PerformanceBadge({
  performance,
}: {
  performance: string;
}) {
  const classes =
    getPerformanceClasses(
      performance,
    );

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${classes.wrapper} ${classes.text}`}
    >
      <span className={classes.icon}>
        {getPerformanceIcon(
          performance,
        )}
      </span>

      {performance?.trim()
        ? performance.toUpperCase()
        : "N/A"}
    </span>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PerformanceRecordTable({
  records,
  loading = false,
  onEdit,
}: PerformanceRecordTableProps) {
  /*
   * Do not show the empty state while loading.
   * The skeleton table/card should remain visible.
   */
  if (
    !loading &&
    records.length === 0
  ) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden">
      {/* ======================================================
          DESKTOP TABLE
      ====================================================== */}

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1150px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Employee
              </th>

              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Period
              </th>

              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Task
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
                Performance
              </th>

              <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({
                length: 5,
              }).map((_, index) => (
                <LoadingRow
                  key={index}
                />
              ))
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50"
                >
                  {/* Employee */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                        {getInitials(
                          record.employee_name,
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {
                            record.employee_name
                          }
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {
                            record.employee_code
                          }
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Period */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />

                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          {formatDate(
                            record.period_start,
                          )}
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-400">
                          to{" "}
                          {formatDate(
                            record.period_end,
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Task */}
                  <td className="px-4 py-4">
                    {record.task_title ? (
                      <div className="flex max-w-[240px] items-center gap-2">
                        <Target className="h-4 w-4 shrink-0 text-slate-400" />

                        <span
                          className="truncate text-sm text-slate-700"
                          title={
                            record.task_title
                          }
                        >
                          {
                            record.task_title
                          }
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-slate-300" />

                        <span className="text-xs text-slate-400">
                          Overall Performance
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Completed */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />

                      <span className="text-sm font-semibold text-emerald-700">
                        {
                          record.tasks_completed
                        }
                      </span>
                    </div>
                  </td>

                  {/* Delayed */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          record.tasks_delayed >
                          0
                            ? "text-red-500"
                            : "text-slate-300"
                        }`}
                      />

                      <span
                        className={`text-sm font-semibold ${
                          record.tasks_delayed >
                          0
                            ? "text-red-600"
                            : "text-slate-600"
                        }`}
                      >
                        {
                          record.tasks_delayed
                        }
                      </span>
                    </div>
                  </td>

                  {/* Hours */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-slate-400" />

                      <span className="text-sm font-medium text-slate-700">
                        {formatHours(
                          record.total_hours,
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Performance */}
                  <td className="px-4 py-4">
                    <PerformanceBadge
                      performance={
                        record.performance
                      }
                    />
                  </td>

                  {/* Action */}
                  <td className="px-4 py-4 text-right">
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={() =>
                          onEdit(record)
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1"
                        title="Edit performance record"
                        aria-label={`Edit performance record for ${record.employee_name}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================================
          MOBILE CARDS
      ====================================================== */}

      <div className="divide-y divide-slate-100 md:hidden">
        {loading ? (
          Array.from({
            length: 4,
          }).map((_, index) => (
            <LoadingMobileCard
              key={index}
            />
          ))
        ) : (
          records.map((record) => {
            const performance =
              getPerformanceClasses(
                record.performance,
              );

            return (
              <div
                key={record.id}
                className="p-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {getInitials(
                        record.employee_name,
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {
                          record.employee_name
                        }
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {
                          record.employee_code
                        }
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${performance.wrapper} ${performance.text}`}
                  >
                    <span
                      className={
                        performance.icon
                      }
                    >
                      {getPerformanceIcon(
                        record.performance,
                      )}
                    </span>

                    {record.performance
                      ?.trim()
                      ? record.performance.toUpperCase()
                      : "N/A"}
                  </span>
                </div>

                {/* Period */}
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                  <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700">
                      Performance Period
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {formatDate(
                        record.period_start,
                      )}{" "}
                      →{" "}
                      {formatDate(
                        record.period_end,
                      )}
                    </p>
                  </div>
                </div>

                {/* Task */}
                <div className="mt-3 flex items-center gap-2">
                  <Target className="h-4 w-4 shrink-0 text-slate-400" />

                  <p
                    className="truncate text-xs text-slate-600"
                    title={
                      record.task_title ||
                      "Overall Employee Performance"
                    }
                  >
                    {record.task_title ||
                      "Overall Employee Performance"}
                  </p>
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {/* Completed */}
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-emerald-700">
                        Completed
                      </span>

                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    </div>

                    <p className="mt-1 text-lg font-bold text-emerald-800">
                      {
                        record.tasks_completed
                      }
                    </p>
                  </div>

                  {/* Delayed */}
                  <div className="rounded-xl bg-red-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-red-700">
                        Delayed
                      </span>

                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                    </div>

                    <p
                      className={`mt-1 text-lg font-bold ${
                        record.tasks_delayed >
                        0
                          ? "text-red-700"
                          : "text-slate-700"
                      }`}
                    >
                      {
                        record.tasks_delayed
                      }
                    </p>
                  </div>

                  {/* Total Hours */}
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">
                        Total Hours
                      </span>

                      <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
                    </div>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formatHours(
                        record.total_hours,
                      )}
                    </p>
                  </div>

                  {/* Average */}
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">
                        Avg. Task
                      </span>

                      <Activity className="h-4 w-4 shrink-0 text-slate-400" />
                    </div>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formatHours(
                        record.average_task_hours,
                      )}
                    </p>
                  </div>
                </div>

                {/* Remarks */}
                {record.remarks && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700">
                          Remarks
                        </p>

                        <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                          {record.remarks}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit */}
                {onEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      onEdit(record)
                    }
                    className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1"
                  >
                    <Edit3 className="h-3.5 w-3.5" />

                    Edit Performance Record
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}