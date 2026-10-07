import {
  Code2,
  Film,
  Layers,
  LayoutGrid,
  List,
  Megaphone,
  Palette,
  Search,
  SlidersHorizontal,
  Target,
  Users,
  X,
} from "lucide-react";

interface TeamFiltersProps {
  search: string;
  status: "all" | "active" | "inactive";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "all" | "active" | "inactive") => void;
  department?: string;
  onDepartmentChange?: (dept: string) => void;
  viewMode?: "grid" | "table";
  onViewModeChange?: (mode: "grid" | "table") => void;
  counts?: {
    total: number;
    active: number;
    inactive: number;
  };
}

const DEPARTMENTS = [
  { id: "all", label: "All Squads", icon: Users },
  { id: "creative", label: "Creative Clan", icon: Palette },
  { id: "cut", label: "Cut Masters", icon: Film },
  { id: "flow", label: "Flow Force", icon: Layers },
  { id: "web", label: "Web Crafters", icon: Code2 },
  { id: "digital", label: "Digital Marketing", icon: Megaphone },
  { id: "sales", label: "Market Hunters", icon: Target },
];

function TeamFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
  department = "all",
  onDepartmentChange,
  viewMode = "grid",
  onViewModeChange,
  counts,
}: TeamFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Main Search and Control Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            id="search-teams"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search teams by name, type, or lead..."
            className="h-10 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-10 pr-9 text-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
          />

          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter Dropdown & View Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <div className="relative flex items-center">
            <SlidersHorizontal
              size={14}
              className="pointer-events-none absolute left-3 text-slate-400"
            />
            <select
              value={status}
              onChange={(event) =>
                onStatusChange(event.target.value as "all" | "active" | "inactive")
              }
              className="h-10 rounded-xl border border-slate-200/80 bg-slate-50/50 pl-8 pr-7 text-xs font-semibold text-slate-700 outline-none transition hover:bg-slate-100/60 focus:bg-white focus:border-slate-900"
            >
              <option value="all">
                All teams {counts ? `(${counts.total})` : ""}
              </option>
              <option value="active">
                Active {counts ? `(${counts.active})` : ""}
              </option>
              <option value="inactive">
                Inactive {counts ? `(${counts.inactive})` : ""}
              </option>
            </select>
          </div>

          {/* View Mode Switcher (Grid vs Table) */}
          {onViewModeChange && (
            <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-100/70 p-1">
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("table")}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Table view"
                aria-pressed={viewMode === "table"}
              >
                <List size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Category Filter Pills */}
      {onDepartmentChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            const isSelected = department === dept.id;

            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => onDepartmentChange(dept.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Icon size={12} className={isSelected ? "text-amber-400" : "text-slate-400"} />
                <span>{dept.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TeamFilters;