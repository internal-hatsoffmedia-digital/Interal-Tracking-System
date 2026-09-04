import {
  CheckCircle2,
  Edit3,
  Mail,
  Power,
  UserRound,
  XCircle,
} from "lucide-react";

import type {
  EmployeeWithTeam,
} from "../../types/employee";


interface EmployeeTableProps {
  employees: EmployeeWithTeam[];
  loading?: boolean;

  onEdit: (
    employee: EmployeeWithTeam,
  ) => void;

  onToggleStatus: (
    employee: EmployeeWithTeam,
  ) => void | Promise<void>;
}


/* =========================================================
   GET INITIALS
========================================================= */

function getInitials(
  name?: string | null,
) {
  if (!name?.trim()) {
    return "U";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0]
      .charAt(0)
      .toUpperCase() +
    parts[parts.length - 1]
      .charAt(0)
      .toUpperCase()
  );
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
  date?: string | null,
) {
  if (!date) {
    return "—";
  }

  const parsedDate =
    new Date(`${date}T00:00:00`);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}


/* =========================================================
   LOADING SKELETON
========================================================= */

function EmployeeTableSkeleton() {
  return (
    <div className="divide-y divide-slate-100">

      {Array.from(
        { length: 5 },
        (_, index) => (
          <div
            key={index}
            className="flex min-w-[900px] items-center gap-4 px-6 py-5"
          >

            {/* Avatar */}

            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-100" />


            {/* Employee */}

            <div className="w-[250px] shrink-0">

              <div className="h-3.5 w-32 animate-pulse rounded bg-slate-100" />

              <div className="mt-2 h-3 w-48 animate-pulse rounded bg-slate-100" />

            </div>


            {/* Code */}

            <div className="h-7 w-16 animate-pulse rounded-lg bg-slate-100" />


            {/* Job */}

            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />


            {/* Team */}

            <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-100" />


            {/* Date */}

            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />


            {/* Status */}

            <div className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />


            {/* Actions */}

            <div className="ml-auto h-8 w-20 animate-pulse rounded-lg bg-slate-100" />

          </div>
        ),
      )}

    </div>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyEmployeeState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <UserRound
          size={22}
          strokeWidth={1.7}
        />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        No employees found
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        No employees match your current
        search or filter.
      </p>

    </div>
  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  isActive,
}: {
  isActive: boolean;
}) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">

        <CheckCircle2
          size={13}
          strokeWidth={1.8}
        />

        Active

      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">

      <XCircle
        size={13}
        strokeWidth={1.8}
      />

      Inactive

    </span>
  );
}


/* =========================================================
   EMPLOYEE TABLE
========================================================= */

function EmployeeTable({
  employees,
  loading = false,
  onEdit,
  onToggleStatus,
}: EmployeeTableProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white">

      {/* ===================================================
          DESKTOP TABLE
      ==================================================== */}

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1100px] border-collapse">

          {/* =================================================
              HEADER
          ================================================== */}

          <thead>

            <tr className="border-b border-slate-200 bg-slate-50/70">

              <th className="w-[280px] px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Employee
              </th>

              <th className="w-[110px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Code
              </th>

              <th className="w-[180px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Job Title
              </th>

              <th className="w-[170px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Team
              </th>

              <th className="w-[160px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Joining Date
              </th>

              <th className="w-[130px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Status
              </th>

              <th className="w-[190px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Actions
              </th>

            </tr>

          </thead>


          {/* =================================================
              BODY
          ================================================== */}

          <tbody className="divide-y divide-slate-100">

            {/* LOADING */}

            {loading && (
              <tr>

                <td
                  colSpan={7}
                  className="p-0"
                >
                  <EmployeeTableSkeleton />
                </td>

              </tr>
            )}


            {/* EMPTY */}

            {!loading &&
              employees.length === 0 && (
                <tr>

                  <td
                    colSpan={7}
                    className="p-0"
                  >
                    <EmptyEmployeeState />
                  </td>

                </tr>
              )}


            {/* EMPLOYEES */}

            {!loading &&
              employees.length > 0 &&
              employees.map(
                (employee) => (
                  <tr
                    key={
                      employee.id
                    }
                    className="transition hover:bg-slate-50/60"
                  >

                    {/* =====================================
                        EMPLOYEE
                    ====================================== */}

                    <td className="px-6 py-5">

                      <div className="flex min-w-0 items-center gap-3">

                        {/* Avatar */}

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          {getInitials(
                            employee.full_name,
                          )}
                        </div>


                        {/* Name + Email */}

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-slate-900">
                            {
                              employee.full_name
                            }
                          </p>

                          <div className="mt-1 flex min-w-0 items-center gap-1.5">

                            <Mail
                              size={12}
                              strokeWidth={1.8}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="truncate text-xs text-slate-400">
                              {
                                employee.email
                              }
                            </span>

                          </div>

                        </div>

                      </div>

                    </td>


                    {/* =====================================
                        CODE
                    ====================================== */}

                    <td className="px-5 py-5">

                      <span className="inline-flex whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {
                          employee.employee_code
                        }
                      </span>

                    </td>


                    {/* =====================================
                        JOB TITLE
                    ====================================== */}

                    <td className="px-5 py-5">

                      <span className="whitespace-nowrap text-sm text-slate-600">
                        {
                          employee.job_title ||
                          "—"
                        }
                      </span>

                    </td>


                    {/* =====================================
                        TEAM
                    ====================================== */}

                    <td className="px-5 py-5">

                      {employee.team ? (
                        <span className="inline-flex whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                          {
                            employee
                              .team
                              .name
                          }
                        </span>
                      ) : (
                        <span className="whitespace-nowrap text-sm text-slate-400">
                          Not assigned
                        </span>
                      )}

                    </td>


                    {/* =====================================
                        JOINING DATE
                    ====================================== */}

                    <td className="px-5 py-5">

                      <span className="whitespace-nowrap text-sm text-slate-500">
                        {formatDate(
                          employee.joining_date,
                        )}
                      </span>

                    </td>


                    {/* =====================================
                        STATUS
                    ====================================== */}

                    <td className="px-5 py-5">

                      <StatusBadge
                        isActive={
                          employee.is_active
                        }
                      />

                    </td>


                    {/* =====================================
                        ACTIONS
                    ====================================== */}

                    <td className="px-5 py-5">

                      <div className="flex items-center gap-2">

                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={() =>
                            onEdit(
                              employee,
                            )
                          }
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                        >

                          <Edit3
                            size={14}
                            strokeWidth={1.8}
                          />

                          Edit

                        </button>


                        {/* ACTIVATE / DEACTIVATE */}

                        <button
                          type="button"
                          onClick={() =>
                            void onToggleStatus(
                              employee,
                            )
                          }
                          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
                            employee.is_active
                              ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                              : "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >

                          <Power
                            size={14}
                            strokeWidth={1.8}
                          />

                          {employee.is_active
                            ? "Deactivate"
                            : "Activate"}

                        </button>

                      </div>

                    </td>

                  </tr>
                ),
              )}

          </tbody>

        </table>

      </div>


      {/* ===================================================
          MOBILE EMPLOYEE CARDS
      ==================================================== */}

      <div className="divide-y divide-slate-100 md:hidden">

        {loading ? (
          <EmployeeTableSkeleton />
        ) : employees.length === 0 ? (
          <EmptyEmployeeState />
        ) : (
          employees.map(
            (employee) => (
              <div
                key={
                  employee.id
                }
                className="p-4"
              >

                {/* =========================================
                    HEADER
                ========================================== */}

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {getInitials(
                      employee.full_name,
                    )}
                  </div>


                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-semibold text-slate-900">
                      {
                        employee.full_name
                      }
                    </p>

                    <div className="mt-1 flex min-w-0 items-center gap-1.5">

                      <Mail
                        size={12}
                        strokeWidth={1.8}
                        className="shrink-0 text-slate-400"
                      />

                      <span className="truncate text-xs text-slate-400">
                        {
                          employee.email
                        }
                      </span>

                    </div>

                  </div>

                </div>


                {/* =========================================
                    DETAILS
                ========================================== */}

                <div className="mt-4 grid grid-cols-2 gap-3">

                  {/* Code */}

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Employee Code
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-700">
                      {
                        employee.employee_code
                      }
                    </p>

                  </div>


                  {/* Status */}

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Status
                    </p>

                    <div className="mt-1">
                      <StatusBadge
                        isActive={
                          employee.is_active
                        }
                      />
                    </div>

                  </div>


                  {/* Job Title */}

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Job Title
                    </p>

                    <p className="mt-1 truncate text-xs font-medium text-slate-700">
                      {
                        employee.job_title ||
                        "Not specified"
                      }
                    </p>

                  </div>


                  {/* Team */}

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Team
                    </p>

                    <p className="mt-1 truncate text-xs font-medium text-slate-700">
                      {
                        employee
                          .team
                          ?.name ||
                        "Not assigned"
                      }
                    </p>

                  </div>


                  {/* Joining Date */}

                  <div className="col-span-2 rounded-xl bg-slate-50 p-3">

                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Joining Date
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-700">
                      {formatDate(
                        employee.joining_date,
                      )}
                    </p>

                  </div>

                </div>


                {/* =========================================
                    MOBILE ACTIONS
                ========================================== */}

                <div className="mt-4 flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      onEdit(
                        employee,
                      )
                    }
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                  >

                    <Edit3
                      size={14}
                    />

                    Edit Employee

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      void onToggleStatus(
                        employee,
                      )
                    }
                    className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-xs font-medium transition ${
                      employee.is_active
                        ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                        : "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
                  >

                    <Power
                      size={14}
                    />

                    {employee.is_active
                      ? "Deactivate"
                      : "Activate"}

                  </button>

                </div>

              </div>
            ),
          )
        )}

      </div>

    </div>
  );
}

export default EmployeeTable;