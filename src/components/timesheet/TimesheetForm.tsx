import {
  CalendarDays,
  Check,
  Clock3,
  FileText,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  calculateTotalHours,
} from "../../services/timesheet/timesheet.service";

import type {
  CreateTimesheetInput,
  TimesheetWithRelations,
  UpdateTimesheetInput,
} from "../../types/timesheet";

/* =========================================================
   TYPES
========================================================= */

interface EmployeeOption {
  id: string;
  full_name: string;
  employee_code: string;
  email: string;
}

interface TaskOption {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  client_name?: string | null;
  project_name?: string | null;
}

interface TimesheetFormProps {
  open: boolean;

  timesheet?: TimesheetWithRelations | null;

  loading: boolean;

  error: string;

  employees: EmployeeOption[];

  tasks: TaskOption[];

  performanceOptions?: {
    value: string;
    label: string;
  }[];

  onClose: () => void;

  onSubmit: (
    data:
      | CreateTimesheetInput
      | UpdateTimesheetInput,
    employeeId: string,
  ) => Promise<void>;
}

/* =========================================================
   DEFAULT PERFORMANCE OPTIONS
========================================================= */

const defaultPerformanceOptions = [
  {
    value: "green",
    label: "GREEN",
  },
  {
    value: "orange",
    label: "ORANGE",
  },
  {
    value: "red",
    label: "RED",
  },
];

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

function getToday(): string {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* =========================================================
   TIME INPUT
========================================================= */

function getTimeValue(
  value: string | null | undefined,
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const hours =
    String(
      date.getHours(),
    ).padStart(2, "0");

  const minutes =
    String(
      date.getMinutes(),
    ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

/* =========================================================
   COMBINE DATE + TIME
========================================================= */

function combineDateAndTime(
  date: string,
  time: string,
): string {
  if (
    !date ||
    !time
  ) {
    return "";
  }

  return new Date(
    `${date}T${time}:00`,
  ).toISOString();
}

/* =========================================================
   PERFORMANCE COLORS
========================================================= */

function getPerformanceClasses(
  value: string,
  selected: boolean,
): string {
  switch (
    value.toLowerCase()
  ) {
    case "green":
      return selected
        ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100"
        : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50";

    case "orange":
      return selected
        ? "border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-100"
        : "border-orange-200 bg-white text-orange-700 hover:bg-orange-50";

    case "red":
      return selected
        ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-100"
        : "border-red-200 bg-white text-red-700 hover:bg-red-50";

    default:
      return selected
        ? "border-slate-500 bg-slate-50 text-slate-800 ring-2 ring-slate-100"
        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
  }
}

/* =========================================================
   FORM
========================================================= */

function TimesheetForm({
  open,
  timesheet = null,
  loading,
  error,
  employees,
  tasks,
  performanceOptions = defaultPerformanceOptions,
  onClose,
  onSubmit,
}: TimesheetFormProps) {
  /* =======================================================
     STATE
  ======================================================== */

  const [employeeId, setEmployeeId] =
    useState("");

  const [taskId, setTaskId] =
    useState("");

  const [workDate, setWorkDate] =
    useState(getToday());

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [performance, setPerformance] =
    useState("green");

  const [delayReason, setDelayReason] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [formError, setFormError] =
    useState("");

  /* =======================================================
     EDIT MODE
  ======================================================== */

  const isEdit =
    Boolean(timesheet);

  /* =======================================================
     INITIALIZE FORM
  ======================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (timesheet) {
      setEmployeeId(
        timesheet.employee_id ??
          "",
      );

      setTaskId(
        timesheet.task_id ??
          "",
      );

      setWorkDate(
        timesheet.work_date ??
          getToday(),
      );

      setStartTime(
        getTimeValue(
          timesheet.start_time,
        ),
      );

      setEndTime(
        getTimeValue(
          timesheet.end_time,
        ),
      );

      setPerformance(
        timesheet.performance ||
          "green",
      );

      setDelayReason(
        timesheet.delay_reason ??
          "",
      );

      setNotes(
        timesheet.notes ??
          "",
      );
    } else {
      setEmployeeId("");

      setTaskId("");

      setWorkDate(
        getToday(),
      );

      setStartTime("");

      setEndTime("");

      setPerformance("green");

      setDelayReason("");

      setNotes("");
    }

    setFormError("");
  }, [
    open,
    timesheet,
  ]);

  /* =======================================================
     BODY SCROLL
  ======================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previous;
    };
  }, [open]);

  /* =======================================================
     ESCAPE
  ======================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown =
      (
        event: KeyboardEvent,
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          onClose();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    onClose,
  ]);

  /* =======================================================
     SELECTED TASK
  ======================================================== */

  const selectedTask =
    useMemo(
      () =>
        tasks.find(
          (task) =>
            task.id ===
            taskId,
        ) ?? null,
      [
        tasks,
        taskId,
      ],
    );

  /* =======================================================
     CALCULATE HOURS
  ======================================================== */

  const totalHours =
    useMemo(() => {
      if (
        !workDate ||
        !startTime ||
        !endTime
      ) {
        return 0;
      }

      const start =
        combineDateAndTime(
          workDate,
          startTime,
        );

      const end =
        combineDateAndTime(
          workDate,
          endTime,
        );

      if (
        !start ||
        !end
      ) {
        return 0;
      }

      return calculateTotalHours(
        start,
        end,
      );
    }, [
      workDate,
      startTime,
      endTime,
    ]);

  /* =======================================================
     SUBMIT
  ======================================================== */

  const handleSubmit =
    async (
      event: React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setFormError("");

      /* -----------------------------------------------
         VALIDATION
      ------------------------------------------------ */

      if (!employeeId) {
        setFormError(
          "Please select an employee.",
        );
        return;
      }

      if (!taskId) {
        setFormError(
          "Please select a task.",
        );
        return;
      }

      if (!workDate) {
        setFormError(
          "Please select the work date.",
        );
        return;
      }

      if (!startTime) {
        setFormError(
          "Please enter the start time.",
        );
        return;
      }

      if (!performance) {
        setFormError(
          "Please select a performance status.",
        );
        return;
      }

      if (
        endTime &&
        totalHours <= 0
      ) {
        setFormError(
          "End time must be later than start time.",
        );
        return;
      }

      const startDateTime =
        combineDateAndTime(
          workDate,
          startTime,
        );

      const endDateTime =
        endTime
          ? combineDateAndTime(
              workDate,
              endTime,
            )
          : null;

      if (!startDateTime) {
        setFormError(
          "Invalid start time.",
        );
        return;
      }

      try {
        await onSubmit(
          {
            task_id:
              taskId,

            work_date:
              workDate,

            start_time:
              startDateTime,

            end_time:
              endDateTime,

            total_hours:
              totalHours,

            performance:
              performance,

            delay_reason:
              delayReason.trim() ||
              null,

            notes:
              notes.trim() ||
              null,
          },
          employeeId,
        );
      } catch (err) {
        setFormError(
          err instanceof Error
            ? err.message
            : "Unable to save timesheet.",
        );
      }
    };

  /* =======================================================
     CLOSED
  ======================================================== */

  if (!open) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-slate-950/50
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          flex
          max-h-[92vh]
          w-full
          max-w-3xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >
        {/* =================================================
            HEADER
        ================================================== */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Clock3
                size={20}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {isEdit
                  ? "Edit Timesheet"
                  : "Cut Masters Log"}
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                {isEdit
                  ? "Update production work details."
                  : "Record production work and working hours."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            <X
              size={18}
            />
          </button>
        </div>

        {/* =================================================
            CONTENT
        ================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-7 px-5 py-6 sm:px-6">
            {/* =============================================
                ERROR
            ============================================== */}

            {(formError ||
              error) && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p className="font-semibold">
                  Unable to save entry
                </p>

                <p className="mt-1">
                  {formError ||
                    error}
                </p>
              </div>
            )}

            {/* =============================================
                WORK INFORMATION
            ============================================== */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                <UserRound
                  size={16}
                  className="text-slate-500"
                />

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  WORK INFORMATION
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* EMPLOYEE */}

                <Field
                  label="Artist / Team Member"
                  required
                >
                  <select
                    value={
                      employeeId
                    }
                    onChange={(
                      event,
                    ) =>
                      setEmployeeId(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className="input"
                  >
                    <option value="">
                      Select artist
                    </option>

                    {employees.map(
                      (
                        employee,
                      ) => (
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
                          {" — "}
                          {
                            employee.employee_code
                          }
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                {/* DATE */}

                <Field
                  label="Work Date"
                  required
                >
                  <div className="relative">
                    <CalendarDays
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      value={
                        workDate
                      }
                      onChange={(
                        event,
                      ) =>
                        setWorkDate(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        loading
                      }
                      className="input pl-10"
                    />
                  </div>
                </Field>

                {/* TASK */}

                <Field
                  label="Task"
                  required
                >
                  <select
                    value={
                      taskId
                    }
                    onChange={(
                      event,
                    ) =>
                      setTaskId(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className="input"
                  >
                    <option value="">
                      Select task
                    </option>

                    {tasks.map(
                      (task) => (
                        <option
                          key={
                            task.id
                          }
                          value={
                            task.id
                          }
                        >
                          {
                            task.title
                          }
                          {task.client_name
                            ? ` — ${task.client_name}`
                            : ""}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                {/* PROJECT */}

                <Field label="Project">
                  <div className="input flex items-center bg-slate-50 text-slate-600">
                    {selectedTask
                      ?.project_name ||
                      "Select a task first"}
                  </div>
                </Field>
              </div>

              {/* TASK PREVIEW */}

              {selectedTask && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">
                      {
                        selectedTask.title
                      }
                    </span>

                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">
                      {formatLabel(
                        selectedTask.category,
                      )}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">
                      {formatLabel(
                        selectedTask.priority,
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {selectedTask.client_name ||
                      "No client"}
                    {" · "}
                    {selectedTask.project_name ||
                      "No project"}
                  </p>
                </div>
              )}
            </section>

            {/* =============================================
                TIME TRACKING
            ============================================== */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Clock3
                  size={16}
                  className="text-slate-500"
                />

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  TIME TRACKING
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* START */}

                <Field
                  label="Start Time"
                  required
                >
                  <input
                    type="time"
                    value={
                      startTime
                    }
                    onChange={(
                      event,
                    ) =>
                      setStartTime(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className="input"
                  />
                </Field>

                {/* END */}

                <Field label="End Time">
                  <input
                    type="time"
                    value={
                      endTime
                    }
                    onChange={(
                      event,
                    ) =>
                      setEndTime(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className="input"
                  />
                </Field>

                {/* TOTAL */}

                <Field label="Total Hours">
                  <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <span className="text-lg font-bold text-slate-950">
                      {totalHours.toFixed(
                        2,
                      )}
                    </span>

                    <span className="ml-1 text-sm font-medium text-slate-400">
                      hours
                    </span>
                  </div>
                </Field>
              </div>

              {/* LIVE HOURS */}

              {startTime &&
                !endTime && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                    <div className="flex items-center gap-2">
                      <Clock3
                        size={14}
                      />

                      <span>
                        Work entry is open.
                        Add an end time when
                        the work is finished.
                      </span>
                    </div>
                  </div>
                )}
            </section>

            {/* =============================================
                PERFORMANCE
            ============================================== */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Check
                  size={16}
                  className="text-slate-500"
                />

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  PERFORMANCE TRACKER
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {performanceOptions.map(
                  (
                    option,
                  ) => {
                    const selected =
                      performance ===
                      option.value;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        disabled={
                          loading
                        }
                        onClick={() =>
                          setPerformance(
                            option.value,
                          )
                        }
                        className={`
                          flex
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          border
                          px-4
                          py-3
                          text-sm
                          font-bold
                          transition
                          ${getPerformanceClasses(
                            option.value,
                            selected,
                          )}
                        `}
                      >
                        {selected && (
                          <Check
                            size={15}
                          />
                        )}

                        {option.label}
                      </button>
                    );
                  },
                )}
              </div>

              <p className="mt-2 text-xs text-slate-400">
                GREEN = On Track · ORANGE =
                Needs Attention · RED = Delayed /
                Blocked
              </p>
            </section>

            {/* =============================================
                DELAY / HOLD
            ============================================== */}

            <section>
              <div className="mb-4 flex items-center gap-2">
                <FileText
                  size={16}
                  className="text-slate-500"
                />

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  DELAY / HOLD DETAILS
                </h3>
              </div>

              <div className="space-y-4">
                <Field label="Delay / Hold Reason">
                  <textarea
                    value={
                      delayReason
                    }
                    onChange={(
                      event,
                    ) =>
                      setDelayReason(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    rows={3}
                    placeholder="Mention any delay, dependency, missing footage, correction or hold reason..."
                    className="input h-auto resize-none py-3"
                  />
                </Field>

                <Field label="Notes">
                  <textarea
                    value={
                      notes
                    }
                    onChange={(
                      event,
                    ) =>
                      setNotes(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    rows={3}
                    placeholder="Add any additional production notes..."
                    className="input h-auto resize-none py-3"
                  />
                </Field>
              </div>
            </section>
          </div>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={
                loading
              }
              className="
                h-10
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                font-semibold
                text-slate-600
                transition
                hover:bg-slate-50
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading
              }
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-slate-950
                px-5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-slate-800
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  Saving...
                </>
              ) : (
                <>
                  <Check
                    size={16}
                  />

                  {isEdit
                    ? "Update Entry"
                    : "Save Entry"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* =================================================
          INPUT STYLES
      ================================================== */}

      <style>
        {`
          .input {
            width: 100%;
            height: 44px;
            border-radius: 12px;
            border: 1px solid rgb(226 232 240);
            background: white;
            padding-left: 12px;
            padding-right: 12px;
            font-size: 14px;
            color: rgb(51 65 85);
            outline: none;
            transition: all 150ms ease;
          }

          .input::placeholder {
            color: rgb(148 163 184);
          }

          .input:focus {
            border-color: rgb(100 116 139);
            box-shadow: 0 0 0 3px rgb(241 245 249);
          }

          .input:disabled {
            cursor: not-allowed;
            opacity: 0.55;
            background: rgb(248 250 252);
          }
        `}
      </style>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

export default TimesheetForm;