import { Search, X } from "lucide-react";

interface FilterOption {
  value: string;
  label?: string;
}

interface TaskFiltersProps {
  search: string;
  status: string;
  priority: string;
  category: string;
  revisionStatus: string;

  statusOptions: FilterOption[];
  priorityOptions: FilterOption[];
  categoryOptions: FilterOption[];
  revisionStatusOptions: FilterOption[];

  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onRevisionStatusChange: (value: string) => void;

  onClear: () => void;
}

/* =========================================================
   SAFE LABEL FORMATTER
========================================================= */

function formatLabel(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    const option = value as {
      label?: unknown;
      value?: unknown;
    };

    if (typeof option.label === "string") {
      return option.label;
    }

    if (typeof option.value === "string") {
      return option.value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }
  }

  return String(value);
}

/* =========================================================
   FILTER SELECT
========================================================= */

interface FilterSelectProps {
  value: string;
  placeholder: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="
        h-11
        w-full
        rounded-xl
        border
        border-slate-200
        bg-white
        px-3
        text-sm
        font-medium
        text-slate-700
        outline-none
        transition
        focus:border-slate-400
        focus:ring-2
        focus:ring-slate-100
      "
    >
      <option value="">{placeholder}</option>

      {options.map((option, index) => {
        const optionValue = String(option?.value ?? "");
        const optionLabel = formatLabel(
          option?.label ?? option?.value,
        );

        return (
          <option
            key={`${optionValue}-${index}`}
            value={optionValue}
          >
            {optionLabel}
          </option>
        );
      })}
    </select>
  );
}

/* =========================================================
   TASK FILTERS
========================================================= */

function TaskFilters({
  search,
  status,
  priority,
  category,
  revisionStatus,

  statusOptions,
  priorityOptions,
  categoryOptions,
  revisionStatusOptions,

  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onRevisionStatusChange,

  onClear,
}: TaskFiltersProps) {
  const hasFilters =
    search.trim() !== "" ||
    status !== "" ||
    priority !== "" ||
    category !== "" ||
    revisionStatus !== "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {/* =================================================
            SEARCH
        ================================================== */}

        <div className="relative xl:col-span-1">
          <Search
            size={18}
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search tasks..."
            className="
              h-11
              w-full
              rounded-xl
              border
              border-slate-200
              bg-white
              pl-10
              pr-3
              text-sm
              font-medium
              text-slate-700
              outline-none
              placeholder:text-slate-400
              transition
              focus:border-slate-400
              focus:ring-2
              focus:ring-slate-100
            "
          />
        </div>

        {/* =================================================
            STATUS
        ================================================== */}

        <FilterSelect
          value={status}
          placeholder="All Statuses"
          options={statusOptions}
          onChange={onStatusChange}
        />

        {/* =================================================
            PRIORITY
        ================================================== */}

        <FilterSelect
          value={priority}
          placeholder="All Priorities"
          options={priorityOptions}
          onChange={onPriorityChange}
        />

        {/* =================================================
            CATEGORY
        ================================================== */}

        <FilterSelect
          value={category}
          placeholder="All Categories"
          options={categoryOptions}
          onChange={onCategoryChange}
        />

        {/* =================================================
            REVISION STATUS
        ================================================== */}

        <FilterSelect
          value={revisionStatus}
          placeholder="All Revision Status"
          options={revisionStatusOptions}
          onChange={onRevisionStatusChange}
        />
      </div>

      {/* ===================================================
          ACTIVE FILTERS / CLEAR
      =================================================== */}

      {hasFilters && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {search.trim() !== "" && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                Search: {search}
              </span>
            )}

            {status !== "" && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                Status: {formatLabel(status)}
              </span>
            )}

            {priority !== "" && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                Priority: {formatLabel(priority)}
              </span>
            )}

            {category !== "" && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                Category: {formatLabel(category)}
              </span>
            )}

            {revisionStatus !== "" && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                Revision: {formatLabel(revisionStatus)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClear}
            className="
              inline-flex
              h-9
              items-center
              gap-2
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              text-xs
              font-semibold
              text-slate-600
              transition
              hover:border-slate-300
              hover:bg-slate-50
              hover:text-slate-900
            "
          >
            <X size={15} />
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskFilters;