import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface ClientFiltersProps {
  search: string;
  status: "all" | "active" | "inactive";

  onSearchChange: (
    value: string,
  ) => void;

  onStatusChange: (
    value: "all" | "active" | "inactive",
  ) => void;

  onClearFilters: () => void;
}

function ClientFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onClearFilters,
}: ClientFiltersProps) {
  const hasFilters =
    search.trim().length > 0 ||
    status !== "all";

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">

      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div className="relative min-w-0">

        <Search
          size={18}
          strokeWidth={1.8}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="search"
          value={search}
          onChange={(event) =>
            onSearchChange(
              event.target.value,
            )
          }
          placeholder="Search clients by name, contact or email..."
          className="h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
        />

        {search && (
          <button
            type="button"
            onClick={() =>
              onSearchChange("")
            }
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X
              size={15}
            />
          </button>
        )}

      </div>


      {/* =====================================================
          FILTER ROW
      ====================================================== */}

      <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">

        {/* Filter icon */}

        <div className="hidden shrink-0 items-center justify-center text-slate-400 sm:flex">
          <SlidersHorizontal
            size={16}
            strokeWidth={1.8}
          />
        </div>


        {/* Status */}

        <div className="relative w-full sm:w-auto">

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
            className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 sm:w-40"
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

          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

        </div>


        {/* Clear filters */}

        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 sm:ml-auto"
          >
            <X
              size={14}
              strokeWidth={1.8}
            />

            Clear filters
          </button>
        )}

      </div>

    </div>
  );
}

export default ClientFilters;