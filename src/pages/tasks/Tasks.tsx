import {
  CheckCircle2,
  Clock3,
  ListTodo,
  Plus,
  RefreshCw,
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

import { getActiveClients } from "../../services/clients/clients.service";
import { getActiveEmployees } from "../../services/employees/employees.service";
import { getActiveProjects } from "../../services/projects/projects.service";

import {
  createTask,
  getTasks,
  updateTask,
  updateTaskStatus,
} from "../../services/tasks/tasks.service";

import { createTaskAssignment } from "../../services/tasks/taskAssignments.service";

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
        value: "sent_for_internal_review",
        label: "Sent for Internal Review",
      },
      {
        value: "sent_for_client_review",
        label: "Sent for Client Review",
      },
      {
        value: "approved_and_delivered",
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

          if (
            statusFilter &&
            task.status !==
              statusFilter
          ) {
            return false;
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

  const getNextTaskStatus = (
    currentStatus: string,
  ): string | null => {
    const statusFlow: Record<
      string,
      string
    > = {
      not_started:
        "raw_footage_received",

      raw_footage_received:
        "editing_in_progress",

      editing_in_progress:
        "sent_for_internal_review",

      sent_for_internal_review:
        "sent_for_client_review",

      sent_for_client_review:
        "approved_and_delivered",
    };

    return (
      statusFlow[
        currentStatus
      ] ?? null
    );
  };

  /* =======================================================
     STATUS CHANGE
     
     IMPORTANT:
     Matches TaskTable's current prop:
     
     (task: TaskWithRelations) => void
  ======================================================== */

  const handleStatusChange =
    async (
      task: TaskWithRelations,
    ) => {
      const nextStatus =
        getNextTaskStatus(
          task.status,
        );

      if (!nextStatus) {
        return;
      }

      try {
        setError("");

        const updatedTask =
          await updateTaskStatus(
            task.id,
            nextStatus,
          );

        setTasks(
          (current) =>
            current.map(
              (currentTask) =>
                currentTask.id ===
                updatedTask.id
                  ? {
                      ...currentTask,
                      ...updatedTask,
                    }
                  : currentTask,
            ),
        );
      } catch (err) {
        console.error(
          "Unable to update task status:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to update task status.",
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
          RESULT SUMMARY
      ================================================== */}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            TASKS
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-700">
              {
                filteredTasks.length
              }
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700">
              {tasks.length}
            </span>{" "}
            tasks
          </p>
        </div>

        <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
          <Users
            size={14}
          />

          {employees.length} active
          team members
        </div>
      </div>

      {/* =================================================
          TASK TABLE
      ================================================== */}

      <TaskTable
        tasks={filteredTasks}
        loading={loading}
        onEdit={
          handleEditTask
        }
        onStatusChange={
          handleStatusChange
        }
      />

      {/* =================================================
          TASK FORM
      ================================================== */}

      <TaskForm
        open={formOpen}
        task={editingTask}
        loading={formLoading}
        error={error}
        clients={clients}
        projects={projects}
        employees={employees}
        categoryOptions={
          categoryOptions
        }
        revisionStatusOptions={
          revisionStatusOptions
        }
        priorityOptions={
          priorityOptions
        }
        statusOptions={
          statusOptions
        }
        onClose={
          handleCloseForm
        }
        onSubmit={
          handleSubmitTask
        }
      />
    </div>
  );
}

export default Tasks;