import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

/* ============================================================
   TASK STATUS METERS
============================================================ */

interface StatusMeterRow {
  label: string;
  value: number;
}

export function TaskStatusMeters({ rows }: { rows: StatusMeterRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No task status data available for the selected period.
      </div>
    );
  }

  const total = rows.reduce((sum, r) => sum + r.value, 0) || 1;

  const getMeterColor = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("completed") || l.includes("delivered") || l.includes("approved")) {
      return "bg-emerald-500 text-emerald-700 bg-emerald-50 border-emerald-200";
    }
    if (l.includes("progress") || l.includes("review") || l.includes("pending")) {
      return "bg-amber-500 text-amber-700 bg-amber-50 border-amber-200";
    }
    if (l.includes("delayed") || l.includes("blocked") || l.includes("red")) {
      return "bg-rose-500 text-rose-700 bg-rose-50 border-rose-200";
    }
    return "bg-indigo-500 text-indigo-700 bg-indigo-50 border-indigo-200";
  };

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const percentage = ((row.value / total) * 100).toFixed(1);
        const colorStyle = getMeterColor(row.label);
        const barColor = colorStyle.split(" ")[0];

        return (
          <div key={row.label} className="group">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">{row.label}</span>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                  {row.value} tasks
                </span>
                <span className="text-slate-400 font-normal">{percentage}%</span>
              </div>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-500`}
                style={{ width: `${Math.min(100, (row.value / total) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   PRIORITY DISTRIBUTION CARDS
============================================================ */

interface PriorityRow {
  priority: string;
  count: number;
}

export function PriorityDistributionCards({ rows }: { rows: PriorityRow[] }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0) || 1;

  const getPriorityStyle = (priority: string) => {
    const p = priority.toLowerCase();
    if (p.includes("urgent") || p.includes("critical")) {
      return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", badge: "bg-rose-600" };
    }
    if (p.includes("high")) {
      return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-500" };
    }
    if (p.includes("medium")) {
      return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-500" };
    }
    return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", badge: "bg-slate-500" };
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {rows.map((r) => {
        const style = getPriorityStyle(r.priority);
        const pct = ((r.count / total) * 100).toFixed(0);

        return (
          <div
            key={r.priority}
            className={`rounded-xl border p-3.5 ${style.bg} ${style.border}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                {r.priority.replaceAll("_", " ")}
              </span>
              <span className={`h-2 w-2 rounded-full ${style.badge}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${style.text}`}>{r.count}</p>
            <p className="mt-0.5 text-[11px] opacity-75">{pct}% of total</p>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   PERFORMANCE SPECTRUM BAR
============================================================ */

export function PerformanceSpectrum({
  summary,
}: {
  summary: { green: number; orange: number; red: number };
}) {
  const total = summary.green + summary.orange + summary.red || 1;

  const greenPct = Math.round((summary.green / total) * 100);
  const orangePct = Math.round((summary.orange / total) * 100);
  const redPct = Math.round((summary.red / total) * 100);

  return (
    <div className="space-y-4">
      {/* 3 STAT BOXES */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={15} />
            ON TRACK
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{summary.green}</p>
          <p className="mt-0.5 text-xs font-medium text-emerald-700">{greenPct}% of employees</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <AlertCircle size={15} />
            NEEDS ATTENTION
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{summary.orange}</p>
          <p className="mt-0.5 text-xs font-medium text-amber-700">{orangePct}% of employees</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
            <ShieldAlert size={15} />
            AT RISK
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-900">{summary.red}</p>
          <p className="mt-0.5 text-xs font-medium text-rose-700">{redPct}% of employees</p>
        </div>
      </div>

      {/* MULTI-SEGMENT SPECTRUM BAR */}
      <div className="flex h-3.5 overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
        {summary.green > 0 && (
          <div
            className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(summary.green / total) * 100}%` }}
            title={`On Track: ${summary.green}`}
          />
        )}
        {summary.orange > 0 && (
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${(summary.orange / total) * 100}%` }}
            title={`Needs Attention: ${summary.orange}`}
          />
        )}
        {summary.red > 0 && (
          <div
            className="h-full rounded-r-full bg-rose-500 transition-all duration-500"
            style={{ width: `${(summary.red / total) * 100}%` }}
            title={`At Risk: ${summary.red}`}
          />
        )}
      </div>
    </div>
  );
}
