import {
  CalendarDays,
  Clock3,
  ExternalLink,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getTasks } from "../../services/tasks/tasks.service";

import type { TaskWithRelations } from "../../types/task";

/* =========================================================
   HELPERS
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

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "—";
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

function getStatusClasses(
  status: string,
): string {
  switch (
    String(status).toLowerCase()
  ) {
    case "approved_delivered":
    case "approved_and_delivered":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "client_review":
    case "sent_for_client_review":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "internal_review":
    case "sent_for_internal_review":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "editing_in_progress":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";

    case "raw_footage_received":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";

    case "on_hold":
      return "border-red-200 bg-red-50 text-red-700";

    case "not_started":
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

/* =========================================================
   PLANNER
========================================================= */

function Planner() {
  const [tasks, setTasks] =
    useState<TaskWithRelations[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [dateFilter, setDateFilter] =
    useState("");

  const [priorityFilter, setPriorityFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  /* =======================================================
     LOAD TASKS
  ======================================================== */

  const loadPlanner =
    useCallback(
      async (
        refresh = false,
      ) => {
        try {
          setError("");

          if (refresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const data =
            await getTasks();

          setTasks(data);
        } catch (err) {
          console.error(
            "Unable to load planner:",
            err,
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load planner.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    void loadPlanner();
  }, [loadPlanner]);

  /* =======================================================
     PLANNED TASKS
  ======================================================== */

  const plannedTasks =
    useMemo(() => {
      return tasks.filter(
        (task) =>
          Boolean(
            task.planned_date,
          ),
      );
    }, [tasks]);

  /* =======================================================
     FILTERED TASKS
  ======================================================== */

  const filteredTasks =
    useMemo(() => {
      const searchTerm =
        search
          .trim()
          .toLowerCase();

      return plannedTasks
        .filter(
          (task) => {
            if (
              searchTerm &&
              !task.title
                .toLowerCase()
                .includes(
                  searchTerm,
                ) &&
              !(
                task.client?.name ??
                ""
              )
                .toLowerCase()
                .includes(
                  searchTerm,
                ) &&
              !(
                task.project?.name ??
                ""
              )
                .toLowerCase()
                .includes(
                  searchTerm,
                )
            ) {
              return false;
            }

            if (
              dateFilter &&
              task.planned_date !==
                dateFilter
            ) {
              return false;
            }

            if (
              priorityFilter &&
              task.priority !==
                priorityFilter
            ) {
              return false;
            }

            if (
              statusFilter &&
              task.status !==
                statusFilter
            ) {
              return false;
            }

            return true;
          },
        )
        .sort(
          (a, b) => {
            const dateA =
              a.planned_date ??
              "";

            const dateB =
              b.planned_date ??
              "";

            return dateA.localeCompare(
              dateB,
            );
          },
        );
    }, [
      plannedTasks,
      search,
      dateFilter,
      priorityFilter,
      statusFilter,
    ]);

  /* =======================================================
     STATS
  ======================================================== */

  const stats =
    useMemo(() => {
      let today = 0;
      let highPriority = 0;
      let inProgress = 0;
      let estimatedHours = 0;

      const todayString =
        new Date()
          .toISOString()
          .split("T")[0];

      plannedTasks.forEach(
        (task) => {
          if (
            task.planned_date ===
            todayString
          ) {
            today++;
          }

          if (
            task.priority ===
            "high"
          ) {
            highPriority++;
          }

          if (
            task.status ===
              "editing_in_progress" ||
            task.status ===
              "internal_review" ||
            task.status ===
              "sent_for_internal_review" ||
            task.status ===
              "client_review" ||
            task.status ===
              "sent_for_client_review"
          ) {
            inProgress++;
          }

          estimatedHours +=
            Number(
              task.estimated_hours ??
                0,
            );
        },
      );

      return {
        total: plannedTasks.length,
        today,
        highPriority,
        inProgress,
        estimatedHours,
      };
    }, [plannedTasks]);

  /* =======================================================
     CLEAR FILTERS
  ======================================================== */

  const clearFilters =
    () => {
      setSearch("");
      setDateFilter("");
      setPriorityFilter("");
      setStatusFilter("");
    };

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            PRODUCTION PLANNING
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Planner
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Plan upcoming production work,
            deadlines and daily workload.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadPlanner(true)
          }
          disabled={
            loading ||
            refreshing
          }
          className="
            inline-flex
            h-11
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            text-sm
            font-semibold
            text-slate-600
            shadow-sm
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">
            Unable to load planner
          </p>

          <p className="mt-1">
            {error}
          </p>
        </div>
      )}

      {/* =================================================
          STATS
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Planned Tasks"
          value={stats.total}
          description="Tasks with planned dates"
          icon={
            <CalendarDays
              size={20}
            />
          }
        />

        <StatCard
          label="Today"
          value={stats.today}
          description="Planned for today"
          icon={
            <Clock3
              size={20}
            />
          }
        />

        <StatCard
          label="High Priority"
          value={stats.highPriority}
          description="Needs close attention"
          icon={
            <CalendarDays
              size={20}
            />
          }
        />

        <StatCard
          label="Planned Hours"
          value={`${stats.estimatedHours.toFixed(
            1,
          )}h`}
          description={`${stats.inProgress} currently in progress`}
          icon={
            <Clock3
              size={20}
            />
          }
        />
      </div>

      {/* =================================================
          FILTER BAR
      ================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {/* SEARCH */}

          <div className="relative xl:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search tasks, clients, projects..."
              className="
                h-11
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                pl-10
                pr-4
                text-sm
                text-slate-800
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-slate-400
                focus:bg-white
              "
            />
          </div>

          {/* DATE */}

          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(
                event.target.value,
              )
            }
            className="
              h-11
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-3
              text-sm
              text-slate-700
              outline-none
              focus:border-slate-400
              focus:bg-white
            "
          />

          {/* PRIORITY */}

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value,
              )
            }
            className="
              h-11
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-3
              text-sm
              text-slate-700
              outline-none
              focus:border-slate-400
              focus:bg-white
            "
          >
            <option value="">
              All Priorities
            </option>

            <option value="high">
              High
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="low">
              Low
            </option>
          </select>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
            className="
              h-11
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-3
              text-sm
              text-slate-700
              outline-none
              focus:border-slate-400
              focus:bg-white
            "
          >
            <option value="">
              All Production Stages
            </option>

            <option value="not_started">
              Not Started / In Queue
            </option>

            <option value="raw_footage_received">
              Raw Footage Received
            </option>

            <option value="editing_in_progress">
              Editing in Progress
            </option>

            <option value="internal_review">
              Sent for Internal Review
            </option>

            <option value="client_review">
              Sent for Client Review
            </option>

            <option value="approved_delivered">
              Approved & Delivered
            </option>

            <option value="on_hold">
              On Hold
            </option>
          </select>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={
              clearFilters
            }
            className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* =================================================
          SUMMARY
      ================================================== */}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            PLANNED WORK
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-700">
              {filteredTasks.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700">
              {plannedTasks.length}
            </span>{" "}
            planned tasks
          </p>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================== */}

      <PlannerTable
        tasks={filteredTasks}
        loading={loading}
      />
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PLANNER TABLE
========================================================= */

function PlannerTable({
  tasks,
  loading,
}: {
  tasks: TaskWithRelations[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({
          length: 5,
        }).map(
          (_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
            />
          ),
        )}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <CalendarDays
            size={25}
            className="text-slate-400"
          />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900">
          No planned tasks
        </h3>

        <p className="mt-1 max-w-md text-sm text-slate-500">
          Tasks with a planned date will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* =================================================
          MOBILE
      ================================================== */}

      <div className="space-y-3 lg:hidden">
        {tasks.map(
          (task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900">
                    {task.title}
                  </h3>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {task.client?.name ??
                      "No client"}
                    {" · "}
                    {task.project?.name ??
                      "No project"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(
                    task.priority,
                  )}`}
                >
                  {formatLabel(
                    task.priority,
                  )}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoItem
                  label="Planned"
                  value={formatDate(
                    task.planned_date,
                  )}
                />

                <InfoItem
                  label="Deadline"
                  value={formatDate(
                    task.due_date,
                  )}
                />

                <InfoItem
                  label="Category"
                  value={formatLabel(
                    task.category,
                  )}
                />

                <InfoItem
                  label="Estimated"
                  value={`${Number(
                    task.estimated_hours ??
                      0,
                  ).toFixed(
                    1,
                  )}h`}
                />
              </div>

              <div className="mt-4">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                    task.status,
                  )}`}
                >
                  {formatLabel(
                    task.status,
                  )}
                </span>
              </div>

              {task.footage_link && (
                <a
                  href={
                    task.footage_link
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950"
                >
                  Open Asset

                  <ExternalLink
                    size={13}
                  />
                </a>
              )}
            </div>
          ),
        )}
      </div>

      {/* =================================================
          DESKTOP
      ================================================== */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Planned
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Task
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Client
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
                  Stage
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Deadline
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Hours
                </th>

                <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Asset
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {tasks.map(
                (task) => (
                  <tr
                    key={task.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {/* PLANNED */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays
                          size={15}
                          className="text-slate-400"
                        />

                        <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                          {formatDate(
                            task.planned_date,
                          )}
                        </span>
                      </div>
                    </td>

                    {/* TASK */}

                    <td className="px-4 py-4">
                      <div className="max-w-[220px]">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {
                            task.title
                          }
                        </p>

                        {task.special_notes && (
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {
                              task.special_notes
                            }
                          </p>
                        )}
                      </div>
                    </td>

                    {/* CLIENT */}

                    <td className="px-4 py-4">
                      <p className="whitespace-nowrap text-sm font-semibold text-slate-700">
                        {task.client
                          ?.name ??
                          "—"}
                      </p>
                    </td>

                    {/* PROJECT */}

                    <td className="px-4 py-4">
                      <div className="max-w-[190px]">
                        <p className="truncate text-sm font-semibold text-slate-700">
                          {task.project
                            ?.name ??
                            "—"}
                        </p>

                        {task.project
                          ?.series_title && (
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {
                              task
                                .project
                                .series_title
                            }
                          </p>
                        )}
                      </div>
                    </td>

                    {/* CATEGORY */}

                    <td className="px-4 py-4">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {formatLabel(
                          task.category,
                        )}
                      </span>
                    </td>

                    {/* PRIORITY */}

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(
                          task.priority,
                        )}`}
                      >
                        {formatLabel(
                          task.priority,
                        )}
                      </span>
                    </td>

                    {/* STAGE */}

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                          task.status,
                        )}`}
                      >
                        {formatLabel(
                          task.status,
                        )}
                      </span>
                    </td>

                    {/* DEADLINE */}

                    <td className="px-4 py-4">
                      <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                        {formatDate(
                          task.due_date,
                        )}
                      </span>
                    </td>

                    {/* HOURS */}

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock3
                          size={14}
                          className="text-slate-400"
                        />

                        <span className="font-semibold text-slate-700">
                          {Number(
                            task.estimated_hours ??
                              0,
                          ).toFixed(
                            1,
                          )}
                          h
                        </span>
                      </div>
                    </td>

                    {/* ASSET */}

                    <td className="px-5 py-4 text-right">
                      {task.footage_link ? (
                        <a
                          href={
                            task.footage_link
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                        >
                          Open

                          <ExternalLink
                            size={13}
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

export default Planner;