import {
  ArrowRight,
  Copy,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

interface ClientPortfolioCard {
  id: string;
  name: string;
  shortName: string;
  industry: string;
  totalTasks: number;
  inProgress: number;
  inReview: number;
  completed: number;
  onHold: number;
  health: "healthy" | "attention" | "warning";
  healthLabel: string;
}

export default function ClientAccountRadar() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientPortfolioCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadClientData() {
      try {
        setLoading(true);
        const [clientsRes, tasksRes] = await Promise.all([
          supabase.from("clients").select("id, name, short_name, industry, is_active"),
          supabase.from("tasks").select("id, client_id, status"),
        ]);

        const clientList = clientsRes.data ?? [];
        const taskList = tasksRes.data ?? [];

        const portfolio: ClientPortfolioCard[] = clientList
          .filter((c) => c.is_active !== false)
          .map((c) => {
            const clientTasks = taskList.filter((t) => t.client_id === c.id);
            let inProgress = 0;
            let inReview = 0;
            let completed = 0;
            let onHold = 0;

            clientTasks.forEach((t) => {
              const s = (t.status || "").toLowerCase();
              if (s.includes("progress") || s.includes("editing") || s.includes("footage")) {
                inProgress++;
              } else if (s.includes("review")) {
                inReview++;
              } else if (s.includes("delivered") || s.includes("completed")) {
                completed++;
              } else if (s.includes("hold") || s.includes("blocked")) {
                onHold++;
              }
            });

            let health: "healthy" | "attention" | "warning" = "healthy";
            let healthLabel = "On Schedule";

            if (onHold > 0) {
              health = "warning";
              healthLabel = `${onHold} Delayed/Blocked`;
            } else if (inReview > 0) {
              health = "attention";
              healthLabel = `${inReview} In Client Review`;
            } else if (clientTasks.length === 0) {
              healthLabel = "No Active Tasks";
            }

            return {
              id: c.id,
              name: c.name,
              shortName: c.short_name || c.name.slice(0, 3).toUpperCase(),
              industry: c.industry || "Media & Brand",
              totalTasks: clientTasks.length,
              inProgress,
              inReview,
              completed,
              onHold,
              health,
              healthLabel,
            };
          })
          // Sort by active workload (tasks in progress + review first)
          .sort((a, b) => b.inProgress + b.inReview - (a.inProgress + a.inReview))
          .slice(0, 6);

        setClients(portfolio);
      } catch (err) {
        console.error("Failed to load client radar:", err);
      } finally {
        setLoading(false);
      }
    }

    loadClientData();

    const channel = supabase
      .channel("client-radar-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          loadClientData();
        }
      )
      .subscribe();

    const pollInterval = setInterval(loadClientData, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  const handleCopyClientStatus = (c: ClientPortfolioCard) => {
    const text = `📋 *Hatsoff Media — Production Status for ${c.name}*
────────────────────────────
🎬 *In Active Production*: ${c.inProgress}
👀 *Awaiting Your Feedback*: ${c.inReview}
✅ *Approved & Delivered*: ${c.completed}
📌 *Total Deliverables*: ${c.totalTasks}
Status: ${c.healthLabel}
`;
    navigator.clipboard.writeText(text);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              VIP Client Account Radar
            </h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100 flex items-center gap-1">
              <ShieldCheck size={12} />
              Executive Account Health
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time deliverable tracking & client happiness metrics across high-value accounts
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/clients")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          View All Accounts
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-5"
            />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
          No client accounts found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => {
            const completionRate =
              c.totalTasks > 0 ? Math.round((c.completed / c.totalTasks) * 100) : 0;

            const isCopied = copiedId === c.id;

            return (
              <div
                key={c.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                {/* Top: Avatar & Name + Health Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-sm font-black text-white shadow-sm">
                        {getInitials(c.name)}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition">
                          {c.name}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-400">
                          {c.industry}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        c.health === "warning"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : c.health === "attention"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {c.healthLabel}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-100/70 p-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">Editing</span>
                      <span className="font-bold text-slate-800 text-sm">{c.inProgress}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">Review</span>
                      <span className="font-bold text-amber-600 text-sm">{c.inReview}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">Done</span>
                      <span className="font-bold text-emerald-600 text-sm">{c.completed}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Deliverable Fulfillment</span>
                      <span className="font-bold text-slate-700">{completionRate}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleCopyClientStatus(c)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 transition"
                    title="Copy formatted status digest for WhatsApp or email"
                  >
                    <Copy size={12} />
                    {isCopied ? "Copied Digest!" : "Client Digest"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/clients`)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    Account File
                    <ExternalLink size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
