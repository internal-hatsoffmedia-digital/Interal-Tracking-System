import {
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserRound,
  X,
} from "lucide-react";

import type {
  CreateTaskAssignmentInput,
} from "../../types/taskAssignment";

/* =========================================================
   TYPES
========================================================= */

interface TaskOption {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  planned_date: string | null;
  due_date: string | null;
}

interface EmployeeOption {
  id: string;
  full_name: string;
  employee_code: string;
  email: string;
  job_title: string | null;
}

interface TaskAssignmentFormProps {
  open: boolean;
  loading: boolean;
  error: string;

  tasks: TaskOption[];
  employees: EmployeeOption[];

  onClose: () => void;

  onSubmit: (
    data: CreateTaskAssignmentInput,
  ) => Promise<void>;
}

/* =========================================================
   HELPERS
========================================================= */

function formatLabel(
  value: string,
) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "Not set";
  }

  const date =
    new Date(value);

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

/* =========================================================
   COMPONENT
========================================================= */

function TaskAssignmentForm({
  open,
  loading,
  error,
  tasks,
  employees,
  onClose,
  onSubmit,
}: TaskAssignmentFormProps) {
  const [taskId, setTaskId] =
    useState("");

  const [employeeId, setEmployeeId] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [validationError, setValidationError] =
    useState("");

  /* =======================================================
     RESET FORM
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    setTaskId("");
    setEmployeeId("");
    setNotes("");
    setValidationError("");
  }, [open]);

  /* =======================================================
     ESCAPE KEY
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown =
      (event: KeyboardEvent) => {
        if (
          event.key === "Escape" &&
          !loading
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
    loading,
    onClose,
  ]);

  /* =======================================================
     BODY SCROLL LOCK
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  /* =======================================================
     SELECTED DATA
  ======================================================= */

  const selectedTask =
    tasks.find(
      (task) =>
        task.id === taskId,
    );

  const selectedEmployee =
    employees.find(
      (employee) =>
        employee.id === employeeId,
    );

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (
      event: React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setValidationError("");

      if (!taskId) {
        setValidationError(
          "Please select a task.",
        );
        return;
      }

      if (!employeeId) {
        setValidationError(
          "Please select an employee.",
        );
        return;
      }

      try {
        await onSubmit({
          task_id: taskId,
          employee_id: employeeId,
          notes:
            notes.trim() || null,
        });
      } catch {
        /*
         * The parent handles the
         * actual Supabase error.
         */
      }
    };

  /* =======================================================
     CLOSED
  ======================================================= */

  if (!open) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <UserRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Assign Task
                </h2>

                <p className="text-sm text-slate-500">
                  Assign production work to
                  an employee.
                </p>
              </div>
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

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
            {/* =============================================
                ERROR
            ============================================= */}

            {(validationError ||
              error) && (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="font-semibold">
                    Unable to assign task
                  </p>

                  <p className="mt-1">
                    {validationError ||
                      error}
                  </p>
                </div>
              </div>
            )}

            {/* =============================================
                TASK
            ============================================= */}

            <div>
              <label
                htmlFor="assignment-task"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Task
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                id="assignment-task"
                value={taskId}
                onChange={(event) => {
                  setTaskId(
                    event.target.value,
                  );
                  setValidationError("");
                }}
                disabled={loading}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">
                  Select a task
                </option>

                {tasks.map(
                  (task) => (
                    <option
                      key={task.id}
                      value={task.id}
                    >
                      {task.title}
                    </option>
                  ),
                )}
              </select>

              {tasks.length ===
                0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No available tasks
                  found.
                </p>
              )}
            </div>

            {/* =============================================
                SELECTED TASK PREVIEW
            ============================================= */}

            {selectedTask && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Selected Task
                    </p>

                    <h3 className="mt-1 font-semibold text-slate-900">
                      {selectedTask.title}
                    </h3>
                  </div>

                  <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                    {formatLabel(
                      selectedTask.priority,
                    )}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoItem
                    label="Category"
                    value={formatLabel(
                      selectedTask.category,
                    )}
                  />

                  <InfoItem
                    label="Status"
                    value={formatLabel(
                      selectedTask.status,
                    )}
                  />

                  <InfoItem
                    label="Planned"
                    value={formatDate(
                      selectedTask.planned_date,
                    )}
                  />

                  <InfoItem
                    label="Deadline"
                    value={formatDate(
                      selectedTask.due_date,
                    )}
                  />
                </div>
              </div>
            )}

            {/* =============================================
                EMPLOYEE
            ============================================= */}

            <div>
              <label
                htmlFor="assignment-employee"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Assign To
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                id="assignment-employee"
                value={employeeId}
                onChange={(event) => {
                  setEmployeeId(
                    event.target.value,
                  );
                  setValidationError("");
                }}
                disabled={loading}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">
                  Select an employee
                </option>

                {employees.map(
                  (employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.full_name}{" "}
                      —{" "}
                      {
                        employee.employee_code
                      }
                    </option>
                  ),
                )}
              </select>

              {employees.length ===
                0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No active employees
                  found.
                </p>
              )}
            </div>

            {/* =============================================
                SELECTED EMPLOYEE PREVIEW
            ============================================= */}

            {selectedEmployee && (
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <UserRound className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {
                      selectedEmployee.full_name
                    }
                  </p>

                  <p className="mt-0.5 text-sm text-slate-500">
                    {
                      selectedEmployee.employee_code
                    }

                    {selectedEmployee.job_title
                      ? ` • ${selectedEmployee.job_title}`
                      : ""}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {
                      selectedEmployee.email
                    }
                  </p>
                </div>

                <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-500" />
              </div>
            )}

            {/* =============================================
                NOTES
            ============================================= */}

            <div>
              <label
                htmlFor="assignment-notes"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Assignment Notes
              </label>

              <textarea
                id="assignment-notes"
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                disabled={loading}
                rows={4}
                placeholder="Add any instructions, references or special notes for the employee..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
              />

              <p className="mt-2 text-xs text-slate-400">
                These notes will be visible
                with the assignment.
              </p>
            </div>

            {/* =============================================
                PERMISSION NOTICE
            ============================================= */}

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Assignment control
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    Task assignments are
                    controlled by Admin and
                    Project Coordinator
                    permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !taskId ||
                !employeeId
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserRound className="h-4 w-4" />
                  Assign Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

export default TaskAssignmentForm;