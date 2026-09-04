import { Search, SlidersHorizontal } from "lucide-react";

interface TeamFiltersProps {
  search: string;
  status: "all" | "active" | "inactive";
  onSearchChange: (value: string) => void;
  onStatusChange: (
    value: "all" | "active" | "inactive",
  ) => void;
}

function TeamFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: TeamFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search teams..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
        />
      </div>

      <div className="flex items-center gap-2">
        <SlidersHorizontal
          size={15}
          className="text-slate-400"
        />

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
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-900"
        >
          <option value="all">All teams</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
}

export default TeamFilters;