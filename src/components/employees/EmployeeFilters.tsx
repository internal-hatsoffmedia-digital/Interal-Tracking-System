import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type { Team } from "../../types/team";

interface EmployeeFiltersProps {
  search: string;
  teamId: string;
  status: "all" | "active" | "inactive";
  teams: Team[];

  onSearchChange: (
    value: string,
  ) => void;

  onTeamChange: (
    value: string,
  ) => void;

  onStatusChange: (
    value:
      | "all"
      | "active"
      | "inactive",
  ) => void;

  onClear: () => void;
}

function EmployeeFilters({
  search,
  teamId,
  status,
  teams,
  onSearchChange,
  onTeamChange,
  onStatusChange,
  onClear,
}: EmployeeFiltersProps) {
  const hasFilters =
    search.trim() !== "" ||
    teamId !== "all" ||
    status !== "all";


  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">

      <div className="flex min-w-0 flex-col gap-3">

        {/* Search */}

        <div className="min-w-0 flex-1">

          <div className="relative">

            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                onSearchChange(
                  event.target.value,
                )
              }
              placeholder="Search employees by name, email or code..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  onSearchChange("")
                }
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}

          </div>

        </div>


        {/* Filters Row */}

        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center">

          {/* Filter Icon */}

          <div className="hidden shrink-0 items-center justify-center text-slate-400 md:flex">
            <SlidersHorizontal
              size={16}
            />
          </div>


          {/* Team */}

          <div className="min-w-0 flex-1 md:flex-none">

            <select
              value={teamId}
              onChange={(event) =>
                onTeamChange(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 md:min-w-[180px]"
            >
              <option value="all">
                All Teams
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.name}
                </option>
              ))}
            </select>

          </div>


          {/* Status */}

          <div className="min-w-0 flex-1 md:flex-none">

            <select
              value={status}
              onChange={(event) =>
                onStatusChange(
                  event.target.value as
                    | "all"
                    | "active"
                    | "inactive",
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 md:min-w-[150px]"
            >
              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>

          </div>


          {/* Clear Filters */}

          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="h-11 shrink-0 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Clear Filters
            </button>
          )}

        </div>

      </div>

    </section>
  );
}

export default EmployeeFilters;