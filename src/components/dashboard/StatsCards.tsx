import {
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

/* ============================================================
   TYPES
============================================================ */

interface TaskRow {
  id: string;
  status: string | null;
  priority: string | null;
  planned_date: string | null;
  due_date: string | null;
  created_at: string | null;
}

interface ProjectRow {
  id: string;
  health: string | null;
  status: string | null;
}

/* ============================================================
   CARD TYPES
============================================================ */

interface StatCard {
  label: string;
  value: string;
  change: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
}

/* ============================================================
   HELPERS
============================================================ */

/**
 * Normalize enum/status values so the dashboard
 * remains tolerant of values such as:
 *
 * in_progress
 * In Progress
 * IN-PROGRESS
 */
function normalizeStatus(
  value: string | null | undefined,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Determine whether a task is currently
 * being worked on.
 */
function isInProgress(
  status: string | null | undefined,
): boolean {
  const normalized = normalizeStatus(
    status,
  );

  return [
    "in_progress",
    "editing_in_progress",
    "editing",
    "working",
  ].includes(normalized);
}

/**
 * Determine whether a task is waiting
 * for internal/client review.
 */
function isInReview(
  status: string | null | undefined,
): boolean {
  const normalized = normalizeStatus(
    status,
  );

  return [
    "in_review",
    "review",
    "sent_for_internal_review",
    "sent_for_client_review",
    "internal_review",
    "client_review",
  ].includes(normalized);
}

/**
 * Determine whether a task is currently
 * blocked / on hold.
 */
function isBlocked(
  status: string | null | undefined,
): boolean {
  const normalized = normalizeStatus(
    status,
  );

  return [
    "on_hold",
    "blocked",
    "delayed",
    "delayed_blocked",
  ].includes(normalized);
}

/**
 * Determine whether a task is overdue.
 */
function isOverdue(
  task: TaskRow,
): boolean {
  if (!task.due_date) {
    return false;
  }

  const normalized = normalizeStatus(
    task.status,
  );

  const completedStatuses = [
    "completed",
    "approved_and_delivered",
    "delivered",
    "closed",
    "completed_and_closed",
  ];

  if (
    completedStatuses.includes(
      normalized,
    )
  ) {
    return false;
  }

  const dueDate = new Date(
    task.due_date,
  );

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return (
    dueDate.getTime() <
    Date.now()
  );
}

/**
 * Determine whether a project is at risk.
 */
function isProjectAtRisk(
  project: ProjectRow,
): boolean {
  const health = normalizeStatus(
    project.health,
  );

  const status = normalizeStatus(
    project.status,
  );

  return [
    "at_risk",
    "delayed",
    "delayed_blocked",
    "blocked",
    "on_hold",
  ].includes(health) ||
    [
      "at_risk",
      "delayed",
      "delayed_blocked",
      "blocked",
      "on_hold",
    ].includes(status);
}

/**
 * Safely map a Supabase row.
 */
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
    status:
      typeof row.status === "string"
        ? row.status
        : null,
    priority:
      typeof row.priority === "string"
        ? row.priority
        : null,
    planned_date:
      typeof row.planned_date ===
      "string"
        ? row.planned_date
        : null,
    due_date:
      typeof row.due_date ===
      "string"
        ? row.due_date
        : null,
    created_at:
      typeof row.created_at ===
      "string"
        ? row.created_at
        : null,
  };
}

/**
 * Safely map a project row.
 */
function mapProject(
  value: unknown,
): ProjectRow {
  const row =
    value as Record<
      string,
      unknown
    >;

  return {
    id: String(
      row.id ?? "",
    ),
    health:
      typeof row.health === "string"
        ? row.health
        : null,
    status:
      typeof row.status === "string"
        ? row.status
        : null,
  };
}

/* ============================================================
   COMPONENT
============================================================ */

function StatsCards() {
  const [tasks, setTasks] =
    useState<TaskRow[]>([]);

  const [projects, setProjects] =
    useState<ProjectRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD DASHBOARD DATA
  ========================================================== */

  const loadStats =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Load tasks and projects in parallel.
         *
         * We intentionally use separate queries
         * instead of relying on PostgREST
         * relationship inference.
         */

        const [
          tasksResult,
          projectsResult,
        ] = await Promise.all([
          supabase
            .from("tasks")
            .select(
              [
                "id",
                "status",
                "priority",
                "planned_date",
                "due_date",
                "created_at",
              ].join(", "),
            ),

          supabase
            .from("projects")
            .select(
              [
                "id",
                "health",
                "status",
              ].join(", "),
            ),
        ]);

        if (tasksResult.error) {
          throw tasksResult.error;
        }

        if (projectsResult.error) {
          throw projectsResult.error;
        }

        const taskRows =
          Array.isArray(
            tasksResult.data,
          )
            ? tasksResult.data.map(
                mapTask,
              )
            : [];

        const projectRows =
          Array.isArray(
            projectsResult.data,
          )
            ? projectsResult.data.map(
                mapProject,
              )
            : [];

        setTasks(taskRows);
        setProjects(projectRows);
      } catch (err) {
        console.error(
          "Failed to load dashboard statistics:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard statistics.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  /* ==========================================================
     CALCULATE METRICS
  ========================================================== */

  const totalTasks =
    tasks.length;

  const inProgressTasks =
    tasks.filter((task) =>
      isInProgress(
        task.status,
      ),
    ).length;

  const reviewTasks =
    tasks.filter((task) =>
      isInReview(
        task.status,
      ),
    );

  const inReviewCount =
    reviewTasks.length;

  const blockedTaskCount =
    tasks.filter((task) =>
      isBlocked(
        task.status,
      ),
    ).length;

  const overdueTaskCount =
    tasks.filter(isOverdue).length;

  const atRiskProjectCount =
    projects.filter(
      isProjectAtRisk,
    ).length;

  /*
   * At Risk represents the total number
   * of things currently requiring attention.
   *
   * We combine:
   * - overdue tasks
   * - blocked tasks
   * - at-risk projects
   *
   * Deduplication between tasks/projects
   * is not possible without a direct
   * project relationship in this query,
   * so this represents workload risk,
   * not unique entities.
   */
  const atRiskCount =
    overdueTaskCount +
    blockedTaskCount +
    atRiskProjectCount;

  const urgentReviewCount =
    reviewTasks.filter(
      (task) =>
        normalizeStatus(
          task.priority,
        ) === "high",
    ).length;

  /* ==========================================================
     CARD DATA
  ========================================================== */

  const stats: StatCard[] = [
    {
      label: "Total Tasks",
      value: String(
        totalTasks,
      ),
      change: `${inProgressTasks} active`,
      description:
        "current production workload",
      icon: FolderKanban,
      iconClassName:
        "text-slate-700",
    },
    {
      label: "In Progress",
      value: String(
        inProgressTasks,
      ),
      change:
        inProgressTasks > 0
          ? "active now"
          : "none active",
      description:
        "currently being worked on",
      icon: PlayCircle,
      iconClassName:
        "text-blue-600",
    },
    {
      label: "In Review",
      value: String(
        inReviewCount,
      ),
      change:
        urgentReviewCount > 0
          ? `${urgentReviewCount} urgent`
          : "no urgent",
      description:
        "awaiting internal or client review",
      icon: CheckCircle2,
      iconClassName:
        "text-emerald-600",
    },
    {
      label: "At Risk",
      value: String(
        atRiskCount,
      ),
      change:
        blockedTaskCount > 0
          ? `${blockedTaskCount} blocked`
          : overdueTaskCount > 0
            ? `${overdueTaskCount} overdue`
            : atRiskProjectCount > 0
              ? `${atRiskProjectCount} projects`
              : "all clear",
      description:
        "needs attention",
      icon: AlertTriangle,
      iconClassName:
        "text-orange-600",
    },
  ];

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section
      aria-label="Dashboard statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat) => {
        const Icon =
          stat.icon;

        return (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            {/* -----------------------------------------------
                ICON
            ------------------------------------------------ */}

            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Icon
                  size={19}
                  strokeWidth={1.8}
                  className={
                    stat.iconClassName
                  }
                />
              </div>

              {loading && (
                <RefreshCw className="h-4 w-4 animate-spin text-slate-300" />
              )}
            </div>

            {/* -----------------------------------------------
                CONTENT
            ------------------------------------------------ */}

            <div className="mt-5">
              <p className="text-sm text-slate-500">
                {stat.label}
              </p>

              <div className="mt-1 flex min-h-[38px] items-end gap-2">
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded-md bg-slate-100" />
                ) : (
                  <span className="text-3xl font-semibold tracking-tight text-slate-950">
                    {stat.value}
                  </span>
                )}

                {!loading && (
                  <span
                    className={`mb-1 text-xs font-medium ${
                      stat.label ===
                      "At Risk"
                        ? atRiskCount >
                          0
                          ? "text-orange-600"
                          : "text-emerald-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>

            {/* -----------------------------------------------
                ERROR INDICATOR
            ------------------------------------------------ */}

            {error && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-red-500">
                <AlertTriangle className="h-3.5 w-3.5" />

                <span>
                  Data unavailable
                </span>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default StatsCards;