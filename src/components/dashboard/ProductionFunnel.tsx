import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Film,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

interface StageMetrics {
  key: string;
  label: string;
  subtitle: string;
  count: number;
  icon: typeof Film;
  color: string;
  bgGrad: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  taskStatus: string;
}

export default function ProductionFunnel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [stages, setStages] = useState<StageMetrics[]>([
    {
      key: "ingestion",
      label: "Ingestion & Raw Media",
      subtitle: "Footage received & queued",
      count: 0,
      icon: Film,
      color: "text-purple-600",
      bgGrad: "from-purple-500/10 to-indigo-500/5",
      borderColor: "border-purple-200 hover:border-purple-400",
      textColor: "text-purple-700",
      badgeBg: "bg-purple-100 text-purple-700",
      taskStatus: "raw_footage_received",
    },
    {
      key: "editing",
      label: "Creative Editing",
      subtitle: "Active video & sound cuts",
      count: 0,
      icon: Layers,
      color: "text-blue-600",
      bgGrad: "from-blue-500/10 to-cyan-500/5",
      borderColor: "border-blue-200 hover:border-blue-400",
      textColor: "text-blue-700",
      badgeBg: "bg-blue-100 text-blue-700",
      taskStatus: "editing_in_progress",
    },
    {
      key: "internal_qa",
      label: "Internal Quality QA",
      subtitle: "Creative director review",
      count: 0,
      icon: Sparkles,
      color: "text-fuchsia-600",
      bgGrad: "from-fuchsia-500/10 to-pink-500/5",
      borderColor: "border-fuchsia-200 hover:border-fuchsia-400",
      textColor: "text-fuchsia-700",
      badgeBg: "bg-fuchsia-100 text-fuchsia-700",
      taskStatus: "internal_review",
    },
    {
      key: "client_gate",
      label: "Client Review Gate",
      subtitle: "Awaiting stakeholder approval",
      count: 0,
      icon: Users,
      color: "text-amber-600",
      bgGrad: "from-amber-500/10 to-orange-500/5",
      borderColor: "border-amber-200 hover:border-amber-400",
      textColor: "text-amber-700",
      badgeBg: "bg-amber-100 text-amber-700",
      taskStatus: "client_review",
    },
    {
      key: "delivered",
      label: "Approved & Broadcast",
      subtitle: "Final asset delivered",
      count: 0,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgGrad: "from-emerald-500/10 to-teal-500/5",
      borderColor: "border-emerald-200 hover:border-emerald-400",
      textColor: "text-emerald-700",
      badgeBg: "bg-emerald-100 text-emerald-700",
      taskStatus: "approved_delivered",
    },
  ]);

  useEffect(() => {
    async function loadFunnelData() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("tasks")
          .select("id, status");

        if (error) throw error;
        const tasks = data ?? [];
        setTotalCount(tasks.length);

        let ingestion = 0;
        let editing = 0;
        let internalQa = 0;
        let clientGate = 0;
        let delivered = 0;

        tasks.forEach((t) => {
          const s = (t.status || "").toLowerCase();
          if (s === "not_started" || s === "in_queue" || s === "raw_footage_received") {
            ingestion++;
          } else if (s === "editing_in_progress" || s.includes("editing")) {
            editing++;
          } else if (s === "internal_review" || s === "sent_for_internal_review") {
            internalQa++;
          } else if (s === "client_review" || s === "sent_for_client_review") {
            clientGate++;
          } else if (s === "approved_delivered" || s === "approved_and_delivered" || s === "completed") {
            delivered++;
          }
        });

        setStages((prev) =>
          prev.map((stage) => {
            if (stage.key === "ingestion") return { ...stage, count: ingestion };
            if (stage.key === "editing") return { ...stage, count: editing };
            if (stage.key === "internal_qa") return { ...stage, count: internalQa };
            if (stage.key === "client_gate") return { ...stage, count: clientGate };
            if (stage.key === "delivered") return { ...stage, count: delivered };
            return stage;
          })
        );
      } catch (err) {
        console.error("Failed to load production funnel data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadFunnelData();

    const channel = supabase
      .channel("production-funnel-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          loadFunnelData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_assignments" },
        () => {
          loadFunnelData();
        }
      )
      .subscribe();

    const pollInterval = setInterval(loadFunnelData, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Agency Velocity Pipeline
            </h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              Live Asset Funnel
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time movement of media deliverables from ingestion to broadcast
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Total In Studio: <strong className="text-slate-800 font-bold">{totalCount}</strong>
          </span>
          <button
            type="button"
            onClick={() => navigate("/tasks")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            Manage Pipeline
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Funnel Pipeline Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const percentage =
            totalCount > 0 ? Math.round((stage.count / totalCount) * 100) : 0;

          return (
            <div
              key={stage.key}
              onClick={() => navigate(`/tasks?status=${stage.taskStatus}`)}
              className={`group relative flex flex-col justify-between rounded-2xl border ${stage.borderColor} bg-gradient-to-br ${stage.bgGrad} p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer`}
            >
              {/* Connector arrow on desktop */}
              {idx < stages.length - 1 && (
                <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 h-5 w-5 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-400">
                  <ArrowRight size={11} />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm ${stage.color}`}>
                    <Icon size={16} />
                  </div>

                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${stage.badgeBg}`}>
                    {percentage}%
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-2xl font-black tracking-tight text-slate-900">
                    {loading ? "..." : stage.count}
                  </div>
                  <h4 className="mt-0.5 text-xs font-bold text-slate-800 line-clamp-1">
                    {stage.label}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                    {stage.subtitle}
                  </p>
                </div>
              </div>

              {/* Mini stage status line */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Stage {idx + 1}</span>
                <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition flex items-center gap-1">
                  Inspect
                  <ArrowRight size={11} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Insight Ticker */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-2.5 border border-slate-200/70 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Clock size={14} className="text-slate-400" />
          <span>
            <strong>Bottleneck Radar:</strong>{" "}
            {stages[3].count > 0
              ? `${stages[3].count} asset(s) awaiting client sign-off. Re-nudge recommended.`
              : "No client feedback bottlenecks detected. Production cycle flowing at peak."}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/planner")}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          Open Weekly Planner ➔
        </button>
      </div>
    </div>
  );
}
