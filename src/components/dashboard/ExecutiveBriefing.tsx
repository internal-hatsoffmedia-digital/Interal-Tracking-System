import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Copy,
  Gauge,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

interface ExecutiveBriefingProps {
  viewMode: "executive" | "operations";
  onToggleViewMode: (mode: "executive" | "operations") => void;
}

export default function ExecutiveBriefing({
  viewMode,
  onToggleViewMode,
}: ExecutiveBriefingProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    inProgress: 0,
    internalReview: 0,
    clientReview: 0,
    deliveredThisWeek: 0,
    onHold: 0,
    activeProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  // Live time ticker
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(now)
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  const loadQuickStats = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([
        supabase.from("tasks").select("id, status, created_at, due_date"),
        supabase.from("projects").select("id, status"),
      ]);

      const tasks = tasksRes.data ?? [];
      const projects = projectsRes.data ?? [];

      let inProgress = 0;
      let internalReview = 0;
      let clientReview = 0;
      let delivered = 0;
      let onHold = 0;

      tasks.forEach((t) => {
        const s = (t.status || "").toLowerCase();
        if (s.includes("progress") || s.includes("editing")) inProgress++;
        if (s.includes("internal_review") || s.includes("sent_for_internal_review")) internalReview++;
        if (s.includes("client_review") || s.includes("sent_for_client_review")) clientReview++;
        if (s.includes("delivered") || s.includes("completed")) delivered++;
        if (s.includes("hold") || s.includes("blocked")) onHold++;
      });

      setStats({
        totalTasks: tasks.length,
        inProgress,
        internalReview,
        clientReview,
        deliveredThisWeek: delivered,
        onHold,
        activeProjects: projects.filter((p) => p.status !== "completed").length,
      });
    } catch (err) {
      console.error("Failed to load executive briefing stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuickStats();

    // Realtime subscription on tasks and task_assignments so completed work reflects live
    const channel = supabase
      .channel("executive-briefing-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          loadQuickStats();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_assignments" },
        () => {
          loadQuickStats();
        }
      )
      .subscribe();

    const pollInterval = setInterval(loadQuickStats, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  const handleCopyDigest = () => {
    const roleText =
      profile?.role === "project_coordinator"
        ? "Project Coordinator"
        : "Executive Studio";

    const text = `📊 *Hatsoff Media — ${roleText} Briefing*
📅 ${currentTime || "Today"}
────────────────────────────
⚡ *Active Projects in Flight*: ${stats.activeProjects}
🎬 *In Creative Production*: ${stats.inProgress}
🔍 *Ready for Coordinator Review*: ${stats.internalReview}
👀 *Awaiting Client Approval*: ${stats.clientReview}
✅ *Approved & Delivered*: ${stats.deliveredThisWeek}
⏸️ *On Hold / Blockers*: ${stats.onHold}
────────────────────────────
*Studio Velocity*: ${stats.onHold === 0 ? "🟢 Optimal (Zero Blockers)" : "🟡 Attention Needed"}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const displayName = profile?.full_name?.split(" ")[0] || "Leader";
  const userRole = profile?.role;
  const isCoordinator = userRole === "project_coordinator";
  const isAdmin = userRole === "admin";

  const roleTitle = isCoordinator
    ? "Project Coordinator"
    : isAdmin
    ? "Studio Administrator / CEO"
    : "Team Lead";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl transition-all duration-300 md:p-8">
      {/* Background Decorative Mesh & Glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />

      {/* Top Bar: Live Status & View Switcher */}
      <div className="relative z-10 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
        {/* Left: Studio Live Pulse + Role Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/20 backdrop-blur-md">
            <Activity size={12} className="text-emerald-400" />
            Live Sync Active
          </span>

          <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
            <UserCheck size={12} className="text-indigo-400" />
            {roleTitle}
          </span>

          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Clock3 size={13} />
            {currentTime || "Synchronizing..."}
          </span>
        </div>

        {/* Right: Mode Toggle Switcher */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => onToggleViewMode("executive")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                viewMode === "executive"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Gauge size={13} />
              Executive Cockpit
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode("operations")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                viewMode === "operations"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap size={13} />
              Operations Flow
            </button>
          </div>
        </div>
      </div>

      {/* Main Hero Header */}
      <div className="relative z-10 mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
        {/* Left 7 cols: Greeting & Intelligence Diagnosis */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-indigo-300 mb-2">
            <Sparkles size={14} className="text-indigo-400 animate-pulse" />
            {isCoordinator ? "Coordinator Mission Control" : "Executive Command Suite"}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            Welcome, {displayName}.
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-300 max-w-2xl">
            {stats.internalReview > 0 ? (
              <>
                <strong className="text-fuchsia-400 font-semibold">
                  {stats.internalReview} deliverable(s) completed by employees
                </strong>{" "}
                and waiting for coordinator review.{" "}
                {stats.clientReview} deliverable(s) in client approval gate.
              </>
            ) : stats.onHold === 0 ? (
              <>
                <strong className="text-emerald-400 font-semibold">
                  Studio velocity is optimal.
                </strong>{" "}
                All tracks pacing smoothly with zero blockers. Currently managing{" "}
                <span className="font-semibold text-white">
                  {stats.inProgress} active deliverables
                </span>{" "}
                and{" "}
                <span className="font-semibold text-white">
                  {stats.clientReview} in client approval
                </span>
                .
              </>
            ) : (
              <>
                <strong className="text-amber-400 font-semibold">
                  Studio active with {stats.onHold} item requiring attention.
                </strong>{" "}
                {stats.clientReview} deliverables currently awaiting client sign-off.
              </>
            )}
          </p>

          {/* Quick Action Pills */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopyDigest}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-200 active:scale-95"
            >
              <Copy size={13} className="text-indigo-300" />
              {copied ? "Copied Studio Digest!" : "Copy Status Digest"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/tasks?status=internal_review")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-fuchsia-200 hover:bg-white/20 transition border border-fuchsia-500/30"
            >
              Review Completed Tasks ({stats.internalReview})
              <ArrowUpRight size={13} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/reports")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-transparent px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              Performance Analytics
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* Right 5 cols: Executive Metric Floating Cards */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Active Production
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {loading ? "..." : stats.inProgress}
              </span>
              <span className="text-xs font-medium text-indigo-300">Editing</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Across {stats.activeProjects} active projects
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <span className="text-[11px] font-medium text-fuchsia-300 uppercase tracking-wider">
              Internal Review
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-fuchsia-400 tracking-tight">
                {loading ? "..." : stats.internalReview}
              </span>
              <span className="text-xs font-medium text-slate-300">Ready</span>
            </div>
            <div className="mt-2 text-[11px] text-fuchsia-300/80 font-medium">
              Awaiting coordinator QA
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <span className="text-[11px] font-medium text-amber-300 uppercase tracking-wider">
              Client Review Gate
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400 tracking-tight">
                {loading ? "..." : stats.clientReview}
              </span>
              <span className="text-xs font-medium text-slate-300">In Feedback</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-300/80 font-medium">
              Awaiting client approval
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <span className="text-[11px] font-medium text-emerald-300 uppercase tracking-wider">
              Delivered
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                {loading ? "..." : stats.deliveredThisWeek}
              </span>
              <CheckCircle2 size={15} className="text-emerald-400" />
            </div>
            <div className="mt-2 text-[11px] text-emerald-300/80 font-medium">
              Approved & delivered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
