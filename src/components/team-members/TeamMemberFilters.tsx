import { Filter, Search, X } from "lucide-react";
import type { UserRole } from "../../types/auth";
import type { Team } from "../../types/team";

interface TeamMemberFiltersProps {
  search: string;
  teamId: string;
  role: string;
  status: "all" | "active" | "inactive";
  teams: Team[];
  roles: { value: UserRole; label: string }[];
  onSearchChange: (value: string) => void;
  onTeamChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: "all" | "active" | "inactive") => void;
  onClear: () => void;
}

export default function TeamMemberFilters({
  search,
  teamId,
  role,
  status,
  teams,
  roles,
  onSearchChange,
  onTeamChange,
  onRoleChange,
  onStatusChange,
  onClear,
}: TeamMemberFiltersProps) {
  const hasActiveFilters =
    search.trim() !== "" || teamId !== "all" || role !== "all" || status !== "all";

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* SEARCH */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, email, or employee code..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* SELECT FILTERS */}
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {/* ROLE FILTER */}
          <div className="min-w-[150px] flex-1 sm:flex-initial">
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              aria-label="Filter by role"
            >
              <option value="all">All Roles</option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* TEAM FILTER */}
          <div className="min-w-[150px] flex-1 sm:flex-initial">
            <select
              value={teamId}
              onChange={(e) => onTeamChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              aria-label="Filter by team"
            >
              <option value="all">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS FILTER */}
          <div className="min-w-[130px] flex-1 sm:flex-initial">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as "all" | "active" | "inactive")}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* CLEAR BUTTON */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Filter size={14} />
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
