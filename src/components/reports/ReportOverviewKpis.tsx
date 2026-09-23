import { AlertTriangle, CheckCircle2, Clock, FolderKanban, Target, TrendingUp } from "lucide-react";

interface OverviewMetrics {
  totalTasks: number;
  completed: number;
  delayed: number;
  totalHours: number;
  activeProjects: number;
  completionRate: number;
}

interface ReportOverviewKpisProps {
  metrics: OverviewMetrics;
}

export default function ReportOverviewKpis({ metrics }: ReportOverviewKpisProps) {

  return (
    <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* 1. TOTAL TASKS */}
      <div className="group relative min-w-0 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Tasks</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <Target size={17} />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{metrics.totalTasks}</p>
        <div className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-slate-500">
          <span>Active task scope</span>
        </div>
      </div>

      {/* 2. COMPLETION RATE */}
      <div className="group relative min-w-0 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-emerald-50/20 to-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completion Rate</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <TrendingUp size={17} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-3xl font-bold tracking-tight text-emerald-700">
            {metrics.completionRate.toFixed(0)}%
          </p>
        </div>
        {/* Progress micro-bar */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(100, metrics.completionRate)}%` }}
          />
        </div>
      </div>

      {/* 3. COMPLETED TASKS */}
      <div className="group relative min-w-0 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-emerald-50/20 to-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
            <CheckCircle2 size={17} />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-600">{metrics.completed}</p>
        <p className="mt-2.5 text-[11px] text-slate-500">Tasks delivered successfully</p>
      </div>

      {/* 4. DELAYED TASKS */}
      <div className="group relative min-w-0 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-rose-50/30 to-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Delayed</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white shadow-xs">
            <AlertTriangle size={17} />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-rose-600">{metrics.delayed}</p>
        <p className="mt-2.5 text-[11px] text-rose-600/80 font-medium">Overdue / Needs attention</p>
      </div>

      {/* 5. LOGGED HOURS */}
      <div className="group relative min-w-0 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-indigo-50/20 to-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Logged Hours</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Clock size={17} />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-indigo-700">
          {metrics.totalHours.toFixed(1)}
          <span className="ml-1 text-sm font-semibold text-indigo-400">h</span>
        </p>
        <p className="mt-2.5 text-[11px] text-slate-500">Timesheet logged hours</p>
      </div>

      {/* 6. ACTIVE PROJECTS */}
      <div className="group relative min-w-0 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Projects</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white shadow-xs">
            <FolderKanban size={17} />
          </div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{metrics.activeProjects}</p>
        <p className="mt-2.5 text-[11px] text-slate-500">Active client projects</p>
      </div>
    </section>
  );
}
