import {
  Activity,
  CheckCircle2,
  Clock3,
  Target,
  TrendingUp,
  Users,
  XCircle,
  AlertTriangle,
} from "lucide-react";

import type { PerformanceDashboardSummary } from "../../types/performance";

interface PerformanceStatsProps {
  summary: PerformanceDashboardSummary;
  loading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  badge?: string;
  badgeClassName?: string;
}

function StatCard({
  label,
  value,
  icon,
  description,
  badge,
  badgeClassName,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}

          {badge && (
            <span
              className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClassName ?? ""}`}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="animate-pulse">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export default function PerformanceStats({
  summary,
  loading = false,
}: PerformanceStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>
    );
  }

  const completionRate = Math.round(summary.completionRate || 0);
  const averageTaskHours = Number(summary.averageTaskHours || 0).toFixed(1);
  const totalHours = Number(summary.totalHours || 0).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Main Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Employees"
          value={summary.totalEmployees}
          description="Employees with tracked performance"
          icon={<Users className="h-5 w-5" />}
        />

        <StatCard
          label="Total Tasks"
          value={summary.totalTasks}
          description="Tasks included in performance"
          icon={<Target className="h-5 w-5" />}
        />

        <StatCard
          label="Completed Tasks"
          value={summary.completedTasks}
          description="Successfully completed"
          icon={<CheckCircle2 className="h-5 w-5" />}
          badge={`${completionRate}% completion`}
          badgeClassName="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          label="Delayed Tasks"
          value={summary.delayedTasks}
          description="Tasks currently delayed"
          icon={<AlertTriangle className="h-5 w-5" />}
          badge={
            summary.delayedTasks > 0
              ? "Needs attention"
              : "No delays"
          }
          badgeClassName={
            summary.delayedTasks > 0
              ? "bg-orange-50 text-orange-700"
              : "bg-emerald-50 text-emerald-700"
          }
        />
      </div>

      {/* Productivity Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Hours"
          value={`${totalHours}h`}
          description="Total tracked working hours"
          icon={<Clock3 className="h-5 w-5" />}
        />

        <StatCard
          label="Average Task Hours"
          value={`${averageTaskHours}h`}
          description="Average time per task"
          icon={<Activity className="h-5 w-5" />}
        />

        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          description="Completed vs total tasks"
          icon={<TrendingUp className="h-5 w-5" />}
          badge={
            completionRate >= 80
              ? "Excellent"
              : completionRate >= 50
                ? "On Track"
                : "Needs Improvement"
          }
          badgeClassName={
            completionRate >= 80
              ? "bg-emerald-50 text-emerald-700"
              : completionRate >= 50
                ? "bg-orange-50 text-orange-700"
                : "bg-red-50 text-red-700"
          }
        />

        <StatCard
          label="Performance Alerts"
          value={summary.redCount + summary.orangeCount}
          description="Employees needing attention"
          icon={<XCircle className="h-5 w-5" />}
          badge={`${summary.greenCount} performing well`}
          badgeClassName="bg-emerald-50 text-emerald-700"
        />
      </div>

      {/* Performance Distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Performance Distribution
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Current employee performance overview
            </p>
          </div>

          <Activity className="h-5 w-5 text-slate-400" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Green */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-800">
                GREEN
              </span>

              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>

            <p className="mt-2 text-2xl font-bold text-emerald-900">
              {summary.greenCount}
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              Performing well
            </p>
          </div>

          {/* Orange */}
          <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-800">
                ORANGE
              </span>

              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>

            <p className="mt-2 text-2xl font-bold text-orange-900">
              {summary.orangeCount}
            </p>

            <p className="mt-1 text-xs text-orange-700">
              Needs monitoring
            </p>
          </div>

          {/* Red */}
          <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-800">
                RED
              </span>

              <XCircle className="h-5 w-5 text-red-600" />
            </div>

            <p className="mt-2 text-2xl font-bold text-red-900">
              {summary.redCount}
            </p>

            <p className="mt-1 text-xs text-red-700">
              Requires attention
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}