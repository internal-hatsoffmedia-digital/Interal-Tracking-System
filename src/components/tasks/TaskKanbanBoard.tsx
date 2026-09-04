import { useState } from "react";
import {
  CalendarDays,
  Edit3,
  Flag,
  Plus,
  UserPlus,
} from "lucide-react";

import InlineAssigneeDropdown from "./InlineAssigneeDropdown";
import type { EmployeeWithTeam } from "../../types/employee";
import type { TaskWithRelations } from "../../types/task";

interface TaskKanbanBoardProps {
  tasks: TaskWithRelations[];
  loading: boolean;
  employees: EmployeeWithTeam[];
  statusOptions: { value: string; label: string }[];
  onEdit: (task: TaskWithRelations) => void;
  onStatusChange: (task: TaskWithRelations, newStatus: string) => Promise<void> | void;
  onAssignEmployee: (taskId: string, employeeId: string) => Promise<void> | void;
  onUnassignEmployee: (taskId: string, assignmentId: string) => Promise<void> | void;
  onQuickAddTask: (status: string) => void;
}

function getPriorityFlag(priority: string) {
  const p = priority.toLowerCase();
  if (p.includes("high") || p.includes("urgent")) {
    return { color: "text-red-500 fill-red-500", label: "High" };
  }
  if (p.includes("med")) {
    return { color: "text-amber-500 fill-amber-500", label: "Medium" };
  }
  if (p.includes("low")) {
    return { color: "text-sky-400 fill-sky-400", label: "Low" };
  }
  return { color: "text-slate-300", label: "Normal" };
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TaskKanbanBoard({
  tasks,
  loading,
  employees,
  statusOptions,
  onEdit,
  onStatusChange,
  onAssignEmployee,
  onUnassignEmployee,
  onQuickAddTask,
}: TaskKanbanBoardProps) {
  const [activeAssigneeTaskId, setActiveAssigneeTaskId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((col) => (
          <div
            key={col}
            className="w-80 shrink-0 rounded-2xl border border-slate-200 bg-slate-50/50 p-3 space-y-3"
          >
            <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-28 animate-pulse rounded-xl bg-white" />
            <div className="h-28 animate-pulse rounded-xl bg-white" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 select-none">
      {statusOptions.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status.value);

        return (
          <div
            key={status.value}
            className="flex flex-col w-80 shrink-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 max-h-[calc(100vh-250px)]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {status.label}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
                  {columnTasks.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onQuickAddTask(status.value)}
                className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-slate-200 text-slate-500 transition"
                title="Add task to this status"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Column Cards */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {columnTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  No tasks in this stage
                </div>
              ) : (
                columnTasks.map((task) => {
                  const assignedEmployee = task.assignment?.employee;
                  const priorityMeta = getPriorityFlag(task.priority);
                  const formattedDate = formatDate(task.due_date);

                  return (
                    <div
                      key={task.id}
                      className="group relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition"
                    >
                      {/* Card Header: Client / Project + Quick Move Status + Edit Button */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 truncate">
                          {task.client?.short_name || task.client?.name || "No client"}
                        </span>
                        <div className="flex items-center gap-1">
                          <select
                            value={task.status}
                            onChange={(e) => onStatusChange(task, e.target.value)}
                            className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 border-0 outline-none cursor-pointer hover:bg-slate-200"
                            title="Move to stage"
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => onEdit(task)}
                            className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-800 transition"
                            title="Edit Task"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Card Title */}
                      <h4
                        onClick={() => onEdit(task)}
                        className="mt-1 text-xs font-semibold text-slate-800 line-clamp-2 hover:text-blue-600 cursor-pointer"
                      >
                        {task.title}
                      </h4>

                      {/* Card Project subtitle if exists */}
                      {task.project && (
                        <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                          {task.project.name}
                        </p>
                      )}

                      {/* Card Footer: Assignee + Date + Priority */}
                      <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100">
                        {/* Assignee */}
                        <div className="relative">
                          {assignedEmployee ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveAssigneeTaskId(
                                  activeAssigneeTaskId === task.id ? null : task.id
                                );
                              }}
                              className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 shadow-xs hover:border-blue-400 transition"
                              title={`Assigned to ${assignedEmployee.full_name}. Click to change.`}
                            >
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                                {getInitials(assignedEmployee.full_name)}
                              </div>
                              <span className="max-w-[60px] truncate text-[10px] font-medium text-slate-700">
                                {assignedEmployee.full_name.split(" ")[0]}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveAssigneeTaskId(
                                  activeAssigneeTaskId === task.id ? null : task.id
                                );
                              }}
                              className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[10px] text-slate-400 hover:border-blue-500 hover:text-blue-600 transition"
                            >
                              <UserPlus size={11} />
                              <span>Assign</span>
                            </button>
                          )}

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

                        {/* Date & Priority */}
                        <div className="flex items-center gap-2">
                          {formattedDate && (
                            <span className="flex items-center gap-0.5 text-[10px] font-medium text-slate-500">
                              <CalendarDays size={10} className="text-slate-400" />
                              {formattedDate}
                            </span>
                          )}

                          <Flag size={12} className={priorityMeta.color} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Add at bottom */}
            <button
              type="button"
              onClick={() => onQuickAddTask(status.value)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 hover:border-blue-400 hover:bg-white hover:text-blue-600 transition"
            >
              <Plus size={13} />
              <span>Add Task</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
