import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  UserRound,
} from "lucide-react";

import type { TaskWithRelations } from "../../types/task";


interface TaskTableProps {
  tasks: TaskWithRelations[];
  loading: boolean;

  onEdit: (
    task: TaskWithRelations,
  ) => void;

  onStatusChange?: (
    task: TaskWithRelations,
  ) => void;
}


/* =========================================================
   FORMAT LABEL
========================================================= */

function formatLabel(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}


/* =========================================================
   STATUS HELPERS
========================================================= */

function getStatusClasses(
  status: string,
): string {
  const value =
    status.toLowerCase();

  if (
    value.includes("complete") ||
    value.includes("deliver") ||
    value.includes("approved")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    value.includes("progress") ||
    value.includes("editing") ||
    value.includes("review")
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    value.includes("hold") ||
    value.includes("queue") ||
    value.includes("pending")
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    value.includes("cancel") ||
    value.includes("delay") ||
    value.includes("blocked")
  ) {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}


function getPriorityClasses(
  priority: string,
): string {
  const value =
    priority.toLowerCase();

  if (
    value.includes("high") ||
    value.includes("urgent")
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    value.includes("medium")
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    value.includes("low")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-600";
}


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "No deadline";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}


/* =========================================================
   DEADLINE CHECK
========================================================= */

function isOverdue(
  value: string | null | undefined,
): boolean {
  if (!value) {
    return false;
  }

  const deadline =
    new Date(value);

  if (
    Number.isNaN(
      deadline.getTime(),
    )
  ) {
    return false;
  }

  return (
    deadline.getTime() <
    Date.now()
  );
}


/* =========================================================
   LOADING SKELETON
========================================================= */

function LoadingRows() {
  return (
    <>
      {Array.from(
        { length: 5 },
        (_, index) => (
          <tr
            key={index}
            className="border-b border-slate-100 last:border-0"
          >
            {Array.from(
              { length: 8 },
              (_, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-5"
                >
                  <div className="h-4 animate-pulse rounded-md bg-slate-100" />
                </td>
              ),
            )}
          </tr>
        ),
      )}
    </>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FileText
          size={24}
          strokeWidth={1.6}
        />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        No tasks found
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        Tasks matching your current filters
        will appear here.
      </p>

    </div>
  );
}


/* =========================================================
   TASK CARD — MOBILE
========================================================= */

function TaskCard({
  task,
  onEdit,
  onStatusChange,
}: {
  task: TaskWithRelations;

  onEdit: (
    task: TaskWithRelations,
  ) => void;

  onStatusChange?: (
    task: TaskWithRelations,
  ) => void;
}) {
  const overdue =
    isOverdue(
      task.due_date,
    );

  const status =
    String(
      task.status,
    );

  const priority =
    String(
      task.priority,
    );


  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">

              <FileText
                size={15}
                strokeWidth={1.8}
              />

            </div>

            <span className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {task.client?.short_name ||
                task.client?.name ||
                "No client"}
            </span>

          </div>

          <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900">
            {task.title}
          </h3>

          {task.project && (
            <p className="mt-1 truncate text-xs text-slate-400">
              {task.project.name}
              {task.project.series_title
                ? ` · ${task.project.series_title}`
                : ""}
            </p>
          )}

        </div>

        <button
          type="button"
          onClick={() =>
            onEdit(task)
          }
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label={`Edit ${task.title}`}
        >
          <Edit3
            size={15}
            strokeWidth={1.8}
          />
        </button>

      </div>


      {/* BADGES */}

      <div className="mt-4 flex flex-wrap gap-2">

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${getStatusClasses(
            status,
          )}`}
        >
          {formatLabel(status)}
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${getPriorityClasses(
            priority,
          )}`}
        >
          {formatLabel(priority)}
        </span>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
          {formatLabel(
            task.category,
          )}
        </span>

      </div>


      {/* DETAILS */}

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">

        <div>

          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Deadline
          </p>

          <div
            className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${
              overdue
                ? "text-red-600"
                : "text-slate-600"
            }`}
          >
            <CalendarDays
              size={13}
              strokeWidth={1.8}
            />

            {formatDate(
              task.due_date,
            )}

          </div>

        </div>


        <div>

          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Estimated
          </p>

          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">

            <Clock3
              size={13}
              strokeWidth={1.8}
            />

            {Number(
              task.estimated_hours ??
                0,
            ).toFixed(1)}
            h

          </div>

        </div>

      </div>


      {/* FOOTER */}

      {onStatusChange && (
        <div className="mt-4 border-t border-slate-100 pt-3">

          <button
            type="button"
            onClick={() =>
              onStatusChange(
                task,
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
          >
            <PlayCircle
              size={14}
              strokeWidth={1.8}
            />

            Update status

          </button>

        </div>
      )}

    </article>
  );
}


/* =========================================================
   DESKTOP TABLE
========================================================= */

function TaskTable({
  tasks,
  loading,
  onEdit,
  onStatusChange,
}: TaskTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* =================================================
          DESKTOP
      ================================================== */}

      <div className="hidden overflow-x-auto lg:block">

        <table className="w-full min-w-[1180px] border-collapse">

          <thead>

            <tr className="border-b border-slate-100 bg-slate-50/70">

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Task
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Client
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Category
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Priority
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Status
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Deadline
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Hours
              </th>

              <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Actions
              </th>

            </tr>

          </thead>


          <tbody>

            {loading ? (
              <LoadingRows />
            ) : tasks.length === 0 ? (
              <tr>

                <td colSpan={8}>

                  <EmptyState />

                </td>

              </tr>
            ) : (
              tasks.map(
                (task) => {
                  const overdue =
                    isOverdue(
                      task.due_date,
                    );

                  const status =
                    String(
                      task.status,
                    );

                  const priority =
                    String(
                      task.priority,
                    );


                  return (
                    <tr
                      key={task.id}
                      className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/50"
                    >

                      {/* TASK */}

                      <td className="max-w-[300px] px-4 py-4">

                        <div className="flex min-w-0 items-start gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">

                            <FileText
                              size={16}
                              strokeWidth={1.8}
                            />

                          </div>


                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-slate-900">
                              {task.title}
                            </p>

                            <p className="mt-1 truncate text-[11px] text-slate-400">
                              {task.project?.name ||
                                "No project"}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* CLIENT */}

                      <td className="px-4 py-4">

                        <div className="min-w-[140px]">

                          <p className="truncate text-sm font-medium text-slate-700">
                            {task.client?.name ||
                              "—"}
                          </p>

                          {task.client?.short_name && (
                            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                              {
                                task
                                  .client
                                  .short_name
                              }
                            </p>
                          )}

                        </div>

                      </td>


                      {/* CATEGORY */}

                      <td className="px-4 py-4">

                        <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                          {formatLabel(
                            task.category,
                          )}
                        </span>

                      </td>


                      {/* PRIORITY */}

                      <td className="px-4 py-4">

                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${getPriorityClasses(
                            priority,
                          )}`}
                        >
                          {formatLabel(
                            priority,
                          )}
                        </span>

                      </td>


                      {/* STATUS */}

                      <td className="px-4 py-4">

                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${getStatusClasses(
                            status,
                          )}`}
                        >
                          {formatLabel(
                            status,
                          )}
                        </span>

                      </td>


                      {/* DEADLINE */}

                      <td className="px-4 py-4">

                        <div
                          className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${
                            overdue
                              ? "text-red-600"
                              : "text-slate-600"
                          }`}
                        >

                          <CalendarDays
                            size={13}
                            strokeWidth={1.8}
                          />

                          <span>
                            {formatDate(
                              task.due_date,
                            )}
                          </span>

                        </div>

                        {overdue && (
                          <p className="mt-1 text-[10px] text-red-500">
                            Overdue
                          </p>
                        )}

                      </td>


                      {/* HOURS */}

                      <td className="px-4 py-4">

                        <div className="whitespace-nowrap">

                          <p className="text-xs font-medium text-slate-700">
                            {Number(
                              task.actual_hours ??
                                0,
                            ).toFixed(1)}
                            {" "}
                            /
                            {" "}
                            {Number(
                              task.estimated_hours ??
                                0,
                            ).toFixed(1)}
                            h
                          </p>

                          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full bg-slate-900"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Number(
                                    task.estimated_hours ??
                                      0,
                                  ) > 0
                                    ? (Number(
                                        task.actual_hours ??
                                          0,
                                      ) /
                                        Number(
                                          task.estimated_hours ??
                                            0,
                                        )) *
                                        100
                                    : 0,
                                )}%`,
                              }}
                            />

                          </div>

                        </div>

                      </td>


                      {/* ACTIONS */}

                      <td className="px-4 py-4">

                        <div className="flex items-center justify-end gap-1.5">

                          {task.footage_link && (
                            <a
                              href={
                                task.footage_link
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="Open footage link"
                            >

                              <ExternalLink
                                size={14}
                                strokeWidth={1.8}
                              />

                            </a>
                          )}


                          <button
                            type="button"
                            onClick={() =>
                              onEdit(
                                task,
                              )
                            }
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                          >

                            <Edit3
                              size={13}
                              strokeWidth={1.8}
                            />

                            Edit

                          </button>


                          {onStatusChange && (
                            <button
                              type="button"
                              onClick={() =>
                                onStatusChange(
                                  task,
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="Update status"
                            >

                              <MoreHorizontal
                                size={15}
                                strokeWidth={1.8}
                              />

                            </button>
                          )}

                        </div>

                      </td>

                    </tr>
                  );
                },
              )
            )}

          </tbody>

        </table>

      </div>


      {/* =================================================
          MOBILE
      ================================================== */}

      <div className="space-y-3 bg-slate-50/50 p-3 lg:hidden">

        {loading ? (
          Array.from(
            { length: 3 },
            (_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-2xl bg-white"
              />
            )
          )
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl bg-white">
            <EmptyState />
          </div>
        ) : (
          tasks.map(
            (task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onStatusChange={
                  onStatusChange
                }
              />
            ),
          )
        )}

      </div>

    </section>
  );
}


export default TaskTable;