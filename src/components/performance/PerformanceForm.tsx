import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
    Activity,
    XCircle,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Save,
  Target,
  User,
  X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

export interface PerformanceFormEmployee {
  id: string;
  full_name: string | null;
  employee_code: string | null;
}

export interface PerformanceFormTask {
  id: string;
  title: string;
}

export interface PerformanceFormRecord {
  id: string;
  employee_id: string;
  task_id: string | null;
  period_start: string;
  period_end: string;
  tasks_completed: number;
  tasks_delayed: number;
  total_hours: number;
  average_task_hours: number;
  performance: string;
  remarks: string | null;
}

export interface PerformanceFormData {
  employee_id: string;
  task_id: string;
  period_start: string;
  period_end: string;
  tasks_completed: string;
  tasks_delayed: string;
  total_hours: string;
  average_task_hours: string;
  performance: string;
  remarks: string;
}

interface PerformanceFormProps {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  record?: PerformanceFormRecord | null;
  employees: PerformanceFormEmployee[];
  tasks?: PerformanceFormTask[];
  onClose: () => void;
  onSubmit: (
    data: PerformanceFormData,
  ) => void | Promise<void>;
}

/* ============================================================
   DEFAULT VALUES
============================================================ */

const EMPTY_FORM: PerformanceFormData = {
  employee_id: "",
  task_id: "",
  period_start: "",
  period_end: "",
  tasks_completed: "0",
  tasks_delayed: "0",
  total_hours: "0",
  average_task_hours: "0",
  performance: "green",
  remarks: "",
};

/* ============================================================
   HELPERS
============================================================ */

function formatDateForInput(
  value: string | null | undefined,
) {
  if (!value) {
    return "";
  }

  return value.split("T")[0];
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PerformanceForm({
  open,
  loading = false,
  error = null,
  record = null,
  employees,
  tasks = [],
  onClose,
  onSubmit,
}: PerformanceFormProps) {
  const [form, setForm] =
    useState<PerformanceFormData>(
      EMPTY_FORM,
    );

  const [validationError, setValidationError] =
    useState<string | null>(null);

  /* ==========================================================
     LOAD RECORD INTO FORM
  ========================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (record) {
      setForm({
        employee_id:
          record.employee_id || "",
        task_id: record.task_id || "",
        period_start:
          formatDateForInput(
            record.period_start,
          ),
        period_end:
          formatDateForInput(
            record.period_end,
          ),
        tasks_completed: String(
          record.tasks_completed ?? 0,
        ),
        tasks_delayed: String(
          record.tasks_delayed ?? 0,
        ),
        total_hours: String(
          record.total_hours ?? 0,
        ),
        average_task_hours: String(
          record.average_task_hours ?? 0,
        ),
        performance:
          record.performance || "green",
        remarks: record.remarks || "",
      });
    } else {
      const today =
        new Date()
          .toISOString()
          .split("T")[0];

      setForm({
        ...EMPTY_FORM,
        period_start: today,
        period_end: today,
      });
    }

    setValidationError(null);
  }, [open, record]);

  /* ==========================================================
     ESCAPE KEY
  ========================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
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
  }, [open, onClose]);

  /* ==========================================================
     BODY SCROLL
  ========================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  /* ==========================================================
     FIELD CHANGE
  ========================================================== */

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (validationError) {
      setValidationError(null);
    }
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setValidationError(null);

    if (!form.employee_id) {
      setValidationError(
        "Please select an employee.",
      );
      return;
    }

    if (!form.period_start) {
      setValidationError(
        "Please select the period start date.",
      );
      return;
    }

    if (!form.period_end) {
      setValidationError(
        "Please select the period end date.",
      );
      return;
    }

    if (
      form.period_end <
      form.period_start
    ) {
      setValidationError(
        "Period end date cannot be before the start date.",
      );
      return;
    }

    const completed = Number(
      form.tasks_completed,
    );

    const delayed = Number(
      form.tasks_delayed,
    );

    const totalHours = Number(
      form.total_hours,
    );

    const averageHours = Number(
      form.average_task_hours,
    );

    if (
      !Number.isFinite(completed) ||
      completed < 0
    ) {
      setValidationError(
        "Completed tasks must be a valid number.",
      );
      return;
    }

    if (
      !Number.isFinite(delayed) ||
      delayed < 0
    ) {
      setValidationError(
        "Delayed tasks must be a valid number.",
      );
      return;
    }

    if (
      !Number.isFinite(totalHours) ||
      totalHours < 0
    ) {
      setValidationError(
        "Total hours must be a valid number.",
      );
      return;
    }

    if (
      !Number.isFinite(averageHours) ||
      averageHours < 0
    ) {
      setValidationError(
        "Average task hours must be a valid number.",
      );
      return;
    }

    if (
      completed > 0 &&
      averageHours === 0 &&
      totalHours > 0
    ) {
      setValidationError(
        "Average task hours cannot be zero when work hours are recorded.",
      );
      return;
    }

    await onSubmit(form);
  };

  /* ==========================================================
     DO NOT RENDER
  ========================================================== */

  if (!open) {
    return null;
  }

  const isEditing = Boolean(record);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Target className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing
                  ? "Edit Performance Record"
                  : "Add Performance Record"}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Record employee performance for a selected period.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ====================================================
            FORM BODY
        ==================================================== */}

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-6 p-5">

            {/* ==================================================
                ERROR
            ================================================== */}

            {(error || validationError) && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Unable to save performance
                  </p>

                  <p className="mt-1 text-xs text-red-700">
                    {validationError ||
                      error}
                  </p>
                </div>
              </div>
            )}

            {/* ==================================================
                EMPLOYEE & TASK
            ================================================== */}

            <section>
              <div className="mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />

                <h3 className="text-sm font-semibold text-slate-900">
                  Employee & Task
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* Employee */}
                <div>
                  <label
                    htmlFor="performance-employee"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Employee
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    id="performance-employee"
                    name="employee_id"
                    value={
                      form.employee_id
                    }
                    onChange={
                      handleChange
                    }
                    disabled={loading}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                  >
                    <option value="">
                      Select employee
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={employee.id}
                          value={
                            employee.id
                          }
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

                {/* Task */}
                <div>
                  <label
                    htmlFor="performance-task"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Task
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      Optional
                    </span>
                  </label>

                  <select
                    id="performance-task"
                    name="task_id"
                    value={form.task_id}
                    onChange={
                      handleChange
                    }
                    disabled={loading}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                  >
                    <option value="">
                      Overall employee performance
                    </option>

                    {tasks.map((task) => (
                      <option
                        key={task.id}
                        value={task.id}
                      >
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* ==================================================
                PERIOD
            ================================================== */}

            <section>
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />

                <h3 className="text-sm font-semibold text-slate-900">
                  Performance Period
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* Start */}
                <div>
                  <label
                    htmlFor="performance-period-start"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Period Start
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="performance-period-start"
                    type="date"
                    name="period_start"
                    value={
                      form.period_start
                    }
                    onChange={
                      handleChange
                    }
                    disabled={loading}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                  />
                </div>

                {/* End */}
                <div>
                  <label
                    htmlFor="performance-period-end"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Period End
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="performance-period-end"
                    type="date"
                    name="period_end"
                    value={
                      form.period_end
                    }
                    min={
                      form.period_start ||
                      undefined
                    }
                    onChange={
                      handleChange
                    }
                    disabled={loading}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </section>

            {/* ==================================================
                TASK METRICS
            ================================================== */}

            <section>
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-slate-400" />

                <h3 className="text-sm font-semibold text-slate-900">
                  Task Metrics
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {/* Completed */}
                <div>
                  <label
                    htmlFor="performance-completed"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Tasks Completed
                  </label>

                  <input
                    id="performance-completed"
                    type="number"
                    name="tasks_completed"
                    min="0"
                    step="1"
                    value={
                      form.tasks_completed
                    }
                    onChange={
                      handleChange
                    }
                    disabled={loading}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                  />
                </div>

                {/* Delayed */}
                <div>
                  <label
                    htmlFor="performance-delayed"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Tasks Delayed
                  </label>

                  <input
                    id="performance-delayed"
                    type="number"
                    name="tasks_delayed"
                    min="0"
                    step="1"
                    value={
                      form.tasks_delayed
                    }
                    onChange={
                      handleChange
                    }
                    disabled={loading}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                  />
                </div>

                {/* Total Hours */}
                <div>
                  <label
                    htmlFor="performance-hours"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Total Hours
                  </label>

                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="performance-hours"
                      type="number"
                      name="total_hours"
                      min="0"
                      step="0.1"
                      value={
                        form.total_hours
                      }
                      onChange={
                        handleChange
                      }
                      disabled={loading}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {/* Average */}
                <div>
                  <label
                    htmlFor="performance-average"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Avg. Task Hours
                  </label>

                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="performance-average"
                      type="number"
                      name="average_task_hours"
                      min="0"
                      step="0.1"
                      value={
                        form.average_task_hours
                      }
                      onChange={
                        handleChange
                      }
                      disabled={loading}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ==================================================
                PERFORMANCE STATUS
            ================================================== */}

            <section>
              <div className="mb-3 flex items-center gap-2">
                <ActivityIcon />

                <h3 className="text-sm font-semibold text-slate-900">
                  Performance Status
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                {/* Green */}
                <button
                  type="button"
                  onClick={() =>
                    setForm(
                      (current) => ({
                        ...current,
                        performance:
                          "green",
                      }),
                    )
                  }
                  disabled={loading}
                  className={`rounded-xl border p-4 text-left transition ${
                    form.performance ===
                    "green"
                      ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                      : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-700">
                      GREEN
                    </span>

                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>

                  <p className="mt-1 text-xs text-emerald-600">
                    Performing well
                  </p>
                </button>

                {/* Orange */}
                <button
                  type="button"
                  onClick={() =>
                    setForm(
                      (current) => ({
                        ...current,
                        performance:
                          "orange",
                      }),
                    )
                  }
                  disabled={loading}
                  className={`rounded-xl border p-4 text-left transition ${
                    form.performance ===
                    "orange"
                      ? "border-orange-300 bg-orange-50 ring-2 ring-orange-100"
                      : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-orange-700">
                      ORANGE
                    </span>

                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  </div>

                  <p className="mt-1 text-xs text-orange-600">
                    Needs monitoring
                  </p>
                </button>

                {/* Red */}
                <button
                  type="button"
                  onClick={() =>
                    setForm(
                      (current) => ({
                        ...current,
                        performance:
                          "red",
                      }),
                    )
                  }
                  disabled={loading}
                  className={`rounded-xl border p-4 text-left transition ${
                    form.performance ===
                    "red"
                      ? "border-red-300 bg-red-50 ring-2 ring-red-100"
                      : "border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-red-700">
                      RED
                    </span>

                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>

                  <p className="mt-1 text-xs text-red-600">
                    Requires attention
                  </p>
                </button>
              </div>
            </section>

            {/* ==================================================
                REMARKS
            ================================================== */}

            <section>
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />

                <h3 className="text-sm font-semibold text-slate-900">
                  Remarks
                </h3>
              </div>

              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                disabled={loading}
                rows={4}
                placeholder="Add notes about workload, delivery, quality, delays or performance..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              />
            </section>
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />

                  {isEditing
                    ? "Update Record"
                    : "Save Record"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   SMALL ICON
============================================================ */

function ActivityIcon() {
  return (
    <Activity
      className="h-4 w-4 text-slate-400"
    />
  );
}