import { useEffect, useState } from "react";
import "./TeamPC.css";
import {
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Briefcase,
  FolderKanban,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getTeamOversight,
  oversightRoles,
} from "../../services/teams/teamOversight.service";
import {
  monthlyTiming,
  indiaMonth,
  durationMinutes,
  deliveryMinutes,
} from "../../lib/deliveryTiming";
import { formatAssignmentTime } from "../../lib/assignmentTime";

type Data = Awaited<ReturnType<typeof getTeamOversight>>;

export default function TeamPC() {
  const { profile } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [coordinator, setCoordinator] = useState("");
  const [month, setMonth] = useState(indiaMonth(new Date().toISOString())!);
  const [editor, setEditor] = useState("");
  const [team, setTeam] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError("");
    getTeamOversight()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.id, profile?.team_id, profile?.role, revision]);

  if (!oversightRoles.includes(profile?.role ?? ""))
    return (
      <p role="alert">Team PC is available to leads and associate leads.</p>
    );

  const selectedCoordinator = data?.coordinators.some(
    (p) => p.id === coordinator,
  )
    ? coordinator
    : "";

  const visibleCoordinators =
    data?.coordinators.filter(
      (p) => !selectedCoordinator || p.id === selectedCoordinator,
    ) ?? [];

  const members =
    data?.teamMembers.filter(
      (e) => !team || (team === "unassigned" ? !e.team_id : e.team_id === team),
    ) ?? [];

  const selectedAssignments =
    data?.teamAssignments.filter(
      (a) =>
        members.some((e) => e.id === a.employee_id) &&
        (!editor || a.employee_id === editor),
    ) ?? [];

  const totals = monthlyTiming(
    selectedAssignments as Parameters<typeof monthlyTiming>[0],
    month,
  );

  const details =
    selectedAssignments.filter(
      (a) => indiaMonth(a.deadline_at ?? a.completed_at) === month,
    ) ?? [];

  const untracked =
    selectedAssignments.filter((a) => !a.deadline_at && !a.completed_at)
      .length ?? 0;

  const totalCompleted = totals.reduce((acc, t) => acc + t.completed, 0);
  const totalNetMinutes = totals.reduce((acc, t) => acc + t.netMinutes, 0);
  const totalPending = totals.reduce((acc, t) => acc + t.pending, 0);
  const totalOverdue = totals.reduce((acc, t) => acc + t.overdue, 0);

  return (
    <div className="team-pc space-y-6">
      {/* ===================================================
          PAGE HEADER
      =================================================== */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="pc-eyebrow inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-amber-800 dark:text-amber-400">
            <ShieldCheck className="h-3 w-3" />
            TEAM OVERSIGHT
          </span>
          <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">Team PC</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Coordinator activity and delivery timing across every team.
          </p>
        </div>

        <button
          disabled={loading}
          onClick={() => setRevision((v) => v + 1)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </header>

      {loading ? (
        <p role="status">Loading team activity…</p>
      ) : error ? (
        <p role="alert" className="rounded-xl bg-yellow-50 p-4">
          {error}
        </p>
      ) : (
        data && (
          <>
            {/* ===================================================
                EXECUTIVE STATS SUMMARY
            =================================================== */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Coordinators</span>
                  <Users className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {data.coordinators.length}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {visibleCoordinators.length} active in view
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Deliveries Completed</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {totalCompleted}
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                  Month of {month}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Net Punctuality</span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <p
                  className={`mt-2 text-2xl font-bold tracking-tight ${
                    totalNetMinutes > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : totalNetMinutes < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-900 dark:text-white"
                  }`}
                >
                  {durationMinutes(Math.abs(totalNetMinutes))}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {totalNetMinutes > 0
                    ? "Net delay across squad"
                    : totalNetMinutes < 0
                      ? "Ahead of scheduled deadlines"
                      : "Balanced on-time pacing"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-medium">Overdue / Pending</span>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                  {totalOverdue}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    / {totalPending}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Requires coordinator check
                </p>
              </div>
            </div>

            {/* ===================================================
                PROJECT COORDINATORS SECTION
            =================================================== */}
            <section className="pc-coordinators">
              <div className="pc-coordinator-toolbar">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold">Project coordinators</h2>
                </div>
                <label>
                  Coordinator
                  <select
                    value={selectedCoordinator}
                    onChange={(e) => setCoordinator(e.target.value)}
                  >
                    <option value="">All coordinators</option>
                    {data.coordinators.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name || "Name unavailable"} ·{" "}
                        {p.role.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="pc-directory-help">
                Active coordinator accounts and Flow Force supervisors appear
                automatically from their role and team.
              </p>

              {!data.coordinators.length ? (
                <div className="pc-empty">
                  <span className="pc-empty-symbol">◇</span>
                  <h3>No coordinators linked yet</h3>
                  <p>
                    No project coordinators are linked to your team. Ask an
                    administrator to check team membership.
                  </p>
                </div>
              ) : (
                visibleCoordinators.map((pc) => {
                  const assignments = data.assignments.filter(
                    (a) => a.assigned_by === pc.id,
                  );
                  return (
                    <article key={pc.id} className="pc-coordinator-card">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 font-bold text-amber-900 dark:text-amber-300 text-xs">
                            {pc.full_name ? pc.full_name.charAt(0).toUpperCase() : "P"}
                          </span>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {pc.full_name || "Name unavailable"}
                            {!pc.is_active ? " · Inactive" : ""}
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                          {pc.role.replaceAll("_", " ")}
                        </span>
                      </div>

                      <div className="my-3 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Briefcase className="h-3 w-3 text-slate-400" />
                          {data.clients.filter((c) => c.created_by === pc.id).length} clients created
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <FolderKanban className="h-3 w-3 text-slate-400" />
                          {
                            data.projects.filter(
                              (p) =>
                                p.created_by === pc.id ||
                                p.project_members?.some(
                                  (m: { profile_id: string }) =>
                                    m.profile_id === pc.id,
                                ),
                            ).length
                          } projects owned/shared
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <CheckSquare className="h-3 w-3 text-slate-400" />
                          {data.createdTasks.filter((t) => t.created_by === pc.id).length} tasks created
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                          {assignments.length} assignments made
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {assignments.filter((a) => a.status === "completed").length} completed
                        </span>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                          View activity and assignment details
                        </summary>
                        <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                          {data.clients
                            .filter((c) => c.created_by === pc.id)
                            .map((c) => (
                              <li key={c.id} className="text-slate-600 dark:text-slate-300">
                                Client: <strong>{c.name}</strong> ·{" "}
                                {formatAssignmentTime(c.created_at)}
                              </li>
                            ))}
                          {data.projects
                            .filter(
                              (p) =>
                                p.created_by === pc.id ||
                                p.project_members?.some(
                                  (m: { profile_id: string }) =>
                                    m.profile_id === pc.id,
                                ),
                            )
                            .map((p) => (
                              <li key={p.id} className="text-slate-600 dark:text-slate-300">
                                Project: <strong>{p.name}</strong> ·{" "}
                                <span className="capitalize">{p.status}</span> ·{" "}
                                {formatAssignmentTime(p.created_at)}
                              </li>
                            ))}
                          {data.createdTasks
                            .filter((t) => t.created_by === pc.id)
                            .map((t) => (
                              <li key={t.id} className="text-slate-600 dark:text-slate-300">
                                Task created: <strong>{t.title}</strong> ·{" "}
                                <span className="capitalize">{t.status}</span> ·{" "}
                                {formatAssignmentTime(t.created_at)}
                              </li>
                            ))}
                          {assignments.map((a) => (
                            <li key={a.id} className="text-slate-600 dark:text-slate-300">
                              <strong>
                                {data.tasks.find((t) => t.id === a.task_id)
                                  ?.title || "Task unavailable"}
                              </strong>{" "}
                              →{" "}
                              {data.employees.find(
                                (e) => e.id === a.employee_id,
                              )?.full_name ||
                                "Employee ID: " + a.employee_id}{" "}
                              ·{" "}
                              <span className="capitalize">{a.status}</span> · Assigned{" "}
                              {formatAssignmentTime(a.assigned_at)} · Due{" "}
                              {formatAssignmentTime(a.deadline_at)} · Completed{" "}
                              {formatAssignmentTime(a.completed_at)}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </article>
                  );
                })
              )}
            </section>

            {/* ===================================================
                MONTHLY TIMING SECTION
            =================================================== */}
            <section className="pc-timing">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold">
                    All teams · Monthly timing
                  </h2>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Deadline month (IST)
                  <input
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-2xs outline-none focus:border-amber-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                </label>
              </div>

              <details className="pc-explainer mt-4">
                <summary>How monthly timing is calculated</summary>
                <p>
                  Net delay = minutes late − minutes early, per employee.
                  Completion is the employee’s submission time, not final client
                  approval. Pending work is shown separately and does not earn
                  an early-time offset. Deadline snapshots keep later task edits
                  from changing historical totals.
                </p>
              </details>

              {untracked > 0 && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <strong>{untracked} assignments</strong> have no recorded deadline or
                  completion and cannot be placed in a month.
                </div>
              )}

              {/* FILTER BAR ABOVE TABLE */}
              <div className="pc-team-filters">
                <label>
                  Team{" "}
                  <select
                    value={team}
                    onChange={(e) => {
                      setTeam(e.target.value);
                      setEditor("");
                    }}
                  >
                    <option value="">All teams</option>
                    {data.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                    <option value="unassigned">No team assigned</option>
                  </select>
                </label>
                <label className="pc-editor-filter">
                  Employee{" "}
                  <select
                    value={editor}
                    onChange={(e) => setEditor(e.target.value)}
                  >
                    <option value="">All employees</option>
                    {members.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.full_name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="pc-table-wrap">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead>
                    <tr>
                      {[
                        "Employee / team",
                        "Completed",
                        "Late",
                        "Early",
                        "Net timing",
                        "Pending / overdue",
                        "Missing timestamps",
                      ].map((h) => (
                        <th key={h} className="border-b p-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {totals.map((t) => {
                      const isAhead = t.netMinutes < 0;
                      const isLate = t.netMinutes > 0;
                      return (
                        <tr key={t.employee_id}>
                          <td className="p-3">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {data.teamMembers.find((e) => e.id === t.employee_id)
                                ?.full_name || "Employee unavailable"}
                            </span>
                            <small className="pc-team-name">
                              {data.teams.find(
                                (team) =>
                                  team.id ===
                                  data.teamMembers.find(
                                    (e) => e.id === t.employee_id,
                                  )?.team_id,
                              )?.name || "No team assigned"}
                            </small>
                          </td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            {t.completed}
                          </td>
                          <td className="p-3 text-red-600 dark:text-red-400 font-medium">
                            {durationMinutes(t.lateMinutes)}
                          </td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">
                            {durationMinutes(t.earlyMinutes)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                                isLate
                                  ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                  : isAhead
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {durationMinutes(t.netMinutes)}{" "}
                              {isLate
                                ? "late"
                                : isAhead
                                  ? "ahead"
                                  : "balanced"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {t.pending} /{" "}
                            <span className={t.overdue > 0 ? "font-bold text-red-600 dark:text-red-400" : ""}>
                              {t.overdue}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">
                            {t.missing}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!totals.length && (
                <div className="pc-empty">
                  <span className="pc-empty-symbol">◷</span>
                  <h3>No scheduled deliveries</h3>
                  <p>
                    No scheduled team work for this month. Assignments with
                    deadlines will appear here.
                  </p>
                </div>
              )}

              <div className="pc-assignment-list">
                {details.map((a) => {
                  const delta =
                    a.status === "completed"
                      ? deliveryMinutes(a.deadline_at, a.completed_at)
                      : null;
                  return (
                    <article key={a.id} className="pc-assignment-card">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {data.tasks.find((t) => t.id === a.task_id)?.title ||
                          "Task unavailable"}{" "}
                        ·{" "}
                        <span className="text-slate-600 dark:text-slate-300">
                          {
                            data.teamMembers.find((e) => e.id === a.employee_id)
                              ?.full_name
                          }
                        </span>
                      </p>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Assigned by{" "}
                        <strong>
                          {data.people.find((p) => p.id === a.assigned_by)
                            ?.full_name || "Name unavailable"}
                        </strong>{" "}
                        · {formatAssignmentTime(a.assigned_at)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Deadline {formatAssignmentTime(a.deadline_at)} ·{" "}
                        Completed {formatAssignmentTime(a.completed_at)}
                      </p>
                      <p className="mt-2 text-xs">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200 capitalize">
                          {a.status}
                        </span>{" "}
                        ·{" "}
                        <span
                          className={`font-semibold ${
                            delta === null
                              ? "text-slate-400"
                              : delta > 0
                                ? "text-red-600 dark:text-red-400"
                                : delta < 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {delta === null
                            ? "Timing not calculated"
                            : durationMinutes(delta) +
                              (delta > 0
                                ? " late"
                                : delta < 0
                                  ? " early"
                                  : " on time")}
                        </span>
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )
      )}
    </div>
  );
}
