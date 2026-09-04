import { ArrowUpRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  if (hour < 21) {
    return "Good evening";
  }

  return "Good night";
}

function DashboardHeader() {
  const navigate = useNavigate();

  const { profile, loading } = useAuth();

  const displayName =
    profile?.full_name?.trim() || "there";

  const greeting = getGreeting();

  return (
    <section className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      
      {/* =========================================
          HEADER CONTENT
      ========================================== */}

      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
          <span>Workspace</span>

          <span>/</span>

          <span className="text-slate-600">
            Dashboard
          </span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {loading
            ? "Welcome back."
            : `${greeting}, ${displayName}.`}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what&apos;s happening across
          production today.
        </p>
      </div>


      {/* =========================================
          ACTIONS
      ========================================== */}

      <div className="flex items-center gap-3">

        <button
          type="button"
          onClick={() => navigate("/reports")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          View Reports

          <ArrowUpRight size={15} />
        </button>


        <button
          type="button"
          onClick={() => navigate("/tasks")}
          className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
        >
          <Zap size={16} />

          Quick Action
        </button>

      </div>

    </section>
  );
}

export default DashboardHeader;