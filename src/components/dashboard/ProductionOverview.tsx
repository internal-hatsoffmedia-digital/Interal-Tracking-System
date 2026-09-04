import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Eye,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../../lib/supabase";

/* ============================================================
   TYPES
============================================================ */

interface TaskRow {
  id: string;
  status: string | null;
  planned_date: string | null;
}

/* ============================================================
   STAGE TYPE
============================================================ */

interface ProductionStage {
  label: string;
  value: number;
  percentage: number;
  icon: LucideIcon;
}

/* ============================================================
   HELPERS
============================================================ */

/**
 * Normalize database enum/status values.
 *
 * Examples:
 * "In Progress"       -> "in_progress"
 * "in-progress"       -> "in_progress"
 * "IN_PROGRESS"       -> "in_progress"
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
 * Get today's date in local time.
 *
 * We use local date rather than UTC so the
 * dashboard matches the user's working day.
 */
function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Safely map Supabase task data.
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
    planned_date:
      typeof row.planned_date ===
      "string"
        ? row.planned_date
        : null,
  };
}

/**
 * Determine whether a task belongs
 * to the "In Progress" stage.
 */
function isInProgress(
  status: string | null,
): boolean {
  const normalized =
    normalizeStatus(status);

  return [
    "in_progress",
    "editing_in_progress",
    "editing",
    "working",
  ].includes(normalized);
}

/**
 * Determine whether a task belongs
 * to the internal review stage.
 */
function isInternalReview(
  status: string | null,
): boolean {
  const normalized =
    normalizeStatus(status);

  return [
    "sent_for_internal_review",
    "internal_review",
    "in_review",
  ].includes(normalized);
}

/**
 * Determine whether a task belongs
 * to the client review stage.
 */
function isClientReview(
  status: string | null,
): boolean {
  const normalized =
    normalizeStatus(status);

  return [
    "sent_for_client_review",
    "client_review",
  ].includes(normalized);
}

/**
 * Determine whether a task is completed.
 */
function isCompleted(
  status: string | null,
): boolean {
  const normalized =
    normalizeStatus(status);

  return [
    "approved_delivered",
    "approved_and_delivered",
    "completed",
    "delivered",
    "completed_and_closed",
    "closed",
  ].includes(normalized);
}

/**
 * Calculate percentage safely.
 */
function calculatePercentage(
  value: number,
  total: number,
): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (value / total) * 100,
    ),
  );
}

/* ============================================================
   COMPONENT
============================================================ */

function ProductionOverview() {
  const [tasks, setTasks] =
    useState<TaskRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD TODAY'S TASKS
  ========================================================== */

  const loadProduction =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const today =
          getTodayDate();

        const {
          data,
          error: tasksError,
        } = await supabase
          .from("tasks")
          .select(
            [
              "id",
              "status",
              "planned_date",
            ].join(", "),
          )
          .eq(
            "planned_date",
            today,
          );

        if (tasksError) {
          throw tasksError;
        }

        const rows =
          Array.isArray(data)
            ? data.map(mapTask)
            : [];

        setTasks(rows);
      } catch (err) {
        console.error(
          "Failed to load today's production:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load production data.",
        );

        setTasks([]);
      } finally {
        setLoading(false);
      }
    }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadProduction();
  }, [loadProduction]);

  /* ==========================================================
     CALCULATE STAGES
  ========================================================== */

  const stages =
    useMemo<ProductionStage[]>(() => {
      const total =
        tasks.length;

      const inProgress =
        tasks.filter((task) =>
          isInProgress(
            task.status,
          ),
        ).length;

      const internalReview =
        tasks.filter((task) =>
          isInternalReview(
            task.status,
          ),
        ).length;

      const clientReview =
        tasks.filter((task) =>
          isClientReview(
            task.status,
          ),
        ).length;

      const completed =
        tasks.filter((task) =>
          isCompleted(
            task.status,
          ),
        ).length;

      return [
        {
          label: "In Progress",
          value: inProgress,
          percentage:
            calculatePercentage(
              inProgress,
              total,
            ),
          icon: Timer,
        },
        {
          label: "Internal Review",
          value: internalReview,
          percentage:
            calculatePercentage(
              internalReview,
              total,
            ),
          icon: Eye,
        },
        {
          label: "Client Review",
          value: clientReview,
          percentage:
            calculatePercentage(
              clientReview,
              total,
            ),
          icon: ClipboardList,
        },
        {
          label: "Completed",
          value: completed,
          percentage:
            calculatePercentage(
              completed,
              total,
            ),
          icon: CheckCircle2,
        },
      ];
    }, [tasks]);

  const totalTasks =
    tasks.length;

  const completedTasks =
    stages.find(
      (stage) =>
        stage.label ===
        "Completed",
    )?.value ?? 0;

  const activeTasks =
    stages
      .filter(
        (stage) =>
          stage.label !==
          "Completed",
      )
      .reduce(
        (total, stage) =>
          total + stage.value,
        0,
      );

  const completionPercentage =
    calculatePercentage(
      completedTasks,
      totalTasks,
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-950">
            Today&apos;s Production
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current task distribution
            across today&apos;s production.
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <Timer
            size={18}
            className="text-slate-700"
          />
        </div>
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      {!loading && !error && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Planned Today
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-950">
              {totalTasks}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Active
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-950">
              {activeTasks}
            </p>
          </div>

          <div className="col-span-2 rounded-xl bg-slate-50 p-3 sm:col-span-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Completion
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-950">
              {completionPercentage}%
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="mt-7 space-y-5">
          {[
            1,
            2,
            3,
            4,
          ].map((item) => (
            <div
              key={item}
              className="animate-pulse"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="h-4 w-28 rounded bg-slate-100" />

                <div className="h-4 w-6 rounded bg-slate-100" />
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/2 rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {!loading && error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

            <div>
              <p className="text-sm font-semibold text-red-700">
                Unable to load production
              </p>

              <p className="mt-1 text-xs leading-5 text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadProduction()
                }
                className="mt-3 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          STAGES
      ====================================================== */}

      {!loading &&
        !error && (
          <div className="mt-7 space-y-5">
            {stages.map(
              (stage) => {
                const Icon =
                  stage.icon;

                return (
                  <div
                    key={
                      stage.label
                    }
                  >
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon
                          className="h-4 w-4 shrink-0 text-slate-400"
                          strokeWidth={
                            1.8
                          }
                        />

                        <span className="truncate font-medium text-slate-700">
                          {
                            stage.label
                          }
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">
                          {
                            stage.percentage
                          }
                          %
                        </span>

                        <span className="font-semibold text-slate-950">
                          {
                            stage.value
                          }
                        </span>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all duration-500"
                        style={{
                          width: `${stage.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              },
            )}

            {/* ----------------------------------------------
                EMPTY STATE
            ---------------------------------------------- */}

            {totalTasks ===
              0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                <ClipboardList className="mx-auto h-7 w-7 text-slate-300" />

                <p className="mt-2 text-sm font-medium text-slate-600">
                  No tasks planned for today
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Tasks with today&apos;s
                  planned date will appear
                  here.
                </p>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

export default ProductionOverview;