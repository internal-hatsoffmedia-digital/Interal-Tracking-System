import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

/* ============================================================
   TYPES
============================================================ */

interface ProjectRow {
  id: string;
  client_id: string | null;
  name: string;
  series_title: string | null;
  total_assets_required: number | null;
  completed_assets: number | null;
  pending_assets: number | null;
  status: string | null;
  health: string | null;
  target_deadline: string | null;
  is_active: boolean;
}

interface ClientRow {
  id: string;
  name: string;
  short_name: string | null;
}

interface DashboardProject {
  id: string;
  name: string;
  client: string;
  progress: number;
  status: string;
  statusType: "green" | "orange" | "red" | "slate";
  deadline: string | null;
}

/* ============================================================
   HELPERS
============================================================ */

function normalizeValue(
  value: string | null | undefined,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Convert database health/status into
 * a dashboard-friendly display value.
 */
function getHealthInfo(
  project: ProjectRow,
): {
  label: string;
  type: DashboardProject["statusType"];
  icon: LucideIcon;
} {
  const health =
    normalizeValue(
      project.health,
    );

  const status =
    normalizeValue(
      project.status,
    );

  /* -----------------------------------------------
     Delayed
  ------------------------------------------------ */

  if (
    [
      "delayed",
      "delayed_blocked",
      "blocked",
    ].includes(health) ||
    [
      "delayed",
      "delayed_blocked",
      "blocked",
    ].includes(status)
  ) {
    return {
      label: "Delayed",
      type: "red",
      icon: AlertTriangle,
    };
  }

  /* -----------------------------------------------
     At Risk
  ------------------------------------------------ */

  if (
    health === "at_risk" ||
    status === "at_risk"
  ) {
    return {
      label: "At Risk",
      type: "orange",
      icon: Clock3,
    };
  }

  /* -----------------------------------------------
     Completed
  ------------------------------------------------ */

  if (
    [
      "completed",
      "completed_and_closed",
      "closed",
    ].includes(status)
  ) {
    return {
      label: "Completed",
      type: "slate",
      icon: CheckCircle2,
    };
  }

  /* -----------------------------------------------
     On Track
  ------------------------------------------------ */

  return {
    label: "On Track",
    type: "green",
    icon: CheckCircle2,
  };
}

/**
 * Calculate project progress from assets.
 */
function calculateProgress(
  project: ProjectRow,
): number {
  const total =
    Number(
      project.total_assets_required ??
        0,
    );

  const completed =
    Number(
      project.completed_assets ??
        0,
    );

  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (completed / total) *
          100,
      ),
    ),
  );
}

/**
 * Format a deadline for dashboard display.
 */
function formatDeadline(
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
    return "No deadline";
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

/**
 * Determine whether deadline has passed.
 */
function isOverdue(
  value: string | null,
): boolean {
  if (!value) {
    return false;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return false;
  }

  return (
    date.getTime() <
    Date.now()
  );
}

/**
 * Safely map project response.
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
    client_id:
      typeof row.client_id ===
      "string"
        ? row.client_id
        : null,
    name: String(
      row.name ?? "Untitled Project",
    ),
    series_title:
      typeof row.series_title ===
      "string"
        ? row.series_title
        : null,
    total_assets_required:
      typeof row.total_assets_required ===
      "number"
        ? row.total_assets_required
        : Number(
            row.total_assets_required ??
              0,
          ),
    completed_assets:
      typeof row.completed_assets ===
      "number"
        ? row.completed_assets
        : Number(
            row.completed_assets ??
              0,
          ),
    pending_assets:
      typeof row.pending_assets ===
      "number"
        ? row.pending_assets
        : Number(
            row.pending_assets ??
              0,
          ),
    status:
      typeof row.status === "string"
        ? row.status
        : null,
    health:
      typeof row.health === "string"
        ? row.health
        : null,
    target_deadline:
      typeof row.target_deadline ===
      "string"
        ? row.target_deadline
        : null,
    is_active:
      typeof row.is_active ===
      "boolean"
        ? row.is_active
        : true,
  };
}

/**
 * Safely map client response.
 */
function mapClient(
  value: unknown,
): ClientRow {
  const row =
    value as Record<
      string,
      unknown
    >;

  return {
    id: String(
      row.id ?? "",
    ),
    name: String(
      row.name ?? "Unknown Client",
    ),
    short_name:
      typeof row.short_name ===
      "string"
        ? row.short_name
        : null,
  };
}

/* ============================================================
   STATUS STYLES
============================================================ */

function statusClasses(
  type: DashboardProject["statusType"],
): string {
  if (type === "green") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
  }

  if (type === "orange") {
    return "bg-amber-50 text-amber-700 ring-amber-600/10";
  }

  if (type === "red") {
    return "bg-red-50 text-red-700 ring-red-600/10";
  }

  return "bg-slate-100 text-slate-700 ring-slate-500/10";
}

/* ============================================================
   COMPONENT
============================================================ */

function ActiveProjects() {
  const [projects, setProjects] =
    useState<DashboardProject[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD PROJECTS
  ========================================================== */

  const loadProjects =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        /* -----------------------------------------------
           Load projects + clients separately.
           This avoids PostgREST relation
           inference issues.
        ------------------------------------------------ */

        const [
          projectsResult,
          clientsResult,
        ] = await Promise.all([
          supabase
            .from("projects")
            .select(
              [
                "id",
                "client_id",
                "name",
                "series_title",
                "total_assets_required",
                "completed_assets",
                "pending_assets",
                "status",
                "health",
                "target_deadline",
                "is_active",
              ].join(", "),
            )
            .eq(
              "is_active",
              true,
            )
            .order(
              "target_deadline",
              {
                ascending: true,
                nullsFirst: false,
              },
            )
            .limit(8),

          supabase
            .from("clients")
            .select(
              [
                "id",
                "name",
                "short_name",
              ].join(", "),
            )
            .eq(
              "is_active",
              true,
            ),
        ]);

        if (projectsResult.error) {
          throw projectsResult.error;
        }

        if (clientsResult.error) {
          throw clientsResult.error;
        }

        const projectRows =
          Array.isArray(
            projectsResult.data,
          )
            ? projectsResult.data.map(
                mapProject,
              )
            : [];

        const clientRows =
          Array.isArray(
            clientsResult.data,
          )
            ? clientsResult.data.map(
                mapClient,
              )
            : [];

        const clientMap =
          new Map(
            clientRows.map(
              (client) => [
                client.id,
                client,
              ],
            ),
          );

        const dashboardProjects =
          projectRows.map(
            (project) => {
              const client =
                project.client_id
                  ? clientMap.get(
                      project.client_id,
                    )
                  : null;

              const healthInfo =
                getHealthInfo(
                  project,
                );

              return {
                id: project.id,
                name: project.name,
                client:
                  client?.short_name ||
                  client?.name ||
                  "No client",
                progress:
                  calculateProgress(
                    project,
                  ),
                status:
                  healthInfo.label,
                statusType:
                  healthInfo.type,
                deadline:
                  project.target_deadline,
              };
            },
          );

        setProjects(
          dashboardProjects,
        );
      } catch (err) {
        console.error(
          "Failed to load active projects:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load active projects.",
        );

        setProjects([]);
      } finally {
        setLoading(false);
      }
    }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  /* ==========================================================
     PROJECT SUMMARY
  ========================================================== */

  const projectSummary =
    useMemo(() => {
      const total =
        projects.length;

      const atRisk =
        projects.filter(
          (project) =>
            project.statusType ===
            "orange",
        ).length;

      const delayed =
        projects.filter(
          (project) =>
            project.statusType ===
            "red",
        ).length;

      return {
        total,
        atRisk,
        delayed,
      };
    }, [projects]);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 sm:flex">
            <FolderKanban
              size={18}
              className="text-slate-700"
            />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-slate-950">
              Active Projects
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Projects currently in
              production.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!loading &&
            !error &&
            projectSummary.total >
              0 && (
              <span className="hidden text-xs font-medium text-slate-400 sm:block">
                {projectSummary.total}{" "}
                active
              </span>
            )}

          <button
            type="button"
            onClick={() =>
              void loadProjects()
            }
            disabled={loading}
            aria-label="Refresh active projects"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {!loading && error && (
        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-700">
                  Unable to load projects
                </p>

                <p className="mt-1 break-words text-xs leading-5 text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void loadProjects()
                  }
                  className="mt-3 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-800"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="divide-y divide-slate-100">
          {[
            1,
            2,
            3,
            4,
          ].map((item) => (
            <div
              key={item}
              className="animate-pulse px-5 py-5 sm:px-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-slate-100" />

                  <div className="h-3 w-24 rounded bg-slate-100" />
                </div>

                <div className="h-6 w-20 rounded-full bg-slate-100" />
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="h-1.5 flex-1 rounded-full bg-slate-100" />

                <div className="h-3 w-8 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================
          PROJECT LIST
      ====================================================== */}

      {!loading &&
        !error &&
        projects.length > 0 && (
          <div className="divide-y divide-slate-100">
            {projects.map(
              (project) => {
                const overdue =
                  isOverdue(
                    project.deadline,
                  ) &&
                  project.statusType !==
                    "green";

                return (
                  <div
                    key={
                      project.id
                    }
                    className="px-5 py-5 transition hover:bg-slate-50 sm:px-6"
                  >
                    {/* --------------------------------------
                        PROJECT HEADER
                    --------------------------------------- */}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {
                            project.name
                          }
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {
                            project.client
                          }
                        </p>
                      </div>

                      <span
                        className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses(
                          project.statusType,
                        )}`}
                      >
                        {
                          project.status
                        }
                      </span>
                    </div>

                    {/* --------------------------------------
                        PROGRESS
                    --------------------------------------- */}

                    <div className="mt-4 flex items-center gap-4">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900 transition-all duration-500"
                          style={{
                            width: `${project.progress}%`,
                          }}
                        />
                      </div>

                      <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-600">
                        {
                          project.progress
                        }
                        %
                      </span>
                    </div>

                    {/* --------------------------------------
                        DEADLINE
                    --------------------------------------- */}

                    {project.deadline && (
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span
                          className={`text-xs ${
                            overdue
                              ? "font-semibold text-red-600"
                              : "text-slate-400"
                          }`}
                        >
                          {overdue
                            ? "Overdue · "
                            : "Deadline · "}

                          {formatDeadline(
                            project.deadline,
                          )}
                        </span>

                        {project.progress ===
                          100 && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />

                            Complete
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {!loading &&
        !error &&
        projects.length ===
          0 && (
          <div className="p-8 text-center sm:p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <FolderKanban className="h-6 w-6 text-slate-400" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              No active projects
            </p>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Active projects will
              appear here once projects
              are created and marked as
              active.
            </p>
          </div>
        )}

      {/* ======================================================
          FOOTER
      ====================================================== */}

      {!loading &&
        !error &&
        projects.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {projectSummary.atRisk >
                  0 && (
                  <span className="inline-flex items-center gap-1.5 text-amber-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                    {projectSummary.atRisk}{" "}
                    at risk
                  </span>
                )}

                {projectSummary.delayed >
                  0 && (
                  <span className="inline-flex items-center gap-1.5 text-red-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

                    {projectSummary.delayed}{" "}
                    delayed
                  </span>
                )}

                {projectSummary.atRisk ===
                  0 &&
                  projectSummary.delayed ===
                    0 && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />

                      All projects on track
                    </span>
                  )}
              </div>

              <button
                type="button"
                onClick={() =>
                  window.location.assign(
                    "/projects",
                  )
                }
                className="inline-flex items-center gap-1 self-start text-xs font-semibold text-slate-600 transition hover:text-slate-950 sm:self-auto"
              >
                View all projects

                <ArrowUpRight
                  size={14}
                />
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

export default ActiveProjects;