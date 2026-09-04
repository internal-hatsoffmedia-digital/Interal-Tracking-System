import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Edit3,
  FileText,
  IndianRupee,
  MoreHorizontal,
  UserRound,
  XCircle,
} from "lucide-react";

import type { ProjectWithRelations } from "../../types/project";


interface ProjectTableProps {
  projects: ProjectWithRelations[];
  loading?: boolean;

  onEdit: (
    project: ProjectWithRelations,
  ) => void;

  onToggleStatus: (
    project: ProjectWithRelations,
  ) => void;
}


/* =========================================================
   FORMAT HELPERS
========================================================= */

function formatOption(
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


function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "No deadline";
  }

  const date = new Date(
    `${value}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return value;
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


function getProgress(
  project: ProjectWithRelations,
): number {
  const total =
    Number(
      project.total_assets_required ?? 0,
    );

  const completed =
    Number(
      project.completed_assets ?? 0,
    );

  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (completed / total) * 100,
      ),
    ),
  );
}


function isOverdue(
  project: ProjectWithRelations,
): boolean {
  if (
    !project.target_deadline ||
    !project.is_active
  ) {
    return false;
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  const deadline =
    new Date(
      `${project.target_deadline}T00:00:00`,
    );

  return deadline < today;
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  value,
}: {
  value: string;
}) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
      {formatOption(value)}
    </span>
  );
}


/* =========================================================
   HEALTH BADGE
========================================================= */

function HealthBadge({
  value,
}: {
  value: string;
}) {
  const normalized =
    value.toLowerCase();

  const isGood =
    normalized.includes(
      "track",
    ) ||
    normalized.includes(
      "complete",
    );

  const isRisk =
    normalized.includes(
      "risk",
    );

  const isDelayed =
    normalized.includes(
      "delay",
    ) ||
    normalized.includes(
      "block",
    );


  if (isGood) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">

        <CheckCircle2
          size={12}
          strokeWidth={2}
        />

        {formatOption(value)}

      </span>
    );
  }


  if (isRisk) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">

        <CircleAlert
          size={12}
          strokeWidth={2}
        />

        {formatOption(value)}

      </span>
    );
  }


  if (isDelayed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">

        <XCircle
          size={12}
          strokeWidth={2}
        />

        {formatOption(value)}

      </span>
    );
  }


  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">

      <CircleAlert
        size={12}
        strokeWidth={2}
      />

      {formatOption(value)}

    </span>
  );
}


/* =========================================================
   PAYMENT BADGE
========================================================= */

function PaymentBadge({
  value,
}: {
  value: string;
}) {
  const normalized =
    value.toLowerCase();

  const received =
    normalized.includes(
      "received",
    );

  const overdue =
    normalized.includes(
      "overdue",
    );

  if (received) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">

        <CheckCircle2
          size={12}
          strokeWidth={2}
        />

        {formatOption(value)}

      </span>
    );
  }


  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">

        <IndianRupee
          size={12}
          strokeWidth={2}
        />

        {formatOption(value)}

      </span>
    );
  }


  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">

      <Clock3
        size={12}
        strokeWidth={2}
      />

      {formatOption(value)}

    </span>
  );
}


/* =========================================================
   PROGRESS
========================================================= */

function ProjectProgress({
  project,
}: {
  project: ProjectWithRelations;
}) {
  const progress =
    getProgress(project);

  const total =
    Number(
      project.total_assets_required ?? 0,
    );

  const completed =
    Number(
      project.completed_assets ?? 0,
    );

  return (
    <div className="min-w-[150px]">

      <div className="mb-1.5 flex items-center justify-between gap-2">

        <span className="text-[11px] font-medium text-slate-500">
          {completed} / {total}
        </span>

        <span className="text-[11px] font-semibold text-slate-700">
          {progress}%
        </span>

      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

    </div>
  );
}


/* =========================================================
   LOADING
========================================================= */

function LoadingRows() {
  return (
    <>
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <tr
          key={index}
          className="animate-pulse border-b border-slate-100 last:border-0"
        >

          <td className="px-4 py-4">
            <div className="h-4 w-40 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
          </td>

          <td className="px-4 py-4">
            <div className="h-4 w-28 rounded bg-slate-100" />
          </td>

          <td className="px-4 py-4">
            <div className="h-6 w-28 rounded-full bg-slate-100" />
          </td>

          <td className="px-4 py-4">
            <div className="h-6 w-24 rounded-full bg-slate-100" />
          </td>

          <td className="px-4 py-4">
            <div className="h-4 w-32 rounded bg-slate-100" />
          </td>

          <td className="px-4 py-4">
            <div className="h-6 w-24 rounded-full bg-slate-100" />
          </td>

          <td className="px-4 py-4">
            <div className="h-8 w-20 rounded-lg bg-slate-100" />
          </td>

        </tr>
      ))}
    </>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

        <FileText
          size={22}
          strokeWidth={1.7}
        />

      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        No projects found
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        Projects matching your current filters
        will appear here.
      </p>

    </div>
  );
}


/* =========================================================
   DESKTOP TABLE
========================================================= */

function DesktopTable({
  projects,
  loading,
  onEdit,
  onToggleStatus,
}: ProjectTableProps) {
  return (
    <div className="hidden lg:block">

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1250px] border-collapse">

          <thead>

            <tr className="border-b border-slate-200 bg-slate-50/80">

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Project
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Client
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Progress
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Health
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Lead Artist
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Deadline
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Payment
              </th>

              <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Actions
              </th>

            </tr>

          </thead>


          <tbody>

            {loading ? (
              <LoadingRows />
            ) : projects.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-0"
                >
                  <EmptyState />
                </td>
              </tr>
            ) : (
              projects.map(
                (project) => {
                  const overdue =
                    isOverdue(
                      project,
                    );

                  return (
                    <tr
                      key={project.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-0"
                    >

                      {/* PROJECT */}

                      <td className="px-4 py-4">

                        <div className="max-w-[260px]">

                          <p className="truncate text-sm font-semibold text-slate-900">
                            {project.name}
                          </p>

                          {project.series_title && (
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {project.series_title}
                            </p>
                          )}

                          <div className="mt-2">
                            <StatusBadge
                              value={
                                project.status
                              }
                            />
                          </div>

                        </div>

                      </td>


                      {/* CLIENT */}

                      <td className="px-4 py-4">

                        <div className="max-w-[180px]">

                          <p className="truncate text-sm font-medium text-slate-700">
                            {project.client
                              ?.name ??
                              "—"}
                          </p>

                          {project.client
                            ?.short_name && (
                            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">
                              {
                                project
                                  .client
                                  .short_name
                              }
                            </p>
                          )}

                        </div>

                      </td>


                      {/* PROGRESS */}

                      <td className="px-4 py-4">

                        <ProjectProgress
                          project={
                            project
                          }
                        />

                      </td>


                      {/* HEALTH */}

                      <td className="px-4 py-4">

                        <HealthBadge
                          value={
                            project.health
                          }
                        />

                      </td>


                      {/* LEAD */}

                      <td className="px-4 py-4">

                        {project
                          .lead_employee ? (
                          <div className="flex items-center gap-2.5">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">

                              <UserRound
                                size={14}
                                strokeWidth={1.8}
                              />

                            </div>

                            <div className="min-w-0">

                              <p className="max-w-[150px] truncate text-xs font-medium text-slate-700">
                                {
                                  project
                                    .lead_employee
                                    .full_name
                                }
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {
                                  project
                                    .lead_employee
                                    .employee_code
                                }
                              </p>

                            </div>

                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Not assigned
                          </span>
                        )}

                      </td>


                      {/* DEADLINE */}

                      <td className="px-4 py-4">

                        <div
                          className={
                            overdue
                              ? "text-red-600"
                              : "text-slate-600"
                          }
                        >

                          <div className="flex items-center gap-1.5">

                            <CalendarDays
                              size={14}
                              strokeWidth={1.8}
                            />

                            <span className="whitespace-nowrap text-xs font-medium">
                              {formatDate(
                                project.target_deadline,
                              )}
                            </span>

                          </div>

                          {overdue && (
                            <p className="mt-1 text-[10px] font-medium">
                              Overdue
                            </p>
                          )}

                        </div>

                      </td>


                      {/* PAYMENT */}

                      <td className="px-4 py-4">

                        <PaymentBadge
                          value={
                            project.invoice_status
                          }
                        />

                      </td>


                      {/* ACTIONS */}

                      <td className="px-4 py-4">

                        <div className="flex items-center justify-end gap-1.5">

                          <button
                            type="button"
                            onClick={() =>
                              onEdit(
                                project,
                              )
                            }
                            title="Edit project"
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                          >

                            <Edit3
                              size={13}
                              strokeWidth={1.8}
                            />

                            Edit

                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              onToggleStatus(
                                project,
                              )
                            }
                            title={
                              project.is_active
                                ? "Deactivate project"
                                : "Activate project"
                            }
                            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition ${
                              project.is_active
                                ? "border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >

                            {project.is_active
                              ? "Deactivate"
                              : "Activate"}

                          </button>


                          <button
                            type="button"
                            disabled
                            title="More actions coming soon"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300"
                          >

                            <MoreHorizontal
                              size={16}
                            />

                          </button>

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

    </div>
  );
}


/* =========================================================
   MOBILE CARDS
========================================================= */

function MobileCards({
  projects,
  loading,
  onEdit,
  onToggleStatus,
}: ProjectTableProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4 lg:hidden">

        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-slate-200 p-4"
          >

            <div className="h-4 w-3/5 rounded bg-slate-100" />

            <div className="mt-2 h-3 w-2/5 rounded bg-slate-100" />

            <div className="mt-5 h-2 w-full rounded bg-slate-100" />

            <div className="mt-4 h-8 w-full rounded bg-slate-100" />

          </div>
        ))}

      </div>
    );
  }


  if (projects.length === 0) {
    return (
      <div className="lg:hidden">
        <EmptyState />
      </div>
    );
  }


  return (
    <div className="space-y-3 p-4 lg:hidden">

      {projects.map(
        (project) => {
          const overdue =
            isOverdue(
              project,
            );

          const progress =
            getProgress(
              project,
            );

          return (
            <div
              key={project.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >

              {/* HEADER */}

              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {project.name}
                  </h3>

                  {project.series_title && (
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {project.series_title}
                    </p>
                  )}

                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {project.client
                      ?.name ??
                      "No client"}
                  </p>

                </div>

                <HealthBadge
                  value={
                    project.health
                  }
                />

              </div>


              {/* PROGRESS */}

              <div className="mt-4">

                <div className="mb-1.5 flex items-center justify-between">

                  <span className="text-[11px] text-slate-400">
                    Asset Progress
                  </span>

                  <span className="text-[11px] font-semibold text-slate-700">
                    {progress}%
                  </span>

                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-slate-900"
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

                <p className="mt-1.5 text-[10px] text-slate-400">
                  {project.completed_assets} completed
                  {" · "}
                  {project.pending_assets} pending
                </p>

              </div>


              {/* META */}

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">

                <div>

                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Lead Artist
                  </p>

                  <p className="mt-1 truncate text-xs font-medium text-slate-700">
                    {project
                      .lead_employee
                      ?.full_name ??
                      "Not assigned"}
                  </p>

                </div>


                <div>

                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Deadline
                  </p>

                  <p
                    className={`mt-1 truncate text-xs font-medium ${
                      overdue
                        ? "text-red-600"
                        : "text-slate-700"
                    }`}
                  >
                    {formatDate(
                      project.target_deadline,
                    )}
                  </p>

                </div>


                <div>

                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <div className="mt-1">
                    <StatusBadge
                      value={
                        project.status
                      }
                    />
                  </div>

                </div>


                <div>

                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Payment
                  </p>

                  <div className="mt-1">
                    <PaymentBadge
                      value={
                        project.invoice_status
                      }
                    />
                  </div>

                </div>

              </div>


              {/* ACTIONS */}

              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    onEdit(project)
                  }
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >

                  <Edit3
                    size={14}
                    strokeWidth={1.8}
                  />

                  Edit

                </button>


                <button
                  type="button"
                  onClick={() =>
                    onToggleStatus(
                      project,
                    )
                  }
                  className={`flex h-9 flex-1 items-center justify-center rounded-lg text-xs font-medium transition ${
                    project.is_active
                      ? "border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {project.is_active
                    ? "Deactivate"
                    : "Activate"}
                </button>

              </div>

            </div>
          );
        },
      )}

    </div>
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

function ProjectTable({
  projects,
  loading = false,
  onEdit,
  onToggleStatus,
}: ProjectTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <DesktopTable
        projects={projects}
        loading={loading}
        onEdit={onEdit}
        onToggleStatus={
          onToggleStatus
        }
      />

      <MobileCards
        projects={projects}
        loading={loading}
        onEdit={onEdit}
        onToggleStatus={
          onToggleStatus
        }
      />

    </div>
  );
}


export default ProjectTable;