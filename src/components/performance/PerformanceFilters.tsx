import type { ChangeEvent } from "react";
import {
  CalendarDays,
  Search,
  Users,
  X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

export type PerformanceStatusFilter =
  | "all"
  | "green"
  | "orange"
  | "red";

export type PerformancePeriod =
  | "today"
  | "this_week"
  | "this_month"
  | "custom";

export interface PerformanceFilterEmployee {
  id: string;
  full_name: string | null;
  employee_code: string | null;
}

export interface PerformanceFiltersValue {
  search: string;
  employeeId: string;
  performance: PerformanceStatusFilter;
  period: PerformancePeriod;
  startDate: string;
  endDate: string;
}

interface PerformanceFiltersProps {
  value: PerformanceFiltersValue;
  employees: PerformanceFilterEmployee[];
  employeesLoading?: boolean;
  onChange: (
    value: PerformanceFiltersValue,
  ) => void;
  onReset: () => void;
}

/* ============================================================
   DATE HELPERS
============================================================ */

function formatDate(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRange(
  period: PerformancePeriod,
) {
  const now = new Date();

  const start = new Date(now);
  const end = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(
      23,
      59,
      59,
      999,
    );
  }

  if (period === "this_week") {
    const day = start.getDay();

    /*
     * Monday = 1
     * Sunday = 0
     */

    const difference =
      day === 0 ? 6 : day - 1;

    start.setDate(
      start.getDate() - difference,
    );

    start.setHours(0, 0, 0, 0);

    end.setDate(
      start.getDate() + 6,
    );

    end.setHours(
      23,
      59,
      59,
      999,
    );
  }

  if (period === "this_month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    end.setMonth(
      end.getMonth() + 1,
      0,
    );

    end.setHours(
      23,
      59,
      59,
      999,
    );
  }

  if (period === "custom") {
    return {
      startDate: "",
      endDate: "",
    };
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PerformanceFilters({
  value,
  employees,
  employeesLoading = false,
  onChange,
  onReset,
}: PerformanceFiltersProps) {
  /*
   * "all" is the default performance filter.
   *
   * This must stay consistent with:
   *
   * PerformanceStatusFilter
   * Performance.tsx
   * <option value="all">
   */

  const hasActiveFilters =
    value.search !== "" ||
    value.employeeId !== "" ||
    value.performance !== "all" ||
    value.period !== "this_month" ||
    value.startDate !== "" ||
    value.endDate !== "";

  /* ==========================================================
     SEARCH
  ========================================================== */

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onChange({
      ...value,
      search: event.target.value,
    });
  };

  /* ==========================================================
     EMPLOYEE
  ========================================================== */

  const handleEmployeeChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    onChange({
      ...value,
      employeeId:
        event.target.value,
    });
  };

  /* ==========================================================
     PERFORMANCE
  ========================================================== */

  const handlePerformanceChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const performance =
      event.target
        .value as PerformanceStatusFilter;

    onChange({
      ...value,
      performance,
    });
  };

  /* ==========================================================
     PERIOD
  ========================================================== */

  const handlePeriodChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const period =
      event.target
        .value as PerformancePeriod;

    const range =
      getDateRange(period);

    onChange({
      ...value,

      period,

      startDate:
        period === "custom"
          ? value.startDate
          : range.startDate,

      endDate:
        period === "custom"
          ? value.endDate
          : range.endDate,
    });
  };

  /* ==========================================================
     START DATE
  ========================================================== */

  const handleStartDateChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const startDate =
      event.target.value;

    onChange({
      ...value,
      period: "custom",
      startDate,
    });
  };

  /* ==========================================================
     END DATE
  ========================================================== */

  const handleEndDateChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const endDate =
      event.target.value;

    onChange({
      ...value,
      period: "custom",
      endDate,
    });
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Performance Filters
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Filter employees by performance,
            employee, and reporting period.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-slate-600 transition hover:text-slate-900 sm:self-auto"
          >
            <X className="h-3.5 w-3.5" />

            Reset Filters
          </button>
        )}
      </div>

      {/* ======================================================
          FILTER GRID
      ====================================================== */}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {/* ====================================================
            SEARCH
        ==================================================== */}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={value.search}
            onChange={
              handleSearchChange
            }
            placeholder="Search employee..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        {/* ====================================================
            EMPLOYEE
        ==================================================== */}

        <div className="relative">
          <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <select
            value={value.employeeId}
            onChange={
              handleEmployeeChange
            }
            disabled={
              employeesLoading
            }
            className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          >
            <option value="">
              {employeesLoading
                ? "Loading employees..."
                : "All Employees"}
            </option>

            {employees.map(
              (employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.full_name ||
                    "Unnamed Employee"}

                  {employee.employee_code
                    ? ` (${employee.employee_code})`
                    : ""}
                </option>
              ),
            )}
          </select>
        </div>

        {/* ====================================================
            PERFORMANCE
        ==================================================== */}

        <select
          value={value.performance}
          onChange={
            handlePerformanceChange
          }
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        >
          <option value="all">
            All Performance
          </option>

          <option value="green">
            GREEN
          </option>

          <option value="orange">
            ORANGE
          </option>

          <option value="red">
            RED
          </option>
        </select>

        {/* ====================================================
            PERIOD
        ==================================================== */}

        <select
          value={value.period}
          onChange={
            handlePeriodChange
          }
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        >
          <option value="today">
            Today
          </option>

          <option value="this_week">
            This Week
          </option>

          <option value="this_month">
            This Month
          </option>

          <option value="custom">
            Custom Range
          </option>
        </select>

        {/* ====================================================
            DATE RANGE
        ==================================================== */}

        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
          <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />

          {value.period === "custom" ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {/* Start Date */}

              <input
                type="date"
                value={
                  value.startDate
                }
                onChange={
                  handleStartDateChange
                }
                max={
                  value.endDate ||
                  undefined
                }
                className="min-w-0 w-full border-0 bg-transparent p-0 text-xs text-slate-700 outline-none"
                aria-label="Performance start date"
              />

              <span className="shrink-0 text-slate-300">
                →
              </span>

              {/* End Date */}

              <input
                type="date"
                value={
                  value.endDate
                }
                onChange={
                  handleEndDateChange
                }
                min={
                  value.startDate ||
                  undefined
                }
                className="min-w-0 w-full border-0 bg-transparent p-0 text-xs text-slate-700 outline-none"
                aria-label="Performance end date"
              />
            </div>
          ) : (
            <span className="truncate text-xs font-medium text-slate-600">
              {value.startDate &&
              value.endDate
                ? `${value.startDate} → ${value.endDate}`
                : "Current period"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}