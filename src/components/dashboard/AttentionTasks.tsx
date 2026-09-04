import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

interface TaskRow {
  id: string;
  title: string;
  client_id: string | null;
  priority: string | null;
  status: string | null;
  due_date: string | null;
  planned_date: string | null;
  created_at: string;
}

interface ClientRow {
  id: string;
  name: string;
  short_name: string | null;
}

interface AssignmentRow {
  id: string;
  task_id: string;
  employee_id: string;
  status: string | null;
}

interface EmployeeRow {
  id: string;
  full_name: string | null;
}

interface AttentionTask {
  id: string;
  title: string;
  client: string;
  artist: string;
  due: string;
  dueDate: Date | null;
  status: string;
  type: "blue" | "purple" | "red" | "orange";
  priority: string;
}

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isCompletedStatus(status: string | null | undefined) {
  const value = normalize(status);

  return [
    "completed",
    "approved_delivered",
    "approved_and_delivered",
    "delivered",
    "completed_and_closed",
    "closed",
  ].includes(value);
}

function isBlockedStatus(status: string | null | undefined) {
  const value = normalize(status);

  return [
    "blocked",
    "on_hold",
    "delayed",
    "delayed_blocked",
  ].includes(value);
}

function isInternalReviewStatus(status: string | null | undefined) {
  const value = normalize(status);

  return [
    "sent_for_internal_review",
    "internal_review",
    "in_review",
  ].includes(value);
}

function isClientReviewStatus(status: string | null | undefined) {
  const value = normalize(status);

  return [
    "sent_for_client_review",
    "client_review",
  ].includes(value);
}

function isInProgressStatus(status: string | null | undefined) {
  const value = normalize(status);

  return [
    "in_progress",
    "editing_in_progress",
    "editing",
    "working",
  ].includes(value);
}

function isHighPriority(priority: string | null | undefined) {
  return ["high", "urgent", "critical"].includes(normalize(priority));
}

function formatDueDate(value: string | null) {
  if (!value) {
    return "No deadline";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const taskDayStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (taskDayStart < todayStart) {
    return "Overdue";
  }

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (taskDayStart.getTime() === todayStart.getTime()) {
    return `Today, ${time}`;
  }

  if (taskDayStart.getTime() === tomorrowStart.getTime()) {
    return `Tomorrow, ${time}`;
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function isOverdue(value: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() < Date.now();
}

function getStatusLabel(status: string | null) {
  const value = normalize(status);

  const labels: Record<string, string> = {
    not_started: "Not Started",
    in_queue: "In Queue",
    raw_footage_received: "Raw Footage Received",
    in_progress: "In Progress",
    editing_in_progress: "In Progress",
    editing: "In Progress",
    working: "In Progress",
    sent_for_internal_review: "Internal Review",
    internal_review: "Internal Review",
    in_review: "Internal Review",
    sent_for_client_review: "Client Review",
    client_review: "Client Review",
    approved_delivered: "Completed",
    approved_and_delivered: "Completed",
    completed: "Completed",
    delivered: "Delivered",
    completed_and_closed: "Completed",
    closed: "Closed",
    on_hold: "On Hold",
    blocked: "Blocked",
    delayed: "Delayed",
    delayed_blocked: "Delayed / Blocked",
  };

  return labels[value] ?? (status || "Unknown");
}

function getAttentionReason(
  task: TaskRow,
): AttentionTask["type"] | null {
  if (!isCompletedStatus(task.status) && isBlockedStatus(task.status)) {
    return "red";
  }

  if (
    !isCompletedStatus(task.status) &&
    isOverdue(task.due_date)
  ) {
    return "red";
  }

  if (isClientReviewStatus(task.status)) {
    return "purple";
  }

  if (isInternalReviewStatus(task.status)) {
    return "purple";
  }

  if (isHighPriority(task.priority)) {
    return "orange";
  }

  if (isInProgressStatus(task.status) && isOverdue(task.due_date)) {
    return "red";
  }

  return null;
}

function statusClasses(type: AttentionTask["type"]) {
  if (type === "red") {
    return "bg-red-50 text-red-700 ring-red-600/10";
  }

  if (type === "purple") {
    return "bg-violet-50 text-violet-700 ring-violet-600/10";
  }

  if (type === "orange") {
    return "bg-amber-50 text-amber-700 ring-amber-600/10";
  }

  return "bg-blue-50 text-blue-700 ring-blue-600/10";
}

function AttentionTasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<AttentionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAttentionTasks() {
    try {
      setLoading(true);
      setError("");

      const [
        tasksResult,
        clientsResult,
        assignmentsResult,
        employeesResult,
      ] = await Promise.all([
        supabase
          .from("tasks")
          .select(
            `
              id,
              title,
              client_id,
              priority,
              status,
              due_date,
              planned_date,
              created_at
            `,
          )
          .order("due_date", {
            ascending: true,
            nullsFirst: false,
          })
          .limit(50),

        supabase
          .from("clients")
          .select("id, name, short_name")
          .eq("is_active", true),

        supabase
          .from("task_assignments")
          .select("id, task_id, employee_id, status"),

        supabase
          .from("employees")
          .select("id, full_name")
          .eq("is_active", true),
      ]);

      if (tasksResult.error) {
        throw new Error(tasksResult.error.message);
      }

      if (clientsResult.error) {
        throw new Error(clientsResult.error.message);
      }

      if (assignmentsResult.error) {
        throw new Error(assignmentsResult.error.message);
      }

      if (employeesResult.error) {
        throw new Error(employeesResult.error.message);
      }

      const taskRows = (tasksResult.data ?? []) as TaskRow[];
      const clientRows = (clientsResult.data ?? []) as ClientRow[];
      const assignmentRows =
        (assignmentsResult.data ?? []) as AssignmentRow[];
      const employeeRows =
        (employeesResult.data ?? []) as EmployeeRow[];

      const clientMap = new Map(
        clientRows.map((client) => [
          client.id,
          client.short_name || client.name,
        ]),
      );

      const employeeMap = new Map(
        employeeRows.map((employee) => [
          employee.id,
          employee.full_name || "Unassigned",
        ]),
      );

      const assignmentMap = new Map<string, AssignmentRow>();

      assignmentRows.forEach((assignment) => {
        const existing = assignmentMap.get(assignment.task_id);

        if (!existing) {
          assignmentMap.set(assignment.task_id, assignment);
          return;
        }

        /*
         * Prefer an active assignment over a completed one.
         */
        const existingStatus = normalize(existing.status);
        const currentStatus = normalize(assignment.status);

        if (
          existingStatus === "completed" &&
          currentStatus !== "completed"
        ) {
          assignmentMap.set(assignment.task_id, assignment);
        }
      });

      const attentionTasks: AttentionTask[] = taskRows
        .filter((task) => !isCompletedStatus(task.status))
        .map((task) => {
          const type = getAttentionReason(task);

          if (!type) {
            return null;
          }

          const assignment = assignmentMap.get(task.id);

          return {
            id: task.id,
            title: task.title,
            client: task.client_id
              ? clientMap.get(task.client_id) || "Unknown Client"
              : "No Client",
            artist: assignment
              ? employeeMap.get(assignment.employee_id) || "Unassigned"
              : "Unassigned",
            due: formatDueDate(task.due_date),
            dueDate: task.due_date
              ? new Date(task.due_date)
              : null,
            status: getStatusLabel(task.status),
            type,
            priority: task.priority || "normal",
          };
        })
        .filter(
          (task): task is AttentionTask => task !== null,
        )
        .sort((a, b) => {
          /*
           * Red / blocked tasks first,
           * then review,
           * then high priority.
           */
          const typeWeight = {
            red: 0,
            purple: 1,
            orange: 2,
            blue: 3,
          };

          const typeDifference =
            typeWeight[a.type] - typeWeight[b.type];

          if (typeDifference !== 0) {
            return typeDifference;
          }

          if (!a.dueDate && !b.dueDate) {
            return 0;
          }

          if (!a.dueDate) {
            return 1;
          }

          if (!b.dueDate) {
            return -1;
          }

          return (
            a.dueDate.getTime() -
            b.dueDate.getTime()
          );
        })
        .slice(0, 8);

      setTasks(attentionTasks);
    } catch (err) {
      console.error("Failed to load attention tasks:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attention tasks.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAttentionTasks();
  }, []);

  const summary = useMemo(() => {
    const overdue = tasks.filter(
      (task) => task.due === "Overdue",
    ).length;

    const blocked = tasks.filter(
      (task) => task.type === "red",
    ).length;

    const reviews = tasks.filter(
      (task) => task.type === "purple",
    ).length;

    return {
      total: tasks.length,
      overdue,
      blocked,
      reviews,
    };
  }, [tasks]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-slate-950">
              Tasks Requiring Attention
            </h2>

            {!loading && tasks.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {summary.total}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Tasks that need action from the coordinator or admin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadAttentionTasks()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/tasks")}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            View all tasks
          </button>
        </div>
      </div>

      {!loading && !error && tasks.length > 0 && (
        <div className="grid grid-cols-3 divide-x border-b border-slate-100 bg-slate-50/50">
          <div className="px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={15}
                className="text-red-500"
              />

              <span className="text-xs font-medium text-slate-500">
                Critical
              </span>
            </div>

            <p className="mt-1 text-lg font-semibold text-slate-950">
              {summary.blocked}
            </p>
          </div>

          <div className="px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Clock3
                size={15}
                className="text-amber-500"
              />

              <span className="text-xs font-medium text-slate-500">
                Overdue
              </span>
            </div>

            <p className="mt-1 text-lg font-semibold text-slate-950">
              {summary.overdue}
            </p>
          </div>

          <div className="px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={15}
                className="text-violet-500"
              />

              <span className="text-xs font-medium text-slate-500">
                Reviews
              </span>
            </div>

            <p className="mt-1 text-lg font-semibold text-slate-950">
              {summary.reviews}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="divide-y divide-slate-100">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse px-4 py-5 sm:px-6"
            >
              <div className="h-4 w-64 rounded bg-slate-200" />

              <div className="mt-3 h-3 w-40 rounded bg-slate-100" />

              <div className="mt-4 h-6 w-24 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="px-6 py-10 text-center">
          <AlertTriangle
            size={28}
            className="mx-auto text-red-500"
          />

          <p className="mt-3 text-sm font-medium text-slate-900">
            Unable to load attention tasks
          </p>

          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadAttentionTasks()}
            className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2
              size={22}
              className="text-emerald-600"
            />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-900">
            Everything looks good
          </p>

          <p className="mt-1 text-sm text-slate-500">
            No tasks currently require immediate attention.
          </p>
        </div>
      )}

      {!loading && !error && tasks.length > 0 && (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Task
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Client
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Artist
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Due
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>

                  <th />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="group cursor-pointer transition hover:bg-slate-50"
                    onClick={() =>
                      navigate(`/tasks?task=${task.id}`)
                    }
                  >
                    <td className="px-6 py-4">
                      <p className="max-w-xs truncate text-sm font-medium text-slate-900">
                        {task.title}
                      </p>

                      {isHighPriority(task.priority) && (
                        <span className="mt-1 inline-block text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                          {task.priority} priority
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {task.client}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {task.artist}
                    </td>

                    <td
                      className={`px-6 py-4 text-sm ${
                        task.due === "Overdue"
                          ? "font-semibold text-red-600"
                          : "text-slate-600"
                      }`}
                    >
                      {task.due}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses(
                          task.type,
                        )}`}
                      >
                        {task.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        aria-label={`Open ${task.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/tasks?task=${task.id}`);
                        }}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() =>
                  navigate(`/tasks?task=${task.id}`)
                }
                className="block w-full space-y-3 px-4 py-5 text-left transition hover:bg-slate-50 sm:px-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {task.client} · {task.artist}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={16}
                    className="shrink-0 text-slate-400"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses(
                      task.type,
                    )}`}
                  >
                    {task.status}
                  </span>

                  <span
                    className={`text-xs ${
                      task.due === "Overdue"
                        ? "font-semibold text-red-600"
                        : "text-slate-500"
                    }`}
                  >
                    {task.due}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default AttentionTasks;