import { Activity, BarChart3, CheckCircle2, Clock3, FolderKanban, Users } from "lucide-react";

export type ReportTab = "overview" | "tasks" | "timesheets" | "projects" | "performance" | "workload";

interface ReportTabNavProps {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
  counts?: {
    tasks?: number;
    hours?: number;
    projects?: number;
  };
}

const TABS: { id: ReportTab; label: string; icon: typeof BarChart3; description: string }[] = [
  { id: "overview", label: "Executive Overview", icon: BarChart3, description: "High-level summary" },
  { id: "tasks", label: "Task Analytics", icon: CheckCircle2, description: "Status & priorities" },
  { id: "timesheets", label: "Hours & Timesheets", icon: Clock3, description: "Logged employee hours" },
  { id: "projects", label: "Project Health", icon: FolderKanban, description: "Deliverables & deadlines" },
  { id: "performance", label: "Performance Matrix", icon: Activity, description: "Employee status scores" },
  { id: "workload", label: "Team Workload", icon: Users, description: "Capacity & allocation" },
];

export default function ReportTabNav({ activeTab, onTabChange }: ReportTabNavProps) {
  return (
    <div className="min-w-0 print:hidden">
      <div className="flex w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-900 p-1.5 shadow-xl scrollbar-none">
        <div className="flex min-w-full items-center gap-1.5 sm:min-w-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white text-slate-950 shadow-md ring-1 ring-black/5"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-slate-950 text-amber-400"
                      : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  <Icon size={15} />
                </div>
                <div className="text-left">
                  <span className="block leading-tight">{tab.label}</span>
                  <span
                    className={`block text-[10px] font-normal transition-colors ${
                      isActive ? "text-slate-500" : "text-slate-500 group-hover:text-slate-400"
                    }`}
                  >
                    {tab.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
