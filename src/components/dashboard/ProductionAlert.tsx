import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

interface TaskRow {
  id: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  created_at: string;
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

function isOverdue(task: TaskRow) {
  if (!task.due_date || isCompletedStatus(task.status)) {
    return false;
  }

  const dueDate = new Date(task.due_date);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return dueDate.getTime() < Date.now();
}

function ProductionAlert() {
  const navigate = useNavigate();

  const [blockedCount, setBlockedCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProductionAlert() {
    try {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("tasks")
        .select("id, status, priority, due_date, created_at")
        .limit(500);

      if (queryError) {
        throw new Error(queryError.message);
      }

      const tasks = (data ?? []) as TaskRow[];

      const activeTasks = tasks.filter(
        (task) => !isCompletedStatus(task.status),
      );

      const blocked = activeTasks.filter((task) =>
        isBlockedStatus(task.status),
      ).length;

      const overdue = activeTasks.filter(isOverdue).length;

      setBlockedCount(blocked);
      setOverdueCount(overdue);
    } catch (err) {
      console.error(
        "Failed to load production alert:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load production status.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProductionAlert();
  }, []);

  const issueCount = blockedCount + overdueCount;

  const isHealthy = issueCount === 0;

  const message = loading
    ? "Checking current production capacity..."
    : error
      ? "Production status could not be loaded."
      : isHealthy
        ? "No blocked or overdue tasks require immediate attention."
        : `${blockedCount} ${
            blockedCount === 1 ? "task is" : "tasks are"
          } blocked and ${overdueCount} ${
            overdueCount === 1 ? "task is" : "tasks are"
          } overdue.`;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
          {loading ? (
            <RefreshCw
              size={19}
              className="animate-spin text-slate-300"
            />
          ) : error ? (
            <AlertTriangle
              size={19}
              className="text-amber-400"
            />
          ) : isHealthy ? (
            <CheckCircle2
              size={19}
              className="text-emerald-400"
            />
          ) : (
            <Users
              size={19}
              className="text-white"
            />
          )}
        </div>

        <div className="min-w-0">
          <p className="font-semibold">
            {loading
              ? "Checking production capacity..."
              : error
                ? "Production status unavailable."
                : isHealthy
                  ? "Production capacity looks healthy."
                  : "Production needs attention."}
          </p>

          <p className="mt-1 text-sm leading-5 text-slate-400">
            {message}
          </p>

          {!loading && !error && !isHealthy && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              {blockedCount > 0 && (
                <span>
                  Blocked:{" "}
                  <strong className="text-slate-300">
                    {blockedCount}
                  </strong>
                </span>
              )}

              {overdueCount > 0 && (
                <span>
                  Overdue:{" "}
                  <strong className="text-slate-300">
                    {overdueCount}
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {!loading && !error && !isHealthy && (
          <span className="hidden rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 ring-1 ring-inset ring-red-400/20 sm:inline-flex">
            {issueCount}{" "}
            {issueCount === 1 ? "issue" : "issues"}
          </span>
        )}

        {!loading && !error && isHealthy && (
          <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/20 sm:inline-flex">
            All clear
          </span>
        )}

        <button
          type="button"
          onClick={() => navigate("/tasks")}
          className="flex items-center gap-2 text-sm font-medium text-white transition hover:text-slate-300"
        >
          {isHealthy ? "View tasks" : "Review blockers"}

          <ArrowUpRight size={16} />
        </button>
      </div>
    </section>
  );
}

export default ProductionAlert;