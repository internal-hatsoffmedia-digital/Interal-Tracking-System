import {
  AlertTriangle,
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
  health: string | null;
  status: string | null;
  is_active: boolean;
}

interface HealthItem {
  label: string;
  value: number;
  className: string;
  icon: LucideIcon;
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
    is_active:
      typeof row.is_active ===
      "boolean"
        ? row.is_active
        : true,
  };
}

/**
 * Resolve project health.
 *
 * We prefer the explicit `health` field.
 * If it is empty, we use project status
 * as a fallback.
 */
function getProjectHealth(
  project: ProjectRow,
): "on_track" | "at_risk" | "delayed" | "completed" {
  const health =
    normalizeValue(
      project.health,
    );

  const status =
    normalizeValue(
      project.status,
    );

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
    return "completed";
  }

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
    return "delayed";
  }

  /* -----------------------------------------------
     At Risk
  ------------------------------------------------ */

  if (
    ["at_risk"].includes(
      health,
    ) ||
    ["at_risk"].includes(
      status,
    )
  ) {
    return "at_risk";
  }

  /* -----------------------------------------------
     On Track
  ------------------------------------------------ */

  return "on_track";
}

/* ============================================================
   COMPONENT
============================================================ */

function ProjectHealth() {
  const [projects, setProjects] =
    useState<ProjectRow[]>([]);

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

        const {
          data,
          error: projectsError,
        } = await supabase
          .from("projects")
          .select(
            [
              "id",
              "health",
              "status",
              "is_active",
            ].join(", "),
          )
          .eq(
            "is_active",
            true,
          );

        if (projectsError) {
          throw projectsError;
        }

        const rows =
          Array.isArray(data)
            ? data.map(
                mapProject,
              )
            : [];

        setProjects(rows);
      } catch (err) {
        console.error(
          "Failed to load project health:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load project health.",
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
     CALCULATE HEALTH
  ========================================================== */

  const healthItems =
    useMemo<HealthItem[]>(
      () => {
        const onTrack =
          projects.filter(
            (project) =>
              getProjectHealth(
                project,
              ) === "on_track",
          ).length;

        const atRisk =
          projects.filter(
            (project) =>
              getProjectHealth(
                project,
              ) === "at_risk",
          ).length;

        const delayed =
          projects.filter(
            (project) =>
              getProjectHealth(
                project,
              ) === "delayed",
          ).length;

        const completed =
          projects.filter(
            (project) =>
              getProjectHealth(
                project,
              ) === "completed",
          ).length;

        return [
          {
            label: "On Track",
            value: onTrack,
            className:
              "bg-emerald-500",
            icon: CheckCircle2,
          },
          {
            label: "At Risk",
            value: atRisk,
            className:
              "bg-amber-500",
            icon: AlertTriangle,
          },
          {
            label: "Delayed",
            value: delayed,
            className:
              "bg-red-500",
            icon: Clock3,
          },
          {
            label: "Completed",
            value: completed,
            className:
              "bg-slate-500",
            icon: CheckCircle2,
          },
        ];
      },
      [projects],
    );

  const totalActiveProjects =
    projects.filter(
      (project) =>
        project.is_active,
    ).length;

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
            Project Health
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current health across active
            projects.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadProjects()
          }
          disabled={loading}
          aria-label="Refresh project health"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
        </button>
      </div>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="mt-6 space-y-4">
          {[
            1,
            2,
            3,
            4,
          ].map((item) => (
            <div
              key={item}
              className="flex animate-pulse items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />

                <div className="h-4 w-24 rounded bg-slate-100" />
              </div>

              <div className="h-4 w-8 rounded bg-slate-100" />
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

            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-700">
                Unable to load project health
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
      )}

      {/* ======================================================
          HEALTH LIST
      ====================================================== */}

      {!loading &&
        !error && (
          <>
            <div className="mt-6 space-y-4">
              {healthItems.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <HealthRow
                      key={
                        item.label
                      }
                      label={
                        item.label
                      }
                      value={
                        item.value
                      }
                      className={
                        item.className
                      }
                      icon={Icon}
                    />
                  );
                },
              )}
            </div>

            {/* ==================================================
                TOTAL
            ================================================== */}

            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2">
                  <FolderKanban className="h-4 w-4 shrink-0 text-slate-400" />

                  <span className="text-sm font-medium text-slate-600">
                    Total Active Projects
                  </span>
                </div>

                <span className="text-xl font-semibold text-slate-950">
                  {totalActiveProjects}
                </span>
              </div>
            </div>

            {/* ==================================================
                EMPTY STATE
            ================================================== */}

            {totalActiveProjects ===
              0 && (
              <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                <FolderKanban className="mx-auto h-6 w-6 text-slate-300" />

                <p className="mt-2 text-sm font-medium text-slate-600">
                  No active projects
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Active projects will
                  appear here once they
                  are created.
                </p>
              </div>
            )}
          </>
        )}
    </div>
  );
}

/* ============================================================
   HEALTH ROW
============================================================ */

interface HealthRowProps {
  label: string;
  value: number;
  className: string;
  icon: LucideIcon;
}

function HealthRow({
  label,
  value,
  className,
  icon: Icon,
}: HealthRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
        />

        <div className="flex items-center gap-2">
          <Icon
            className="h-4 w-4 text-slate-400"
            strokeWidth={1.8}
          />

          <span className="text-sm text-slate-600">
            {label}
          </span>
        </div>
      </div>

      <span className="text-sm font-semibold text-slate-950">
        {value}
      </span>
    </div>
  );
}

export default ProjectHealth;