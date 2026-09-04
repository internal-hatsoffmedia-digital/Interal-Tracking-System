import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface ProjectFiltersProps {
  search: string;
  status: string;
  health: string;
  invoiceStatus: string;

  statusOptions: string[];
  healthOptions: string[];
  invoiceStatusOptions: string[];

  onSearchChange: (
    value: string,
  ) => void;

  onStatusChange: (
    value: string,
  ) => void;

  onHealthChange: (
    value: string,
  ) => void;

  onInvoiceStatusChange: (
    value: string,
  ) => void;

  onClearFilters: () => void;
}


function formatOption(
  value: string,
): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}


function ProjectFilters({
  search,
  status,
  health,
  invoiceStatus,
  statusOptions,
  healthOptions,
  invoiceStatusOptions,
  onSearchChange,
  onStatusChange,
  onHealthChange,
  onInvoiceStatusChange,
  onClearFilters,
}: ProjectFiltersProps) {
  const hasFilters =
    Boolean(search.trim()) ||
    Boolean(status) ||
    Boolean(health) ||
    Boolean(invoiceStatus);


  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex flex-col gap-4">

        {/* =================================================
            FILTER HEADER
        ================================================== */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">

              <SlidersHorizontal
                size={15}
                strokeWidth={1.8}
              />

            </div>

            <div>

              <p className="text-sm font-semibold text-slate-900">
                Filters
              </p>

              <p className="hidden text-xs text-slate-400 sm:block">
                Find and filter projects
              </p>

            </div>

          </div>


          {hasFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >

              <X
                size={14}
                strokeWidth={2}
              />

              Clear

            </button>
          )}

        </div>


        {/* =================================================
            FILTER CONTROLS
        ================================================== */}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

          {/* SEARCH */}

          <div className="relative md:col-span-2 xl:col-span-1">

            <Search
              size={16}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                onSearchChange(
                  event.target.value,
                )
              }
              placeholder="Search projects..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5"
            />

          </div>


          {/* STATUS */}

          <div>

            <select
              value={status}
              onChange={(event) =>
                onStatusChange(
                  event.target.value,
                )
              }
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5"
            >

              <option value="">
                All Status
              </option>

              {statusOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {formatOption(
                      option,
                    )}
                  </option>
                ),
              )}

            </select>

          </div>


          {/* HEALTH */}

          <div>

            <select
              value={health}
              onChange={(event) =>
                onHealthChange(
                  event.target.value,
                )
              }
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5"
            >

              <option value="">
                All Health
              </option>

              {healthOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {formatOption(
                      option,
                    )}
                  </option>
                ),
              )}

            </select>

          </div>


          {/* INVOICE STATUS */}

          <div>

            <select
              value={invoiceStatus}
              onChange={(event) =>
                onInvoiceStatusChange(
                  event.target.value,
                )
              }
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5"
            >

              <option value="">
                All Payment Status
              </option>

              {invoiceStatusOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {formatOption(
                      option,
                    )}
                  </option>
                ),
              )}

            </select>

          </div>

        </div>


        {/* =================================================
            ACTIVE FILTER SUMMARY
        ================================================== */}

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">

            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Active:
            </span>


            {search.trim() && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                Search: {search.trim()}
              </span>
            )}


            {status && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                Status:{" "}
                {formatOption(
                  status,
                )}
              </span>
            )}


            {health && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                Health:{" "}
                {formatOption(
                  health,
                )}
              </span>
            )}


            {invoiceStatus && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                Payment:{" "}
                {formatOption(
                  invoiceStatus,
                )}
              </span>
            )}

          </div>
        )}

      </div>

    </div>
  );
}


export default ProjectFilters;