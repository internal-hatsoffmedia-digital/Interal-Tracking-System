import {
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  UserRound,
  XCircle,
} from "lucide-react";

import type {
  TaskAssignmentWithRelations,
} from "../../types/taskAssignment";

/* =========================================================
   TYPES
========================================================= */

interface TaskAssignmentTableProps {
  assignments: TaskAssignmentWithRelations[];
  loading: boolean;

  onEdit?: (
    assignment: TaskAssignmentWithRelations,
  ) => void;

  onStatusChange?: (
    assignment: TaskAssignmentWithRelations,
    status: string,
  ) => void;
}

/* =========================================================
   HELPERS
========================================================= */

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClasses(status: string) {
  switch (status) {
    case "assigned":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "accepted":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "in_progress":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getPriorityClasses(priority: string) {
  switch (priority) {
    case "high":
      return "bg-red-50 text-red-700";

    case "medium":
      return "bg-amber-50 text-amber-700";

    case "low":
      return "bg-emerald-50 text-emerald-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function TaskAssignmentTable({
  assignments,
  loading,
  onEdit,
  onStatusChange,
}: TaskAssignmentTableProps) {
  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {Array.from({
                  length: 7,
                }).map((_, index) => (
                  <th
                    key={index}
                    className="px-5 py-4"
                  >
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({
                length: 6,
              }).map((_, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-slate-100 last:border-0"
                >
                  {Array.from({
                    length: 7,
                  }).map(
                    (_, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-5 py-5"
                      >
                        <div className="h-4 w-full max-w-[140px] animate-pulse rounded bg-slate-100" />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />

              <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-100" />

              <div className="mt-4 h-8 w-full animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* =======================================================
     EMPTY
  ======================================================= */

  if (assignments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <UserRound className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900">
          No task assignments
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Tasks that have been assigned to
          employees will appear here.
        </p>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ===================================================
          DESKTOP TABLE
      =================================================== */}

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Task
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Assigned To
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Priority
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Assignment
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Deadline
              </th>

              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Assigned
              </th>

              <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {assignments.map(
              (assignment) => {
                const task =
                  assignment.task;

                const employee =
                  assignment.employee;

                const isOverdue =
                  task?.due_date &&
                  new Date(
                    task.due_date,
                  ).getTime() <
                    Date.now() &&
                  assignment.status !==
                    "completed";

                return (
                  <tr
                    key={
                      assignment.id
                    }
                    className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-0"
                  >
                    {/* TASK */}

                    <td className="px-5 py-5">
                      <div className="max-w-[260px]">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {task?.title ||
                            "Unknown task"}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          {task?.category && (
                            <span className="text-xs text-slate-500">
                              {formatLabel(
                                task.category,
                              )}
                            </span>
                          )}

                          {task?.status && (
                            <>
                              <span className="text-slate-300">
                                •
                              </span>

                              <span className="text-xs text-slate-400">
                                {formatLabel(
                                  task.status,
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* EMPLOYEE */}

                    <td className="px-5 py-5">
                      {employee ? (
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                            <UserRound className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {
                                employee.full_name
                              }
                            </p>

                            <p className="truncate text-xs text-slate-400">
                              {
                                employee.employee_code
                              }
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Employee unavailable
                        </span>
                      )}
                    </td>

                    {/* PRIORITY */}

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${getPriorityClasses(
                          task?.priority ||
                            "",
                        )}`}
                      >
                        {formatLabel(
                          task?.priority ||
                            "unknown",
                        )}
                      </span>
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          assignment.status,
                        )}`}
                      >
                        {formatLabel(
                          assignment.status,
                        )}
                      </span>
                    </td>

                    {/* DEADLINE */}

                    <td className="px-5 py-5">
                      <div
                        className={
                          isOverdue
                            ? "text-red-600"
                            : "text-slate-600"
                        }
                      >
                        <p className="text-sm font-medium">
                          {formatDate(
                            task?.due_date ||
                              null,
                          )}
                        </p>

                        {isOverdue && (
                          <p className="mt-0.5 text-xs font-semibold">
                            Overdue
                          </p>
                        )}
                      </div>
                    </td>

                    {/* ASSIGNED DATE */}

                    <td className="px-5 py-5">
                      <div>
                        <p className="text-sm text-slate-600">
                          {formatDate(
                            assignment.assigned_at,
                          )}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatDateTime(
                            assignment.assigned_at,
                          ).split(", ")[1] ||
                            ""}
                        </p>
                      </div>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-5 py-5">
                      <div className="flex items-center justify-end gap-2">
                        {onStatusChange &&
                          assignment.status ===
                            "assigned" && (
                            <button
                              type="button"
                              onClick={() =>
                                onStatusChange(
                                  assignment,
                                  "accepted",
                                )
                              }
                              title="Mark as accepted"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}

                        {onStatusChange &&
                          assignment.status ===
                            "accepted" && (
                            <button
                              type="button"
                              onClick={() =>
                                onStatusChange(
                                  assignment,
                                  "in_progress",
                                )
                              }
                              title="Start task"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 transition hover:bg-amber-100"
                            >
                              <Clock3 className="h-4 w-4" />
                            </button>
                          )}

                        {onStatusChange &&
                          assignment.status ===
                            "in_progress" && (
                            <button
                              type="button"
                              onClick={() =>
                                onStatusChange(
                                  assignment,
                                  "completed",
                                )
                              }
                              title="Mark completed"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}

                        {onStatusChange &&
                          assignment.status ===
                            "assigned" && (
                            <button
                              type="button"
                              onClick={() =>
                                onStatusChange(
                                  assignment,
                                  "rejected",
                                )
                              }
                              title="Reject assignment"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                        {onEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              onEdit(
                                assignment,
                              )
                            }
                            title="Edit assignment"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>

      {/* ===================================================
          MOBILE CARDS
      =================================================== */}

      <div className="space-y-3 p-4 lg:hidden">
        {assignments.map(
          (assignment) => {
            const task =
              assignment.task;

            const employee =
              assignment.employee;

            const isOverdue =
              task?.due_date &&
              new Date(
                task.due_date,
              ).getTime() <
                Date.now() &&
              assignment.status !==
                "completed";

            return (
              <div
                key={
                  assignment.id
                }
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                {/* TASK HEADER */}

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {task?.title ||
                        "Unknown task"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {task?.category
                        ? formatLabel(
                            task.category,
                          )
                        : "Unknown category"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                      assignment.status,
                    )}`}
                  >
                    {formatLabel(
                      assignment.status,
                    )}
                  </span>
                </div>

                {/* EMPLOYEE */}

                <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
                    <UserRound className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {employee?.full_name ||
                        "Employee unavailable"}
                    </p>

                    {employee && (
                      <p className="text-xs text-slate-400">
                        {
                          employee.employee_code
                        }
                      </p>
                    )}
                  </div>
                </div>

                {/* META */}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Priority
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${getPriorityClasses(
                        task?.priority ||
                          "",
                      )}`}
                    >
                      {formatLabel(
                        task?.priority ||
                          "Unknown",
                      )}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Deadline
                    </p>

                    <p
                      className={`mt-1 text-sm font-medium ${
                        isOverdue
                          ? "text-red-600"
                          : "text-slate-700"
                      }`}
                    >
                      {formatDate(
                        task?.due_date ||
                          null,
                      )}
                    </p>

                    {isOverdue && (
                      <p className="text-[11px] font-semibold text-red-500">
                        Overdue
                      </p>
                    )}
                  </div>
                </div>

                {/* ASSIGNED DATE */}

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-400">
                    Assigned{" "}
                    <span className="font-medium text-slate-600">
                      {formatDateTime(
                        assignment.assigned_at,
                      )}
                    </span>
                  </p>
                </div>

                {/* ACTIONS */}

                <div className="mt-4 flex items-center gap-2">
                  {onStatusChange &&
                    assignment.status ===
                      "assigned" && (
                      <button
                        type="button"
                        onClick={() =>
                          onStatusChange(
                            assignment,
                            "accepted",
                          )
                        }
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Accept
                      </button>
                    )}

                  {onStatusChange &&
                    assignment.status ===
                      "accepted" && (
                      <button
                        type="button"
                        onClick={() =>
                          onStatusChange(
                            assignment,
                            "in_progress",
                          )
                        }
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        <Clock3 className="h-4 w-4" />
                        Start
                      </button>
                    )}

                  {onStatusChange &&
                    assignment.status ===
                      "in_progress" && (
                    <button
                      type="button"
                      onClick={() =>
                        onStatusChange(
                          assignment,
                          "completed",
                        )
                      }
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Complete
                    </button>
                  )}

                  {onStatusChange &&
                    assignment.status ===
                      "assigned" && (
                    <button
                      type="button"
                      onClick={() =>
                        onStatusChange(
                          assignment,
                          "rejected",
                        )
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  )}

                  {onEdit && (
                    <button
                      type="button"
                      onClick={() =>
                        onEdit(
                          assignment,
                        )
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                      title="Edit assignment"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}

                  {task?.id && (
                    <button
                      type="button"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                      title="Task details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

export default TaskAssignmentTable;