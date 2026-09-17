import TaskActions from "../../components/tasks/TaskActions";
import {useAuth} from "../../context/AuthContext";
import {
  CheckCircle2,
  Clock3,
  Kanban,
  LayoutList,
  ListTodo,
  Plus,
  RefreshCw,
  TableProperties,
  Users,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import TaskFilters from "../../components/tasks/TaskFilters";
import TaskForm from "../../components/tasks/TaskForm";
import TaskTable from "../../components/tasks/TaskTable";
import TaskGroupedList from "../../components/tasks/TaskGroupedList";
import TaskKanbanBoard from "../../components/tasks/TaskKanbanBoard";

import { getActiveClients } from "../../services/clients/clients.service";
import { getActiveEmployees } from "../../services/employees/employees.service";
import { getActiveProjects } from "../../services/projects/projects.service";

import {
  createTask,
  getTasks,
  updateTask,
  updateTaskStatus,
} from "../../services/tasks/tasks.service";

import {
  createTaskAssignment,
  deleteTaskAssignment,
  updateTaskAssignment,
} from "../../services/tasks/taskAssignments.service";

import type { Client } from "../../types/client";
import type { EmployeeWithTeam } from "../../types/employee";

import type {
  CreateTaskInput,
  TaskWithRelations,
  UpdateTaskInput,
} from "../../types/task";

import type { ProjectWithRelations } from "../../types/project";

/* =========================================================
   SELECT OPTION
========================================================= */

interface SelectOption {
  value: string;
  label: string;
}

/* =========================================================
   PAGE
========================================================= */

function Tasks() {
  const {profile}=useAuth();
  const canManage=["admin","associate_lead","project_coordinator"].includes(profile?.role ?? "");
  const [actionTask,setActionTask]=useState<TaskWithRelations|null>(null);
  const [showArchived,setShowArchived]=useState(false);
  /* =======================================================
     DATA
  ======================================================== */

  const [tasks, setTasks] =
    useState<TaskWithRelations[]>([]);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [projects, setProjects] =
    useState<ProjectWithRelations[]>([]);

  const [employees, setEmployees] =
    useState<EmployeeWithTeam[]>([]);

  /* =======================================================
     UI STATE
  ======================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [formLoading, setFormLoading] =
    useState(false);

  const [formOpen, setFormOpen] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState<TaskWithRelations | null>(
      null,
    );

  const [viewMode, setViewMode] =
    useState<"list" | "board" | "table">("list");

  const [defaultStatus, setDefaultStatus] =
    useState("");

  const [error, setError] =
    useState("");

  /* =======================================================
     FILTER STATE
  ======================================================== */

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [priorityFilter, setPriorityFilter] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [
    revisionStatusFilter,
    setRevisionStatusFilter,
  ] = useState("");

  /* =======================================================
     OPTIONS
  ======================================================== */

  const categoryOptions: SelectOption[] =
    [
      {
        value: "shorts_reels",
        label: "Shorts / Reels",
      },
      {
        value: "long_video",
        label: "Long Video",
      },
      {
        value: "smp",
        label: "SMP",
      },
    ];

  const revisionStatusOptions: SelectOption[] =
    [
      {
        value: "new_file",
        label: "New File",
      },
      {
        value: "internal_corrections",
        label: "Internal Corrections",
      },
      {
        value: "client_correction",
        label: "Client Correction",
      },
    ];

  const priorityOptions: SelectOption[] =
    [
      {
        value: "high",
        label: "High",
      },
      {
        value: "medium",
        label: "Medium",
      },
      {
        value: "low",
        label: "Low",
      },
    ];

  const statusOptions: SelectOption[] =
    [
      {
        value: "not_started",
        label: "Not Started / In Queue",
      },
      {
        value: "raw_footage_received",
        label: "Raw Footage Received",
      },
      {
        value: "editing_in_progress",
        label: "Editing in Progress",
      },
      {
        value: "internal_review",
        label: "Sent for Internal Review",
      },
      {
        value: "client_review",
        label: "Sent for Client Review",
      },
      {
        value: "approved_delivered",
        label: "Approved & Delivered",
      },
      {
        value: "on_hold",
        label: "On Hold",
      },
    ];

  /* =======================================================
     LOAD DATA
  ======================================================== */

  const loadData = useCallback(
    async (
      showRefresh = false,
    ) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          tasksResult,
          clientsResult,
          projectsResult,
          employeesResult,
        ] =
          await Promise.allSettled([
            getTasks(),
            getActiveClients(),
            getActiveProjects(),
            getActiveEmployees(),
          ]);

        /* -----------------------------------------------
           TASKS
        ------------------------------------------------ */

        if (
          tasksResult.status ===
          "fulfilled"
        ) {
          setTasks(
            tasksResult.value,
          );
        } else {
          throw tasksResult.reason;
        }

        /* -----------------------------------------------
           CLIENTS
        ------------------------------------------------ */

        if (
          clientsResult.status ===
          "fulfilled"
        ) {
          setClients(
            clientsResult.value,
          );
        } else {
          console.error(
            "Unable to load clients:",
            clientsResult.reason,
          );
        }

        /* -----------------------------------------------
           PROJECTS
        ------------------------------------------------ */

        if (
          projectsResult.status ===
          "fulfilled"
        ) {
          setProjects(
            projectsResult.value,
          );
        } else {
          console.error(
            "Unable to load projects:",
            projectsResult.reason,
          );
        }

        /* -----------------------------------------------
           EMPLOYEES
        ------------------------------------------------ */

        if (
          employeesResult.status ===
          "fulfilled"
        ) {
          setEmployees(
            employeesResult.value,
          );
        } else {
          console.error(
            "Unable to load employees:",
            employeesResult.reason,
          );
        }
      } catch (err) {
        console.error(
          "Unable to load tasks:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load tasks.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =======================================================
     FILTERED TASKS
  ======================================================== */

  const filteredTasks =
    useMemo(() => {
      const searchTerm =
        search
          .trim()
          .toLowerCase();

      return tasks.filter(
        (task) => {
          if (!!(task as TaskWithRelations & {archived_at?:string}).archived_at !== showArchived) return false;
          const matchesSearch =
            !searchTerm ||
            task.title
              .toLowerCase()
              .includes(
                searchTerm,
              ) ||
            (
              task.client?.name ??
              ""
            )
              .toLowerCase()
              .includes(
                searchTerm,
              ) ||
            (
              task.project?.name ??
              ""
            )
              .toLowerCase()
              .includes(
                searchTerm,
              );

          if (
            !matchesSearch
          ) {
            return false;
          }

          if (statusFilter) {
            const normalizedStatus =
              task.status === "sent_for_internal_review"
                ? "internal_review"
                : task.status === "sent_for_client_review"
                ? "client_review"
                : task.status === "approved_and_delivered"
                ? "approved_delivered"
                : task.status;

            if (
              task.status !== statusFilter &&
              normalizedStatus !== statusFilter
            ) {
              return false;
            }
          }

          if (
            priorityFilter &&
            task.priority !==
              priorityFilter
          ) {
            return false;
          }

          if (
            categoryFilter &&
            task.category !==
              categoryFilter
          ) {
            return false;
          }

          if (
            revisionStatusFilter &&
            task.revision_status !==
              revisionStatusFilter
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      tasks,
      showArchived,
      search,
      statusFilter,
      priorityFilter,
      categoryFilter,
      revisionStatusFilter,
    ]);

  /* =======================================================
     STATS
  ======================================================== */

  const stats =
    useMemo(() => {
      let completed = 0;
      let onHold = 0;
      let estimatedHours = 0;
      let actualHours = 0;

      tasks.forEach(
        (task) => {
          if (
            task.status ===
            "approved_delivered" ||
            task.status ===
            "approved_and_delivered"
          ) {
            completed++;
          }

          if (
            task.status ===
            "on_hold"
          ) {
            onHold++;
          }

          estimatedHours +=
            Number(
              task.estimated_hours ??
                0,
            );

          actualHours +=
            Number(
              task.actual_hours ??
                0,
            );
        },
      );

      return {
        total: tasks.length,
        completed,
        onHold,
        estimatedHours,
        actualHours,
      };
    }, [tasks]);

  /* =======================================================
     CREATE TASK
  ======================================================== */

  const handleCreateTask =
    () => {
      setDefaultStatus("");
      setEditingTask(null);
      setError("");
      setFormOpen(true);
    };

  /* =======================================================
     QUICK ADD TASK FOR STATUS
  ======================================================== */

  const handleQuickAddTask = (
    statusKey: string,
  ) => {
    setDefaultStatus(statusKey);
    setEditingTask(null);
    setError("");
    setFormOpen(true);
  };

  /* =======================================================
     EDIT TASK
  ======================================================== */

  const handleEditTask = (
    task: TaskWithRelations,
  ) => {
    setDefaultStatus("");
    setEditingTask(task);
    setError("");
    setFormOpen(true);
  };

  /* =======================================================
     CLOSE FORM
  ======================================================== */

  const handleCloseForm =
    () => {
      if (formLoading) {
        return;
      }

      setDefaultStatus("");
      setFormOpen(false);
      setEditingTask(null);
      setError("");
    };

  /* =======================================================
     CREATE / UPDATE TASK
  ======================================================== */

  const handleSubmitTask =
    async (
      taskData:
        | CreateTaskInput
        | UpdateTaskInput,
      assignedEmployeeId:
        | string
        | null,
      assignmentNotes: string,
    ) => {
      try {
        setFormLoading(true);
        setError("");

        /* ===============================================
           UPDATE EXISTING TASK
        ================================================ */

        if (editingTask) {
          const updatedTask =
            await updateTask(
              editingTask.id,
              taskData as UpdateTaskInput,
            );

          setTasks(
            (current) =>
              current.map(
                (task) =>
                  task.id ===
                  updatedTask.id
                    ? {
                        ...task,
                        ...updatedTask,
                      }
                    : task,
              ),
          );

          setFormOpen(false);
          setEditingTask(null);

          return;
        }

        /* ===============================================
           CREATE TASK
        ================================================ */

        const newTask =
          await createTask(
            taskData as CreateTaskInput,
          );

        /* ===============================================
           RELATIONS
        ================================================ */

        const selectedClient =
          clients.find(
            (client) =>
              client.id ===
              newTask.client_id,
          );

        const selectedProject =
          projects.find(
            (project) =>
              project.id ===
              newTask.project_id,
          );

        const taskWithRelations: TaskWithRelations =
          {
            ...newTask,

            client:
              selectedClient
                ? {
                    id:
                      selectedClient.id,
                    name:
                      selectedClient.name,
                    short_name:
                      selectedClient.short_name,
                  }
                : null,

            project:
              selectedProject
                ? {
                    id:
                      selectedProject.id,
                    name:
                      selectedProject.name,
                    series_title:
                      selectedProject.series_title,
                  }
                : null,
          };

        setTasks(
          (current) => [
            taskWithRelations,
            ...current,
          ],
        );

        /* ===============================================
           ASSIGN EMPLOYEE
        ================================================ */

        if (
          assignedEmployeeId
        ) {
          try {
            await createTaskAssignment(
              {
                task_id:
                  newTask.id,

                employee_id:
                  assignedEmployeeId,

                notes:
                  assignmentNotes ||
                  null,
              },
            );
          } catch (assignmentError) {
            console.error(
              "Task created but assignment failed:",
              assignmentError,
            );

            setError(
              assignmentError instanceof
                Error
                ? `Task created successfully, but assignment failed: ${assignmentError.message}`
                : "Task created successfully, but assignment failed.",
            );
          }
        }

        /* ===============================================
           CLOSE
        ================================================ */

        setFormOpen(false);
        setEditingTask(null);

        await loadData(true);
      } catch (err) {
        console.error(
          "Unable to save task:",
          err,
        );

        throw err;
      } finally {
        setFormLoading(false);
      }
    };

  /* =======================================================
     NEXT TASK STATUS
     
     TaskTable currently sends the whole task,
     not taskId + status.
  ======================================================== */

  const handleStatusChange = (task:TaskWithRelations) => setActionTask(task);

  const handleDirectStatusChange = async (
    task: TaskWithRelations,
    newStatus: string,
  ) => {
    try {
      setError("");
      const updatedTask = await updateTaskStatus(task.id, newStatus);
      setTasks((current) =>
        current.map((t) =>
          t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
        ),
      );
    } catch (err) {
      console.error("Unable to update task status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update task status.",
      );
    }
  };

  /* =======================================================
     PRIORITY CHANGE
  ======================================================== */

  const handlePriorityChange = async (
    task: TaskWithRelations,
    newPriority: string,
  ) => {
    try {
      setError("");
      const updatedTask = await updateTask(task.id, {
        priority: newPriority,
      });
      setTasks((current) =>
        current.map((t) =>
          t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
        ),
      );
    } catch (err) {
      console.error("Unable to update task priority:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update task priority.",
      );
    }
  };

  /* =======================================================
     ASSIGN EMPLOYEE (Inline Popover)
  ======================================================== */

  const handleAssignEmployee = async (
    taskId: string,
    employeeId: string,
  ) => {
    try {
      setError("");
      const targetTask = tasks.find((t) => t.id === taskId);
      const emp = employees.find((e) => e.id === employeeId);

      if (targetTask?.assignment?.id) {
        await updateTaskAssignment(targetTask.assignment.id, {
          employee_id: employeeId,
        });
      } else {
        await createTaskAssignment({
          task_id: taskId,
          employee_id: employeeId,
        });
      }

      setTasks((current) =>
        current.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            assignment: {
              id: t.assignment?.id || "temp-" + Date.now(),
              status: "assigned",
              notes: null,
              assigned_at: new Date().toISOString(),
              employee_id: employeeId,
              employee: emp
                ? {
                    id: emp.id,
                    full_name: emp.full_name,
                    employee_code: emp.employee_code,
                    email: emp.email,
                    job_title: emp.job_title ?? null,
                    team_id: emp.team_id ?? null,
                  }
                : null,
            },
          };
        }),
      );

      void loadData(true);
    } catch (err) {
      console.error("Unable to assign task:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to assign task.",
      );
    }
  };

  /* =======================================================
     UNASSIGN EMPLOYEE
  ======================================================== */

  const handleUnassignEmployee = async (
    taskId: string,
    assignmentId: string,
  ) => {
    try {
      setError("");
      await deleteTaskAssignment(assignmentId);
      setTasks((current) =>
        current.map((t) =>
          t.id === taskId ? { ...t, assignment: null } : t,
        ),
      );
      void loadData(true);
    } catch (err) {
      console.error("Unable to unassign task:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to unassign task.",
      );
    }
  };

  /* =======================================================
     CLEAR FILTERS
  ======================================================== */

  const handleClearFilters =
    () => {
      setSearch("");
      setStatusFilter("");
      setPriorityFilter("");
      setCategoryFilter("");
      setRevisionStatusFilter("");
    };

  /* =======================================================
     STAT CARD
  ======================================================== */

  interface StatCardProps {
    label: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
  }

  const StatCard = ({
    label,
    value,
    description,
    icon,
  }: StatCardProps) => {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              {label}
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {value}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {description}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            {icon}
          </div>
        </div>
      </div>
    );
  };

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <div className="space-y-6">
      <div className="mb-5 flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/>Show archived tasks</label>{canManage && <select aria-label="Choose task actions" className="max-w-full rounded-lg border bg-white p-2 text-sm" value="" onChange={e=>setActionTask(tasks.find(t=>t.id===e.target.value) ?? null)}><option value="">Task actions — hold, remove or restore</option>{filteredTasks.map(t=><option value={t.id} key={t.id}>{t.title}</option>)}</select>}</div>
      {actionTask && <TaskActions task={actionTask} onClose={()=>setActionTask(null)} onSaved={()=>loadData(true)}/>}
      {/* =================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            PRODUCTION MANAGEMENT
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Tasks
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create, track and manage production
            tasks across clients and projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* REFRESH */}

          <button
            type="button"
            onClick={() =>
              void loadData(true)
            }
            disabled={
              loading ||
              refreshing
            }
            className="
              inline-flex
              h-11
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              text-sm
              font-semibold
              text-slate-600
              shadow-sm
              transition
              hover:border-slate-300
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          {/* NEW TASK */}

          <button
            type="button"
            onClick={
              handleCreateTask
            }
            className="
              inline-flex
              h-11
              items-center
              gap-2
              rounded-xl
              bg-slate-950
              px-5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-slate-800
            "
          >
            <Plus
              size={17}
            />

            New Task
          </button>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">
            Something needs attention
          </p>

          <p className="mt-1">
            {error}
          </p>
        </div>
      )}

      {/* =================================================
          STATS
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tasks"
          value={stats.total}
          description="All production tasks"
          icon={
            <ListTodo
              size={20}
            />
          }
        />

        <StatCard
          label="Completed"
          value={stats.completed}
          description="Approved & delivered"
          icon={
            <CheckCircle2
              size={20}
            />
          }
        />

        <StatCard
          label="On Hold"
          value={stats.onHold}
          description="Tasks currently blocked"
          icon={
            <Clock3
              size={20}
            />
          }
        />

        <StatCard
          label="Estimated Hours"
          value={`${stats.estimatedHours.toFixed(
            1,
          )}h`}
          description={`${stats.actualHours.toFixed(
            1,
          )}h actual`}
          icon={
            <Clock3
              size={20}
            />
          }
        />
      </div>

      {/* =================================================
          FILTERS
      ================================================== */}

      <TaskFilters
        search={search}
        status={statusFilter}
        priority={priorityFilter}
        category={categoryFilter}
        revisionStatus={
          revisionStatusFilter
        }
        statusOptions={
          statusOptions
        }
        priorityOptions={
          priorityOptions
        }
        categoryOptions={
          categoryOptions
        }
        revisionStatusOptions={
          revisionStatusOptions
        }
        onSearchChange={
          setSearch
        }
        onStatusChange={
          setStatusFilter
        }
        onPriorityChange={
          setPriorityFilter
        }
        onCategoryChange={
          setCategoryFilter
        }
        onRevisionStatusChange={
          setRevisionStatusFilter
        }
        onClear={
          handleClearFilters
        }
      />

      {/* =================================================
          VIEW SWITCHER & SUMMARY BAR
      ================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: View Switcher Tabs (List / Board / Table) */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/90 p-1">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "list"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutList size={14} />
            <span>List</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "board"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Kanban size={14} />
            <span>Board</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "table"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TableProperties size={14} />
            <span>Table</span>
          </button>
        </div>

        {/* Right: Summary Count */}
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-700">
              {filteredTasks.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700">
              {tasks.length}
            </span>{" "}
            tasks
          </p>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
            <Users size={13} />
            <span>{employees.length} active team members</span>
          </div>
        </div>
      </div>

      {/* =================================================
          TASK VIEWS (ClickUp Style List / Board / Table)
      ================================================== */}

      {viewMode === "list" && (
        <TaskGroupedList
          tasks={filteredTasks}
          loading={loading}
          employees={employees}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          onEdit={handleEditTask}
          onStatusChange={handleDirectStatusChange}
          onPriorityChange={handlePriorityChange}
          onAssignEmployee={handleAssignEmployee}
          onUnassignEmployee={handleUnassignEmployee}
          onQuickAddTask={handleQuickAddTask}
        />
      )}

      {viewMode === "board" && (
        <TaskKanbanBoard
          tasks={filteredTasks}
          loading={loading}
          employees={employees}
          statusOptions={statusOptions}
          onEdit={handleEditTask}
          onStatusChange={handleDirectStatusChange}
          onAssignEmployee={handleAssignEmployee}
          onUnassignEmployee={handleUnassignEmployee}
          onQuickAddTask={handleQuickAddTask}
        />
      )}

      {viewMode === "table" && (
        <TaskTable
          tasks={filteredTasks}
          loading={loading}
          onEdit={handleEditTask}
          onStatusChange={canManage?handleStatusChange:undefined}
        />
      )}

      {/* =================================================
          TASK FORM
      ================================================== */}

      <TaskForm
        open={formOpen}
        task={editingTask}
        defaultStatus={defaultStatus}
        loading={formLoading}
        error={error}
        clients={clients}
        projects={projects}
        employees={employees}
        categoryOptions={categoryOptions}
        revisionStatusOptions={revisionStatusOptions}
        priorityOptions={priorityOptions}
        statusOptions={statusOptions}
        onClose={handleCloseForm}
        onSubmit={handleSubmitTask}
      />
    </div>
  );
}

export default Tasks;