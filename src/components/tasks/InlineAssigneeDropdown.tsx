import { useEffect, useRef, useState } from "react";
import { Check, Search, UserMinus, X } from "lucide-react";
import type { EmployeeWithTeam } from "../../types/employee";

interface InlineAssigneeDropdownProps {
  currentEmployeeId?: string | null;
  employees: EmployeeWithTeam[];
  loading?: boolean;
  onAssign: (employeeId: string) => Promise<void> | void;
  onUnassign?: () => Promise<void> | void;
  onClose: () => void;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "U";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
}

export default function InlineAssigneeDropdown({
  currentEmployeeId,
  employees,
  loading = false,
  onAssign,
  onUnassign,
  onClose,
}: InlineAssigneeDropdownProps) {
  const [search, setSearch] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const filteredEmployees = employees.filter((employee) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      employee.full_name.toLowerCase().includes(term) ||
      (employee.job_title && employee.job_title.toLowerCase().includes(term)) ||
      (employee.team?.name && employee.team.name.toLowerCase().includes(term)) ||
      employee.employee_code.toLowerCase().includes(term)
    );
  });

  const handleSelect = async (employeeId: string) => {
    if (submittingId) return;
    setSubmittingId(employeeId);
    try {
      await onAssign(employeeId);
      onClose();
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRemove = async () => {
    if (!onUnassign || submittingId) return;
    setSubmittingId("unassign");
    try {
      await onUnassign();
      onClose();
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header & Search */}
      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team member..."
          className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Unassign Option */}
      {currentEmployeeId && onUnassign && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={submittingId === "unassign" || loading}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <UserMinus size={12} />
          </div>
          <span>Unassign from task</span>
        </button>
      )}

      {currentEmployeeId && onUnassign && (
        <div className="my-1.5 border-t border-slate-100" />
      )}

      {/* Employee List */}
      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Assign to team member
        </p>

        {filteredEmployees.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No active members found
          </div>
        ) : (
          filteredEmployees.map((employee) => {
            const isCurrent = employee.id === currentEmployeeId;
            const isSubmitting = submittingId === employee.id;
            const colorClass = getAvatarColor(employee.id);

            return (
              <button
                key={employee.id}
                type="button"
                onClick={() => handleSelect(employee.id)}
                disabled={loading || submittingId !== null}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition ${
                  isCurrent
                    ? "bg-blue-50 text-blue-900 font-medium"
                    : "text-slate-700 hover:bg-slate-100"
                } disabled:opacity-50`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${colorClass}`}
                  >
                    {getInitials(employee.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs leading-tight">
                      {employee.full_name}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {employee.job_title || employee.team?.name || employee.employee_code}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <Check size={14} className="shrink-0 text-blue-600" />
                )}

                {isSubmitting && (
                  <span className="text-[10px] text-blue-600 animate-pulse">
                    Saving...
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
