import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Edit3,
  Flag,
  Plus,
  UserPlus,
} from "lucide-react";

import InlineAssigneeDropdown from "./InlineAssigneeDropdown";
import type { EmployeeWithTeam } from "../../types/employee";
import type { TaskWithRelations } from "../../types/task";

/* =========================================================
   TYPES
========================================================= */

interface TaskGroupedListProps {
  tasks: TaskWithRelations[];
  loading: boolean;
  employees: EmployeeWithTeam[];
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  onEdit: (task: TaskWithRelations) => void;
  onStatusChange: (task: TaskWithRelations, newStatus: string) => Promise<void> | void;
  onPriorityChange?: (task: TaskWithRelations, newPriority: string) => Promise<void> | void;
  onAssignEmployee: (taskId: string, employeeId: string) => Promise<void> | void;
  onUnassignEmployee: (taskId: string, assignmentId: string) => Promise<void> | void;
  onQuickAddTask: (status: string) => void;
}

/* =========================================================
   STATUS PALETTES (ClickUp Style)
========================================================= */

interface StatusTheme {
  border: string;
  bg: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  dotBg: string;
}

const STATUS_THEMES: Record<string, StatusTheme> = {
  not_started: {
    border: "border-slate-200",
    bg: "bg-slate-50/50",
    text: "text-slate-700",
    badgeBg: "bg-slate-500",
    badgeText: "text-white",
    dotBg: "bg-slate-400",
  },
  raw_footage_received: {
    border: "border-purple-200",
    bg: "bg-purple-50/30",
    text: "text-purple-700",
    badgeBg: "bg-purple-600",
    badgeText: "text-white",
    dotBg: "bg-purple-500",
  },
  editing_in_progress: {
    border: "border-blue-200",
    bg: "bg-blue-50/30",
    text: "text-blue-700",
    badgeBg: "bg-blue-600",
    badgeText: "text-white",
    dotBg: "bg-blue-500",
  },
  internal_review: {
    border: "border-fuchsia-200",
    bg: "bg-fuchsia-50/30",
    text: "text-fuchsia-700",
    badgeBg: "bg-fuchsia-600",
    badgeText: "text-white",
    dotBg: "bg-fuchsia-500",
  },
  sent_for_internal_review: {
    border: "border-fuchsia-200",
    bg: "bg-fuchsia-50/30",
    text: "text-fuchsia-700",
    badgeBg: "bg-fuchsia-600",
    badgeText: "text-white",
    dotBg: "bg-fuchsia-500",
  },
  client_review: {
    border: "border-amber-200",
    bg: "bg-amber-50/30",
    text: "text-amber-700",
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    dotBg: "bg-amber-500",
  },
  sent_for_client_review: {
    border: "border-amber-200",
    bg: "bg-amber-50/30",
    text: "text-amber-700",
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    dotBg: "bg-amber-500",
  },
  approved_delivered: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/30",
    text: "text-emerald-700",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    dotBg: "bg-emerald-500",
  },
  approved_and_delivered: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/30",
    text: "text-emerald-700",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    dotBg: "bg-emerald-500",
  },
  on_hold: {
    border: "border-rose-200",
    bg: "bg-rose-50/30",
    text: "text-rose-700",
    badgeBg: "bg-rose-500",
    badgeText: "text-white",
    dotBg: "bg-rose-500",
  },
};

const DEFAULT_THEME: StatusTheme = {
  border: "border-slate-200",
  bg: "bg-slate-50/50",
  text: "text-slate-700",
  badgeBg: "bg-slate-600",
  badgeText: "text-white",
  dotBg: "bg-slate-400",
};

/* =========================================================
   PRIORITY FLAG STYLES
========================================================= */

function getPriorityFlag(priority: string) {
  const p = priority.toLowerCase();
  if (p.includes("high") || p.includes("urgent")) {
    return {
      color: "text-red-500 fill-red-500",
      label: "High",
      bg: "hover:bg-red-50",
    };
  }
  if (p.includes("med")) {
    return {
      color: "text-amber-500 fill-amber-500",
      label: "Medium",
      bg: "hover:bg-amber-50",
    };
  }
  if (p.includes("low")) {
    return {
      color: "text-sky-400 fill-sky-400",
      label: "Low",
      bg: "hover:bg-sky-50",
    };
  }
  return {
    color: "text-slate-300",
    label: "Normal",
    bg: "hover:bg-slate-50",
  };
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function isOverdue(value: string | null | undefined): boolean {
  if (!value) return false;
  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline.getTime() < Date.now();
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function TaskGroupedList({
  tasks,
  loading,
  employees,
  statusOptions,
  priorityOptions,
  onEdit,
  onStatusChange,
  onPriorityChange,
  onAssignEmployee,
  onUnassignEmployee,
  onQuickAddTask,
}: TaskGroupedListProps) {
  // Collapsed sections state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Active dropdown states for inline actions
  const [activeAssigneeTaskId, setActiveAssigneeTaskId] = useState<string | null>(null);
  const [activePriorityTaskId, setActivePriorityTaskId] = useState<string | null>(null);
  const [activeStatusTaskId, setActiveStatusTaskId] = useState<string | null>(null);

  const toggleGroup = (statusKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [statusKey]: !prev[statusKey],
    }));
  };

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const groups: {
      statusKey: string;
      label: string;
      theme: StatusTheme;
      tasks: TaskWithRelations[];
    }[] = [];

    const normalizeStatusKey = (s: string) => {
      if (s === "sent_for_internal_review") return "internal_review";
      if (s === "sent_for_client_review") return "client_review";
      if (s === "approved_and_delivered") return "approved_delivered";
      return s;
    };

    // Order according to statusOptions
    statusOptions.forEach((option) => {
      const statusTasks = tasks.filter(
        (task) =>
          task.status === option.value ||
          normalizeStatusKey(task.status) === option.value
      );
      groups.push({
        statusKey: option.value,
        label: option.label,
        theme: STATUS_THEMES[option.value] || DEFAULT_THEME,
        tasks: statusTasks,
      });
    });

    // Check for any tasks with unrecognized status
    const knownStatuses = new Set(statusOptions.map((o) => o.value));
    const otherTasks = tasks.filter(
      (task) =>
        !knownStatuses.has(task.status) &&
        !knownStatuses.has(normalizeStatusKey(task.status))
    );
    if (otherTasks.length > 0) {
      groups.push({
        statusKey: "other",
        label: "Other Tasks",
        theme: DEFAULT_THEME,
        tasks: otherTasks,
      });
    }

    return groups;
  }, [tasks, statusOptions]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((g) => (
          <div
            key={g}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-6 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
            </div>
            {[1, 2].map((r) => (
              <div
                key={r}
                className="h-12 w-full animate-pulse rounded-xl bg-slate-50"
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {groupedTasks.map((group) => {
        const isCollapsed = Boolean(collapsedGroups[group.statusKey]);
        const taskCount = group.tasks.length;

        return (
          <div
            key={group.statusKey}
            className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-visible transition"
          >
            {/* =========================================================
                GROUP HEADER (ClickUp Style)
            ========================================================= */}
            <div
              onClick={() => toggleGroup(group.statusKey)}
              className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 cursor-pointer hover:bg-slate-100/70 transition"
            >
              {/* Left: Collapse Icon + Colored Status Pill + Count */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 transition"
                  aria-label="Toggle Group"
                >
                  {isCollapsed ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm ${group.theme.badgeBg} ${group.theme.badgeText}`}
                >
                  {group.label}
                </span>

                <span className="text-xs font-semibold text-slate-400">
                  {taskCount} {taskCount === 1 ? "TASK" : "TASKS"}
                </span>
              </div>

              {/* Right: Column Titles */}
              <div className="hidden lg:grid grid-cols-[140px_110px_90px_60px] gap-3 text-right pr-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  ASSIGNEE
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  DUE DATE
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  PRIORITY
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  ACTION
                </span>
              </div>
            </div>

            {/* =========================================================
                GROUP BODY / ROWS
            ========================================================= */}
            {!isCollapsed && (
              <div className="divide-y divide-slate-100">
                {group.tasks.length === 0 ? (
                  <div className="px-6 py-6 text-center text-xs text-slate-400 italic">
                    No tasks in {group.label}. Click "+ New task" below to add one.
                  </div>
                ) : (
                  group.tasks.map((task) => {
                    const assignedEmployee = task.assignment?.employee;
                    const overdue = isOverdue(task.due_date);
                    const priorityMeta = getPriorityFlag(task.priority);

                    return (
                      <div
                        key={task.id}
                        className="group flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50/80 transition"
                      >
                        {/* Task Title & Project Metadata */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Colored status dot with quick status change dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveStatusTaskId(
                                  activeStatusTaskId === task.id ? null : task.id,
                                );
                              }}
                              className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-sm ${group.theme.dotBg} hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 transition`}
                              title="Click to change status"
                            />

                            {activeStatusTaskId === task.id && (
                              <div
                                className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Move to Status
                                </p>
                                {statusOptions.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={async () => {
                                      await onStatusChange(task, opt.value);
                                      setActiveStatusTaskId(null);
                                    }}
                                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                                      task.status === opt.value
                                        ? "bg-slate-100 font-semibold text-slate-900"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    <div
                                      className={`h-2.5 w-2.5 rounded-xs ${
                                        STATUS_THEMES[opt.value]?.dotBg || "bg-slate-400"
                                      }`}
                                    />
                                    <span className="truncate">{opt.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                onClick={() => onEdit(task)}
                                className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition cursor-pointer truncate"
                              >
                                {task.title}
                              </span>

                              {/* Task ID / Code Badge */}
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500">
                                {task.id.slice(0, 6).toUpperCase()}
                              </span>

                              {/* Category Badge */}
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                {task.category.replace(/_/g, " ")}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                              {task.client && (
                                <span className="font-medium text-slate-600">
                                  {task.client.short_name || task.client.name}
                                </span>
                              )}
                              {task.client && task.project && <span>•</span>}
                              {task.project && (
                                <span className="truncate">
                                  {task.project.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Task Columns for Desktop / Mobile */}
                        <div className="flex items-center justify-between lg:justify-end gap-3 lg:grid lg:grid-cols-[140px_110px_90px_60px] shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          {/* =========================================
                              ASSIGNEE COLUMN (One-Click Inline Assignment)
                          ========================================= */}
                          <div className="relative flex justify-start lg:justify-center">
                            {assignedEmployee ? (
                              <div className="relative group/assignee">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveAssigneeTaskId(
                                      activeAssigneeTaskId === task.id ? null : task.id
                                    );
                                  }}
                                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm hover:border-blue-400 hover:ring-2 hover:ring-blue-50 transition"
                                  title={`Assigned to ${assignedEmployee.full_name}. Click to change.`}
                                >
                                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                                    {getInitials(assignedEmployee.full_name)}
                                  </div>
                                  <span className="max-w-[70px] truncate text-xs font-medium text-slate-700">
                                    {assignedEmployee.full_name.split(" ")[0]}
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAssigneeTaskId(
                                    activeAssigneeTaskId === task.id ? null : task.id
                                  );
                                }}
                                className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-500 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 transition"
                                title="Assign to team member"
                              >
                                <UserPlus size={13} />
                                <span className="text-[11px] font-medium">Assign</span>
                              </button>
                            )}

                            {/* Assignee Popover Dropdown */}
                            {activeAssigneeTaskId === task.id && (
                              <InlineAssigneeDropdown
                                currentEmployeeId={assignedEmployee?.id}
                                employees={employees}
                                onAssign={async (employeeId) => {
                                  await onAssignEmployee(task.id, employeeId);
                                  setActiveAssigneeTaskId(null);
                                }}
                                onUnassign={
                                  task.assignment?.id
                                    ? async () => {
                                        await onUnassignEmployee(task.id, task.assignment!.id);
                                        setActiveAssigneeTaskId(null);
                                      }
                                    : undefined
                                }
                                onClose={() => setActiveAssigneeTaskId(null)}
                              />
                            )}
                          </div>

                          {/* =========================================
                              DUE DATE COLUMN
                          ========================================= */}
                          <div className="flex items-center justify-center">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium ${
                                overdue
                                  ? "text-red-600 font-semibold"
                                  : "text-slate-600"
                              }`}
                              title={overdue ? "Overdue deadline!" : "Due date"}
                            >
                              <CalendarDays
                                size={12}
                                className={overdue ? "text-red-500" : "text-slate-400"}
                              />
                              {formatDate(task.due_date)}
                            </span>
                          </div>

                          {/* =========================================
                              PRIORITY FLAG COLUMN
                          ========================================= */}
                          <div className="relative flex justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePriorityTaskId(
                                  activePriorityTaskId === task.id ? null : task.id
                                );
                              }}
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${priorityMeta.bg}`}
                              title={`Priority: ${priorityMeta.label}. Click to change.`}
                            >
                              <Flag size={13} className={priorityMeta.color} />
                              <span className="text-[11px] font-medium text-slate-600">
                                {priorityMeta.label}
                              </span>
                            </button>

                            {/* Priority Quick Picker Popover */}
                            {activePriorityTaskId === task.id && onPriorityChange && (
                              <div
                                className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Set Priority
                                </p>
                                {priorityOptions.map((opt) => {
                                  const flag = getPriorityFlag(opt.value);
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={async () => {
                                        await onPriorityChange(task, opt.value);
                                        setActivePriorityTaskId(null);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition"
                                    >
                                      <Flag size={13} className={flag.color} />
                                      <span>{opt.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* =========================================
                              ACTIONS
                          ========================================= */}
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEdit(task)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                              title="Edit Task"
                            >
                              <Edit3 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* =========================================================
                    + NEW TASK INLINE BUTTON (ClickUp Style)
                ========================================================= */}
                <div className="px-5 py-2.5 bg-slate-50/40">
                  <button
                    type="button"
                    onClick={() => onQuickAddTask(group.statusKey)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition"
                  >
                    <Plus size={14} className="text-slate-400 hover:text-blue-600" />
                    <span>New task</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
