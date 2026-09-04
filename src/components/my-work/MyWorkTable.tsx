import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Play,
  UserCheck,
} from "lucide-react";

import type { MyWorkItem } from "../../types/myWork";

interface MyWorkTableProps {
  work: MyWorkItem[];
  loading: boolean;
  onStatusChange: (
    assignmentId: string,
    status: string,
  ) => void;
}

/* =========================================================
   LABEL FORMATTER
========================================================= */

function formatLabel(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(
  value: string | null,
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
    return "—";
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

/* =========================================================
   DEADLINE CHECK
========================================================= */

function isOverdue(
  item: MyWorkItem,
): boolean {
  if (!item.due_date) {
    return false;
  }

  if (
    String(
      item.assignment_status,
    ).toLowerCase() ===
    "completed"
  ) {
    return false;
  }

  const dueDate =
    new Date(
      item.due_date,
    );

  return (
    dueDate.getTime() <
    Date.now()
  );
}

/* =========================================================
   STATUS CLASSES
========================================================= */

function getStatusClasses(
  status: string,
): string {
  switch (
    String(status).toLowerCase()
  ) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "in_progress":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "accepted":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "assigned":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

/* =========================================================
   PRIORITY CLASSES
========================================================= */

function getPriorityClasses(
  priority: string,
): string {
  switch (
    String(priority).toLowerCase()
  ) {
    case "high":
      return "border-red-200 bg-red-50 text-red-700";

    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "low":
      return "border-slate-200 bg-slate-50 text-slate-600";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

/* =========================================================
   ACTION BUTTON
========================================================= */

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled = false,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="
        inline-flex
        h-8
        items-center
        justify-center
        gap-1.5
        rounded-lg
        border
        border-slate-200
        bg-white
        px-2.5
        text-xs
        font-semibold
        text-slate-600
        transition
        hover:border-slate-300
        hover:bg-slate-50
        hover:text-slate-900
        disabled:cursor-not-allowed
        disabled:opacity-40
      "
    >
      {icon}

      <span className="hidden 2xl:inline">
        {label}
      </span>
    </button>
  );
}

/* =========================================================
   WORK ACTIONS
========================================================= */

function WorkActions({
  item,
  onStatusChange,
}: {
  item: MyWorkItem;
  onStatusChange: (
    assignmentId: string,
    status: string,
  ) => void;
}) {
  const status =
    String(
      item.assignment_status,
    ).toLowerCase();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* ===============================================
          ASSIGNED → ACCEPT
      ================================================ */}

      {status ===
        "assigned" && (
        <ActionButton
          label="Accept"
          icon={
            <UserCheck
              size={14}
            />
          }
          onClick={() =>
            onStatusChange(
              item.assignment_id,
              "accepted",
            )
          }
        />
      )}

      {/* ===============================================
          ASSIGNED / ACCEPTED → START
      ================================================ */}

      {(status ===
        "assigned" ||
        status ===
          "accepted") && (
        <ActionButton
          label="Start"
          icon={
            <Play
              size={13}
            />
          }
          onClick={() =>
            onStatusChange(
              item.assignment_id,
              "in_progress",
            )
          }
        />
      )}

      {/* ===============================================
          IN PROGRESS → COMPLETE
      ================================================ */}

      {status ===
        "in_progress" && (
        <ActionButton
          label="Complete"
          icon={
            <CheckCircle2
              size={14}
            />
          }
          onClick={() =>
            onStatusChange(
              item.assignment_id,
              "completed",
            )
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   LOADING STATE
========================================================= */

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="
            h-20
            animate-pulse
            rounded-xl
            border
            border-slate-200
            bg-slate-50
          "
        />
      ))}
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Clock3
          size={25}
          className="text-slate-400"
        />
      </div>

      <h3 className="text-base font-bold text-slate-900">
        No assigned work
      </h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">
        You currently don't have any tasks
        assigned to you.
      </p>
    </div>
  );
}

/* =========================================================
   MOBILE WORK CARD
========================================================= */

function MobileWorkCard({
  item,
  onStatusChange,
}: {
  item: MyWorkItem;
  onStatusChange: (
    assignmentId: string,
    status: string,
  ) => void;
}) {
  const overdue =
    isOverdue(item);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* HEADER */}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-slate-900">
            {item.task_title}
          </h3>

          <p className="mt-1 truncate text-xs text-slate-500">
            {item.client_name ??
              "No client"}
            {" · "}
            {item.project_name ??
              "No project"}
          </p>
        </div>

        <span
          className={`
            shrink-0
            rounded-full
            border
            px-2.5
            py-1
            text-[11px]
            font-semibold
            ${getPriorityClasses(
              item.priority,
            )}
          `}
        >
          {formatLabel(
            item.priority,
          )}
        </span>
      </div>

      {/* STATUS */}

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`
            rounded-full
            border
            px-2.5
            py-1
            text-[11px]
            font-semibold
            ${getStatusClasses(
              item.assignment_status,
            )}
          `}
        >
          {formatLabel(
            item.assignment_status,
          )}
        </span>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {formatLabel(
            item.category,
          )}
        </span>
      </div>

      {/* DETAILS */}

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-400">
            Deadline
          </p>

          <p
            className={`mt-0.5 font-semibold ${
              overdue
                ? "text-red-600"
                : "text-slate-700"
            }`}
          >
            {formatDate(
              item.due_date,
            )}
          </p>

          {overdue && (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-red-500">
              Overdue
            </p>
          )}
        </div>

        <div>
          <p className="text-slate-400">
            Estimated
          </p>

          <p className="mt-0.5 font-semibold text-slate-700">
            {Number(
              item.estimated_hours ??
                0,
            ).toFixed(1)}
            h
          </p>
        </div>

        <div>
          <p className="text-slate-400">
            Actual
          </p>

          <p className="mt-0.5 font-semibold text-slate-700">
            {Number(
              item.actual_hours ??
                0,
            ).toFixed(1)}
            h
          </p>
        </div>

        <div>
          <p className="text-slate-400">
            Assigned
          </p>

          <p className="mt-0.5 font-semibold text-slate-700">
            {formatDate(
              item.assigned_at,
            )}
          </p>
        </div>
      </div>

      {/* FOOTAGE */}

      {item.footage_link && (
        <a
          href={
            item.footage_link
          }
          target="_blank"
          rel="noreferrer"
          className="
            mt-4
            inline-flex
            items-center
            gap-1.5
            text-xs
            font-semibold
            text-slate-700
            hover:text-slate-950
          "
        >
          Open Footage

          <ExternalLink
            size={13}
          />
        </a>
      )}

      {/* ACTIONS */}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <WorkActions
          item={item}
          onStatusChange={
            onStatusChange
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   DESKTOP TABLE
========================================================= */

function MyWorkTable({
  work,
  loading,
  onStatusChange,
}: MyWorkTableProps) {
  if (loading) {
    return (
      <LoadingRows />
    );
  }

  if (work.length === 0) {
    return (
      <EmptyState />
    );
  }

  return (
    <>
      {/* =================================================
          MOBILE
      ================================================== */}

      <div className="space-y-3 lg:hidden">
        {work.map(
          (item) => (
            <MobileWorkCard
              key={
                item.assignment_id
              }
              item={item}
              onStatusChange={
                onStatusChange
              }
            />
          ),
        )}
      </div>

      {/* =================================================
          DESKTOP
      ================================================== */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Task
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Project
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Category
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Priority
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Deadline
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Hours
                </th>

                <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {work.map(
                (item) => {
                  const overdue =
                    isOverdue(
                      item,
                    );

                  const estimated =
                    Number(
                      item.estimated_hours ??
                        0,
                    );

                  const actual =
                    Number(
                      item.actual_hours ??
                        0,
                    );

                  const progress =
                    estimated >
                    0
                      ? Math.min(
                          100,
                          (actual /
                            estimated) *
                            100,
                        )
                      : 0;

                  return (
                    <tr
                      key={
                        item.assignment_id
                      }
                      className="transition hover:bg-slate-50/70"
                    >
                      {/* TASK */}

                      <td className="px-5 py-4">
                        <div className="max-w-[260px]">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {
                              item.task_title
                            }
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {
                              item.client_name
                            }
                          </p>

                          {item.revision_status && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              {formatLabel(
                                item.revision_status,
                              )}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* PROJECT */}

                      <td className="px-4 py-4">
                        <div className="max-w-[190px]">
                          <p className="truncate text-sm font-semibold text-slate-700">
                            {
                              item.project_name ??
                                "—"
                            }
                          </p>

                          {item.series_title && (
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {
                                item.series_title
                              }
                            </p>
                          )}
                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td className="px-4 py-4">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {formatLabel(
                            item.category,
                          )}
                        </span>
                      </td>

                      {/* PRIORITY */}

                      <td className="px-4 py-4">
                        <span
                          className={`
                            inline-flex
                            rounded-full
                            border
                            px-2.5
                            py-1
                            text-[11px]
                            font-semibold
                            ${getPriorityClasses(
                              item.priority,
                            )}
                          `}
                        >
                          {formatLabel(
                            item.priority,
                          )}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4">
                        <span
                          className={`
                            inline-flex
                            rounded-full
                            border
                            px-2.5
                            py-1
                            text-[11px]
                            font-semibold
                            ${getStatusClasses(
                              item.assignment_status,
                            )}
                          `}
                        >
                          {formatLabel(
                            item.assignment_status,
                          )}
                        </span>
                      </td>

                      {/* DEADLINE */}

                      <td className="px-4 py-4">
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              overdue
                                ? "text-red-600"
                                : "text-slate-700"
                            }`}
                          >
                            {formatDate(
                              item.due_date,
                            )}
                          </p>

                          {overdue && (
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-red-500">
                              Overdue
                            </p>
                          )}
                        </div>
                      </td>

                      {/* HOURS */}

                      <td className="px-4 py-4">
                        <div className="w-[105px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700">
                              {actual.toFixed(
                                1,
                              )}
                              h
                            </span>

                            <span className="text-slate-400">
                              /
                              {estimated.toFixed(
                                1,
                              )}
                              h
                            </span>
                          </div>

                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-slate-700 transition-all"
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <WorkActions
                            item={
                              item
                            }
                            onStatusChange={
                              onStatusChange
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default MyWorkTable;