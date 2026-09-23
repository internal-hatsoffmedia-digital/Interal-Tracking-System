import { BarChart3, Calendar, Printer, RefreshCw, X } from "lucide-react";

interface ReportHeaderProps {
  startDate: string;
  endDate: string;
  loading: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onQuickPreset: (preset: "all" | "month" | "last30" | "quarter") => void;
  onRefresh: () => void;
}

export default function ReportHeader({
  startDate,
  endDate,
  loading,
  onStartDateChange,
  onEndDateChange,
  onQuickPreset,
  onRefresh,
}: ReportHeaderProps) {
  const handlePrint = () => {
    window.print();
  };

  const hasActiveDateFilter = Boolean(startDate || endDate);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between print:hidden">
      {/* TITLE & BRAND BADGE */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 text-amber-400 shadow-md ring-1 ring-white/10">
            <BarChart3 size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600">
              Studio Intelligence
            </span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Real-time Analytics</span>
          </div>
        </div>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Executive Reports & Insights
        </h1>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
          Comprehensive breakdown of task completion, team workload, project health, and logged hours across the organization.
        </p>
      </div>

      {/* CONTROLS & DATE FILTERS */}
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {/* QUICK PRESETS */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          <button
            type="button"
            onClick={() => onQuickPreset("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              !startDate && !endDate
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => onQuickPreset("month")}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => onQuickPreset("last30")}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            30 Days
          </button>
          <button
            type="button"
            onClick={() => onQuickPreset("quarter")}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Quarter
          </button>
        </div>

        {/* DATE INPUTS */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              aria-label="Start date"
            />
          </div>
          <span className="text-xs text-slate-400">to</span>
          <div className="relative">
            <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              aria-label="End date"
            />
          </div>

          {hasActiveDateFilter && (
            <button
              type="button"
              onClick={() => onQuickPreset("all")}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Clear date filter"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-indigo-600" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
            title="Print or export report"
          >
            <Printer size={14} />
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
}
