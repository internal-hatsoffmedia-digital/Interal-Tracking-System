import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Timer,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import MyWorkTable from "../../components/my-work/MyWorkTable";

import {
  getMyWork,
  updateMyWorkStatus,
} from "../../services/tasks/myWork.service";

import type { MyWorkItem } from "../../types/myWork";

/* =========================================================
   FILTER TYPES
========================================================= */

type WorkFilter =
  | "all"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "overdue";

/* =========================================================
   LABEL FORMATTER
========================================================= */

function formatLabel(
  value: string,
): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

/* =========================================================
   PAGE
========================================================= */

function MyWork() {
  /* =======================================================
     STATE
  ======================================================== */

  const [
    work,
    setWork,
  ] = useState<MyWorkItem[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<WorkFilter>("all");

  const [
    updatingId,
    setUpdatingId,
  ] = useState<string | null>(
    null,
  );

  /* =======================================================
     LOAD WORK
  ======================================================== */

  const loadWork = useCallback(
    async (
      showRefresh = false,
    ) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data =
          await getMyWork();

        setWork(data);
      } catch (err) {
        console.error(
          "Unable to load My Work:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your work.",
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
    void loadWork();
  }, [loadWork]);

  /* =======================================================
     OVERDUE CHECK
  ======================================================== */

  const isOverdue = useCallback(
    (item: MyWorkItem) => {
      if (!item.due_date) {
        return false;
      }

      if (
        item.assignment_status.toLowerCase() ===
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
    },
    [],
  );

  /* =======================================================
     FILTERED WORK
  ======================================================== */

  const filteredWork =
    useMemo(() => {
      const searchTerm =
        search
          .trim()
          .toLowerCase();

      return work.filter(
        (item) => {
          const matchesSearch =
            searchTerm === "" ||
            item.task_title
              .toLowerCase()
              .includes(
                searchTerm,
              ) ||
            (
              item.client_name ??
              ""
            )
              .toLowerCase()
              .includes(
                searchTerm,
              ) ||
            (
              item.project_name ??
              ""
            )
              .toLowerCase()
              .includes(
                searchTerm,
              );

          if (
            !matchesSearch
          ) {
            return false;
          }

          if (
            statusFilter ===
            "all"
          ) {
            return true;
          }

          if (
            statusFilter ===
            "overdue"
          ) {
            return isOverdue(
              item,
            );
          }

          return (
            item.assignment_status.toLowerCase() ===
            statusFilter
          );
        },
      );
    }, [
      work,
      search,
      statusFilter,
      isOverdue,
    ]);

  /* =======================================================
     STATS
  ======================================================== */

  const stats =
    useMemo(() => {
      let assigned = 0;
      let accepted = 0;
      let inProgress = 0;
      let completed = 0;
      let overdue = 0;
      let estimatedHours = 0;
      let actualHours = 0;

      work.forEach(
        (item) => {
          const status =
            item.assignment_status.toLowerCase();

          if (
            status ===
            "assigned"
          ) {
            assigned++;
          }

          if (
            status ===
            "accepted"
          ) {
            accepted++;
          }

          if (
            status ===
            "in_progress"
          ) {
            inProgress++;
          }

          if (
            status ===
            "completed"
          ) {
            completed++;
          }

          if (
            isOverdue(item)
          ) {
            overdue++;
          }

          estimatedHours +=
            Number(
              item.estimated_hours ??
                0,
            );

          actualHours +=
            Number(
              item.actual_hours ??
                0,
            );
        },
      );

      return {
        total: work.length,
        assigned,
        accepted,
        inProgress,
        completed,
        overdue,
        estimatedHours,
        actualHours,
      };
    }, [
      work,
      isOverdue,
    ]);

  /* =======================================================
     STATUS UPDATE
  ======================================================== */

  const handleStatusChange =
    useCallback(
      async (
        assignmentId: string,
        status: string,
      ) => {
        const currentItem =
          work.find(
            (item) =>
              item.assignment_id ===
              assignmentId,
          );

        if (!currentItem) {
          return;
        }

        const readableStatus =
          formatLabel(status);

        const confirmMessage =
          status === "completed"
            ? `Mark "${currentItem.task_title}" as Complete and submit to your Project Coordinator for review?`
            : status === "in_progress"
            ? `Start working on "${currentItem.task_title}"?`
            : `Change "${currentItem.task_title}" to ${readableStatus}?`;

        const confirmed =
          window.confirm(confirmMessage);

        if (!confirmed) {
          return;
        }

        try {
          setUpdatingId(
            assignmentId,
          );

          setError("");

          await updateMyWorkStatus(
            assignmentId,
            status,
          );

          setWork(
            (current) =>
              current.map(
                (item) => {
                  if (
                    item.assignment_id !==
                    assignmentId
                  ) {
                    return item;
                  }

                  return {
                    ...item,
                    assignment_status:
                      status,

                    accepted_at:
                      status ===
                      "accepted"
                        ? new Date().toISOString()
                        : item.accepted_at,

                    completed_at:
                      status ===
                      "completed"
                        ? new Date().toISOString()
                        : item.completed_at,
                  };
                },
              ),
          );
        } catch (err) {
          console.error(
            "Unable to update assignment:",
            err,
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to update task status.",
          );
        } finally {
          setUpdatingId(null);
        }
      },
      [work],
    );

  /* =======================================================
     FILTER BUTTON
  ======================================================== */

  const filterButtonClasses =
    (
      active: boolean,
    ) =>
      `
        inline-flex
        items-center
        justify-center
        rounded-lg
        px-3
        py-2
        text-xs
        font-semibold
        transition
        ${
          active
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }
      `;

  /* =======================================================
     STAT CARD
  ======================================================== */

  interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    description: string;
  }

  const StatCard = ({
    label,
    value,
    icon,
    description,
  }: StatCardProps) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );

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
            WORKSPACE
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            My Work
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            View and manage the production
            tasks assigned to you.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadWork(true)
          }
          disabled={
            loading ||
            refreshing
          }
          className="
            inline-flex
            h-10
            items-center
            justify-center
            gap-2
            self-start
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            text-sm
            font-semibold
            text-slate-700
            shadow-sm
            transition
            hover:border-slate-300
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-50
            lg:self-auto
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

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Unable to load your work
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          STATS
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tasks"
          value={stats.total}
          icon={
            <Timer size={20} />
          }
          description="Currently assigned"
        />

        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={
            <Clock3 size={20} />
          }
          description={`${stats.accepted} accepted`}
        />

        <StatCard
          label="Completed"
          value={stats.completed}
          icon={
            <CheckCircle2
              size={20}
            />
          }
          description={`${stats.overdue} overdue`}
        />

        <StatCard
          label="Hours"
          value={`${stats.actualHours.toFixed(
            1,
          )}h`}
          icon={
            <Timer size={20} />
          }
          description={`of ${stats.estimatedHours.toFixed(
            1,
          )}h estimated`}
        />
      </div>

      {/* =================================================
          WORK AREA
      ================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TOOLBAR */}

        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          {/* SEARCH */}

          <div className="relative w-full lg:max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search your tasks..."
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-3
                text-sm
                text-slate-700
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-slate-400
                focus:bg-white
                focus:ring-2
                focus:ring-slate-100
              "
            />
          </div>

          {/* FILTERS */}

          <div className="flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 lg:w-auto">
            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "all",
                )
              }
              className={filterButtonClasses(
                statusFilter ===
                  "all",
              )}
            >
              All
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "assigned",
                )
              }
              className={filterButtonClasses(
                statusFilter ===
                  "assigned",
              )}
            >
              Assigned
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "accepted",
                )
              }
              className={filterButtonClasses(
                statusFilter ===
                  "accepted",
              )}
            >
              Accepted
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "in_progress",
                )
              }
              className={filterButtonClasses(
                statusFilter ===
                  "in_progress",
              )}
            >
              In Progress
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "completed",
                )
              }
              className={filterButtonClasses(
                statusFilter ===
                  "completed",
              )}
            >
              Completed
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "overdue",
                )
              }
              className={filterButtonClasses(
                statusFilter ===
                  "overdue",
              )}
            >
              Overdue
            </button>
          </div>
        </div>

        {/* RESULT COUNT */}

        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-700">
              {filteredWork.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700">
              {work.length}
            </span>{" "}
            tasks
          </p>
        </div>

        {/* TABLE */}

        <div className="p-4">
          <MyWorkTable
            work={filteredWork}
            loading={
              loading
            }
            onStatusChange={
              handleStatusChange
            }
          />
        </div>
      </div>

      {/* =================================================
          UPDATE INDICATOR
      ================================================== */}

      {updatingId && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg">
          <RefreshCw
            size={16}
            className="animate-spin"
          />

          Updating task...
        </div>
      )}
    </div>
  );
}

export default MyWork;