import {
  Clock3,
  Edit3,
  FileClock,
  Plus,
  RefreshCw,
  Search,
  Timer,
  TrendingUp,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import TimesheetForm from "../../components/timesheet/TimesheetForm";

import {
  createTimesheet,
  getTimesheets,
  updateTimesheet,
} from "../../services/timesheet/timesheet.service";

import { getActiveEmployees } from "../../services/employees/employees.service";

import { getTasks } from "../../services/tasks/tasks.service";

import type { EmployeeWithTeam } from "../../types/employee";

import type {
  CreateTimesheetInput,
  TimesheetWithRelations,
  UpdateTimesheetInput,
} from "../../types/timesheet";

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

/* =========================================================
   DATE
========================================================= */

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

/* =========================================================
   PERFORMANCE
========================================================= */

function getPerformanceClasses(
  performance: string,
): string {
  switch (
    String(
      performance,
    ).toLowerCase()
  ) {
    case "green":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "orange":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "red":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

/* =========================================================
   TIMESHEET PAGE
========================================================= */

function Timesheet() {
  /* =======================================================
     DATA
  ======================================================== */

  const [timesheets, setTimesheets] =
    useState<
      TimesheetWithRelations[]
    >([]);

  const [employees, setEmployees] =
    useState<EmployeeWithTeam[]>(
      [],
    );

  const [tasks, setTasks] =
    useState<TaskWithRelations[]>(
      [],
    );

  /* =======================================================
     UI
  ======================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [formLoading, setFormLoading] =
    useState(false);

  const [formOpen, setFormOpen] =
    useState(false);

  const [
    editingTimesheet,
    setEditingTimesheet,
  ] =
    useState<TimesheetWithRelations | null>(
      null,
    );

  const [error, setError] =
    useState("");

  /* =======================================================
     FILTERS
  ======================================================== */

  const [search, setSearch] =
    useState("");

  const [performanceFilter, setPerformanceFilter] =
    useState("");

  const [employeeFilter, setEmployeeFilter] =
    useState("");

  const [dateFilter, setDateFilter] =
    useState("");

  /* =======================================================
     LOAD DATA
  ======================================================== */

  const loadData = useCallback(
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

        const [
          timesheetsResult,
          employeesResult,
          tasksResult,
        ] =
          await Promise.allSettled([
            getTimesheets(),
            getActiveEmployees(),
            getTasks(),
          ]);

        /* -----------------------------------------------
           TIMESHEETS
        ------------------------------------------------ */

        if (
          timesheetsResult.status ===
          "fulfilled"
        ) {
          setTimesheets(
            timesheetsResult.value,
          );
        } else {
          throw timesheetsResult.reason;
        }

        /* -----------------------------------------------
           EMPLOYEES
        ------------------------------------------------ */

        if (
          employeesResult.status ===
          "fulfilled"
        ) {
          setEmployees(
            employeesResult.value,
          );
        } else {
          console.error(
            "Unable to load employees:",
            employeesResult.reason,
          );
        }

        /* -----------------------------------------------
           TASKS
        ------------------------------------------------ */

        if (
          tasksResult.status ===
          "fulfilled"
        ) {
          setTasks(
            tasksResult.value,
          );
        } else {
          console.error(
            "Unable to load tasks:",
            tasksResult.reason,
          );
        }
      } catch (err) {
        console.error(
          "Unable to load timesheets:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load timesheets.",
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
    void loadData();
  }, [loadData]);

  /* =======================================================
     FILTERED TIMESHEETS
  ======================================================== */

  const filteredTimesheets =
    useMemo(() => {
      const searchTerm =
        search
          .trim()
          .toLowerCase();

      return timesheets.filter(
        (entry) => {
          if (
            searchTerm &&
            !(
              entry.employee
                ?.full_name ??
              ""
            )
              .toLowerCase()
              .includes(
                searchTerm,
              ) &&
            !(
              entry.task
                ?.title ??
              ""
            )
              .toLowerCase()
              .includes(
                searchTerm,
              ) &&
            !(
              entry.client
                ?.name ??
              ""
            )
              .toLowerCase()
              .includes(
                searchTerm,
              ) &&
            !(
              entry.project
                ?.name ??
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
            performanceFilter &&
            String(
              entry.performance,
            ).toLowerCase() !==
              performanceFilter
          ) {
            return false;
          }

          if (
            employeeFilter &&
            entry.employee_id !==
              employeeFilter
          ) {
            return false;
          }

          if (
            dateFilter &&
            entry.work_date !==
              dateFilter
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      timesheets,
      search,
      performanceFilter,
      employeeFilter,
      dateFilter,
    ]);

  /* =======================================================
     STATS
  ======================================================== */

  const stats =
    useMemo(() => {
      let totalHours = 0;
      let greenCount = 0;
      let orangeCount = 0;
      let redCount = 0;

      timesheets.forEach(
        (entry) => {
          totalHours += Number(
            entry.total_hours ??
              0,
          );

          switch (
            String(
              entry.performance,
            ).toLowerCase()
          ) {
            case "green":
              greenCount++;
              break;

            case "orange":
              orangeCount++;
              break;

            case "red":
              redCount++;
              break;
          }
        },
      );

      const averageHours =
        timesheets.length > 0
          ? totalHours /
            timesheets.length
          : 0;

      return {
        totalEntries:
          timesheets.length,

        totalHours,

        averageHours,

        greenCount,

        orangeCount,

        redCount,
      };
    }, [timesheets]);

  /* =======================================================
     TASK OPTIONS
  ======================================================== */

  const taskOptions =
    useMemo(() => {
      return tasks.map(
        (task) => ({
          id: task.id,

          title: task.title,

          category:
            task.category,

          priority:
            task.priority,

          status:
            task.status,

          client_name:
            task.client?.name ??
            null,

          project_name:
            task.project?.name ??
            null,
        }),
      );
    }, [tasks]);

  /* =======================================================
     CREATE
  ======================================================== */

  const handleCreate =
    () => {
      setEditingTimesheet(null);
      setError("");
      setFormOpen(true);
    };

  /* =======================================================
     EDIT
  ======================================================== */

  const handleEdit = (
    timesheet: TimesheetWithRelations,
  ) => {
    setEditingTimesheet(
      timesheet,
    );

    setError("");
    setFormOpen(true);
  };

  /* =======================================================
     CLOSE FORM
  ======================================================== */

  const handleClose =
    () => {
      if (formLoading) {
        return;
      }

      setFormOpen(false);
      setEditingTimesheet(null);
      setError("");
    };

  /* =======================================================
     SAVE
  ======================================================== */

  const handleSubmit =
    async (
      data:
        | CreateTimesheetInput
        | UpdateTimesheetInput,
      employeeId: string,
    ) => {
      try {
        setFormLoading(true);
        setError("");

        /* -----------------------------------------------
           UPDATE
        ------------------------------------------------ */

        if (
          editingTimesheet
        ) {
          const updated =
            await updateTimesheet(
              editingTimesheet.id,
              data as UpdateTimesheetInput,
            );

          setTimesheets(
            (current) =>
              current.map(
                (entry) =>
                  entry.id ===
                  updated.id
                    ? {
                        ...entry,
                        ...updated,
                      }
                    : entry,
              ),
          );

          setFormOpen(false);
          setEditingTimesheet(
            null,
          );

          await loadData(true);

          return;
        }

        /* -----------------------------------------------
           CREATE
        ------------------------------------------------ */

        await createTimesheet(
          data as CreateTimesheetInput,
          employeeId,
        );

        setFormOpen(false);

        setEditingTimesheet(
          null,
        );

        await loadData(true);
      } catch (err) {
        console.error(
          "Unable to save timesheet:",
          err,
        );

        throw err;
      } finally {
        setFormLoading(false);
      }
    };

  /* =======================================================
     CLEAR FILTERS
  ======================================================== */

  const clearFilters =
    () => {
      setSearch("");
      setPerformanceFilter("");
      setEmployeeFilter("");
      setDateFilter("");
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
            PRODUCTION TRACKING
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Timesheet
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track Cut Masters work, production
            hours and performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              void loadData(true)
            }
            disabled={
              loading ||
              refreshing
            }
            className="
              inline-flex
              h-11
              items-center
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

          <button
            type="button"
            onClick={
              handleCreate
            }
            className="
              inline-flex
              h-11
              items-center
              gap-2
              rounded-xl
              bg-slate-950
              px-5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-slate-800
            "
          >
            <Plus
              size={17}
            />

            New Entry
          </button>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">
            Unable to load timesheet
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
          label="Total Entries"
          value={
            stats.totalEntries
          }
          description="Recorded work entries"
          icon={
            <FileClock
              size={20}
            />
          }
        />

        <StatCard
          label="Total Hours"
          value={`${stats.totalHours.toFixed(
            1,
          )}h`}
          description={`${stats.averageHours.toFixed(
            1,
          )}h average per entry`}
          icon={
            <Clock3
              size={20}
            />
          }
        />

        <StatCard
          label="On Track"
          value={
            stats.greenCount
          }
          description="GREEN performance entries"
          icon={
            <TrendingUp
              size={20}
            />
          }
        />

        <StatCard
          label="Needs Attention"
          value={
            stats.orangeCount +
            stats.redCount
          }
          description={`${stats.orangeCount} orange · ${stats.redCount} red`}
          icon={
            <Timer
              size={20}
            />
          }
        />
      </div>

      {/* =================================================
          FILTERS
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
                  event.target
                    .value,
                )
              }
              placeholder="Search task, client, project, artist..."
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
                event.target
                  .value,
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

          {/* EMPLOYEE */}

          <select
            value={
              employeeFilter
            }
            onChange={(event) =>
              setEmployeeFilter(
                event.target
                  .value,
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
              All Artists
            </option>

            {employees.map(
              (employee) => (
                <option
                  key={
                    employee.id
                  }
                  value={
                    employee.id
                  }
                >
                  {
                    employee.full_name
                  }
                </option>
              ),
            )}
          </select>

          {/* PERFORMANCE */}

          <select
            value={
              performanceFilter
            }
            onChange={(event) =>
              setPerformanceFilter(
                event.target
                  .value,
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
              All Performance
            </option>

            <option value="green">
              GREEN — On Track
            </option>

            <option value="orange">
              ORANGE — Attention
            </option>

            <option value="red">
              RED — Delayed / Blocked
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
            CUT MASTERS LOG
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-700">
              {
                filteredTimesheets.length
              }
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700">
              {
                timesheets.length
              }
            </span>{" "}
            entries
          </p>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================== */}

      <TimesheetTable
        entries={
          filteredTimesheets
        }
        loading={loading}
        onEdit={
          handleEdit
        }
      />

      {/* =================================================
          FORM
      ================================================== */}

      <TimesheetForm
        open={formOpen}
        timesheet={
          editingTimesheet
        }
        loading={
          formLoading
        }
        error={error}
        employees={employees.map(
          (employee) => ({
            id: employee.id,
            full_name:
              employee.full_name,
            employee_code:
              employee.employee_code,
            email:
              employee.email,
          }),
        )}
        tasks={
          taskOptions
        }
        onClose={
          handleClose
        }
        onSubmit={
          handleSubmit
        }
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
   TIMESHEET TABLE
========================================================= */

function TimesheetTable({
  entries,
  loading,
  onEdit,
}: {
  entries: TimesheetWithRelations[];
  loading: boolean;
  onEdit: (
    entry: TimesheetWithRelations,
  ) => void;
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

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <FileClock
            size={25}
            className="text-slate-400"
          />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900">
          No timesheet entries
        </h3>

        <p className="mt-1 max-w-md text-sm text-slate-500">
          Start recording production work to
          build your Cut Masters Log.
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
        {entries.map(
          (entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900">
                    {
                      entry.task
                        ?.title
                    }
                  </h3>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {
                      entry.client
                        ?.name
                    }
                    {" · "}
                    {
                      entry.project
                        ?.name
                    }
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getPerformanceClasses(
                    entry.performance,
                  )}`}
                >
                  {String(
                    entry.performance,
                  ).toUpperCase()}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoItem
                  label="Artist"
                  value={
                    entry.employee
                      ?.full_name ??
                    "—"
                  }
                />

                <InfoItem
                  label="Date"
                  value={formatDate(
                    entry.work_date,
                  )}
                />

                <InfoItem
                  label="Start"
                  value={new Date(
                    entry.start_time,
                  ).toLocaleTimeString(
                    "en-IN",
                    {
                      hour: "2-digit",
                      minute:
                        "2-digit",
                    },
                  )}
                />

                <InfoItem
                  label="Hours"
                  value={`${Number(
                    entry.total_hours ??
                      0,
                  ).toFixed(
                    2,
                  )}h`}
                />
              </div>

              {entry.delay_reason && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
                    Delay / Hold Reason
                  </p>

                  <p className="mt-1 text-xs text-red-700">
                    {
                      entry.delay_reason
                    }
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    onEdit(
                      entry,
                    )
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Edit3
                    size={14}
                  />

                  Edit
                </button>
              </div>
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
                  Date
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Artist
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Client
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Task
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Category
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Start
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  End
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Hours
                </th>

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Performance
                </th>

                <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {entries.map(
                (entry) => (
                  <tr
                    key={entry.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {/* DATE */}

                    <td className="px-5 py-4">
                      <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                        {formatDate(
                          entry.work_date,
                        )}
                      </span>
                    </td>

                    {/* ARTIST */}

                    <td className="px-4 py-4">
                      <div>
                        <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                          {entry
                            .employee
                            ?.full_name ??
                            "—"}
                        </p>

                        {entry
                          .employee
                          ?.employee_code && (
                          <p className="mt-1 text-[11px] text-slate-400">
                            {
                              entry
                                .employee
                                .employee_code
                            }
                          </p>
                        )}
                      </div>
                    </td>

                    {/* CLIENT */}

                    <td className="px-4 py-4">
                      <div className="max-w-[150px]">
                        <p className="truncate text-sm font-semibold text-slate-700">
                          {entry
                            .client
                            ?.name ??
                            "—"}
                        </p>
                      </div>
                    </td>

                    {/* TASK */}

                    <td className="px-4 py-4">
                      <div className="max-w-[210px]">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {entry
                            .task
                            ?.title ??
                            "—"}
                        </p>

                        {entry
                          .project
                          ?.name && (
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {
                              entry
                                .project
                                .name
                            }
                          </p>
                        )}
                      </div>
                    </td>

                    {/* CATEGORY */}

                    <td className="px-4 py-4">
                      <span className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {formatLabel(
                          entry
                            .task
                            ?.category,
                        )}
                      </span>
                    </td>

                    {/* START */}

                    <td className="px-4 py-4">
                      <span className="whitespace-nowrap text-sm text-slate-600">
                        {new Date(
                          entry.start_time,
                        ).toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "2-digit",
                            minute:
                              "2-digit",
                          },
                        )}
                      </span>
                    </td>

                    {/* END */}

                    <td className="px-4 py-4">
                      <span className="whitespace-nowrap text-sm text-slate-600">
                        {entry.end_time
                          ? new Date(
                              entry.end_time,
                            ).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              },
                            )
                          : "Working..."}
                      </span>
                    </td>

                    {/* HOURS */}

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock3
                          size={14}
                          className="text-slate-400"
                        />

                        <span className="whitespace-nowrap text-sm font-bold text-slate-700">
                          {Number(
                            entry.total_hours ??
                              0,
                          ).toFixed(
                            2,
                          )}
                          h
                        </span>
                      </div>
                    </td>

                    {/* PERFORMANCE */}

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getPerformanceClasses(
                          entry.performance,
                        )}`}
                      >
                        {String(
                          entry.performance,
                        ).toUpperCase()}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onEdit(
                            entry,
                          )
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Edit3
                          size={13}
                        />

                        Edit
                      </button>
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

      <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

export default Timesheet;