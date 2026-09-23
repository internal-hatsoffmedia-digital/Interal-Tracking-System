import { FolderKanban } from "lucide-react";

/* ============================================================
   REUSABLE REPORT CARD CONTAINER
============================================================ */

export function ReportCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: typeof FolderKanban;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Icon size={17} />
            </div>
          )}
          <div>
            <h2 className="text-base font-bold text-slate-950">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

export function EmptyReportState({ message = "No data available for the selected filters." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FolderKanban size={24} />
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-600">{message}</p>
    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

export function ReportStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();

  if (s.includes("green") || s.includes("completed") || s.includes("delivered") || s.includes("on_track")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {status.replaceAll("_", " ")}
      </span>
    );
  }

  if (s.includes("orange") || s.includes("at_risk") || s.includes("in_progress") || s.includes("pending") || s.includes("review")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        {status.replaceAll("_", " ")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      {status.replaceAll("_", " ")}
    </span>
  );
}

/* ============================================================
   EMPLOYEE TASK TABLE
============================================================ */

export interface EmployeeTaskRow {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  total_tasks: number;
  completed_tasks: number;
  delayed_tasks: number;
  estimated_hours: number;
  actual_hours: number;
  completion_rate: number;
}

export function EmployeeTaskTable({ rows }: { rows: EmployeeTaskRow[] }) {
  if (rows.length === 0) return <EmptyReportState />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-900 text-slate-200 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 rounded-l-xl">Employee</th>
            <th className="px-4 py-3 text-center">Total Tasks</th>
            <th className="px-4 py-3 text-center">Completed</th>
            <th className="px-4 py-3 text-center">Delayed</th>
            <th className="px-4 py-3 text-center">Est. Hours</th>
            <th className="px-4 py-3 text-center">Actual Hours</th>
            <th className="px-4 py-3 text-right rounded-r-xl">Completion %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.employee_id} className="transition hover:bg-indigo-50/30">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-xs">
                    {row.employee_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-950">{row.employee_name}</p>
                    <p className="font-mono text-[10px] text-slate-400">{row.employee_code}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5 text-center font-bold text-slate-900">{row.total_tasks}</td>
              <td className="px-4 py-3.5 text-center font-bold text-emerald-600">{row.completed_tasks}</td>
              <td className="px-4 py-3.5 text-center font-bold text-rose-600">{row.delayed_tasks}</td>
              <td className="px-4 py-3.5 text-center text-slate-600">{row.estimated_hours.toFixed(1)}h</td>
              <td className="px-4 py-3.5 text-center font-semibold text-indigo-700">{row.actual_hours.toFixed(1)}h</td>
              <td className="px-4 py-3.5 text-right">
                <div className="inline-flex items-center gap-2">
                  <span className="font-bold text-slate-900">{row.completion_rate.toFixed(0)}%</span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, row.completion_rate)}%` }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   PROJECT REPORT TABLE
============================================================ */

export interface ProjectReportRow {
  id: string;
  name: string;
  clientName: string;
  total_assets_required: number;
  completed_assets: number;
  completion: number;
  health: string;
  status: string;
  delayed: boolean;
  hours: number;
}

export function ProjectReportTable({ rows }: { rows: ProjectReportRow[] }) {
  if (rows.length === 0) return <EmptyReportState />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-900 text-slate-200 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 rounded-l-xl">Project & Client</th>
            <th className="px-4 py-3 text-center">Assets (Done / Total)</th>
            <th className="px-4 py-3 text-center">Logged Hours</th>
            <th className="px-4 py-3 text-center">Health</th>
            <th className="px-4 py-3 text-right rounded-r-xl">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.id} className="transition hover:bg-indigo-50/30">
              <td className="px-4 py-3.5">
                <div>
                  <p className="font-bold text-slate-950">{row.name}</p>
                  <p className="text-[11px] text-slate-500">{row.clientName}</p>
                </div>
              </td>
              <td className="px-4 py-3.5 text-center font-medium text-slate-800">
                <span className="font-bold text-emerald-600">{row.completed_assets}</span> / {row.total_assets_required}
              </td>
              <td className="px-4 py-3.5 text-center font-semibold text-indigo-700">{row.hours.toFixed(1)}h</td>
              <td className="px-4 py-3.5 text-center">
                <ReportStatusBadge status={row.health || row.status || "on_track"} />
              </td>
              <td className="px-4 py-3.5 text-right">
                <div className="inline-flex items-center gap-2">
                  <span className="font-bold text-slate-900">{row.completion.toFixed(0)}%</span>
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{ width: `${Math.min(100, row.completion)}%` }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   WORKLOAD TABLE WITH UTILIZATION METERS
============================================================ */

export interface WorkloadRow {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  active_tasks: number;
  allocated_hours: number;
  actual_hours: number;
  utilization: number;
}

export function WorkloadTable({ rows }: { rows: WorkloadRow[] }) {
  if (rows.length === 0) return <EmptyReportState />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-900 text-slate-200 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 rounded-l-xl">Employee</th>
            <th className="px-4 py-3 text-center">Active Tasks</th>
            <th className="px-4 py-3 text-center">Allocated Hours</th>
            <th className="px-4 py-3 text-center">Actual Hours Logged</th>
            <th className="px-4 py-3 text-right rounded-r-xl">Utilization (vs 40h)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => {
            const isOverloaded = row.utilization > 100;
            const isHigh = row.utilization >= 80;

            const barColor = isOverloaded
              ? "bg-rose-500"
              : isHigh
              ? "bg-amber-500"
              : "bg-emerald-500";

            return (
              <tr key={row.employee_id} className="transition hover:bg-indigo-50/30">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-xs">
                      {row.employee_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-950">{row.employee_name}</p>
                      <p className="font-mono text-[10px] text-slate-400">{row.employee_code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center font-bold text-slate-900">{row.active_tasks}</td>
                <td className="px-4 py-3.5 text-center font-semibold text-slate-800">{row.allocated_hours.toFixed(1)}h</td>
                <td className="px-4 py-3.5 text-center font-semibold text-indigo-700">{row.actual_hours.toFixed(1)}h</td>
                <td className="px-4 py-3.5 text-right">
                  <div className="inline-flex items-center gap-3">
                    <span
                      className={`font-bold ${
                        isOverloaded ? "text-rose-600" : isHigh ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {row.utilization.toFixed(0)}%
                    </span>
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-500`}
                        style={{ width: `${Math.min(100, row.utilization)}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
