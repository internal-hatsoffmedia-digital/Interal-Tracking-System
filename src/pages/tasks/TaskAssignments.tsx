import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  Users,
} from "lucide-react";

import TaskAssignmentForm from "../../components/tasks/TaskAssignmentForm";
import TaskAssignmentTable from "../../components/tasks/TaskAssignmentTable";

import {
  getActiveEmployees,
} from "../../services/employees/employees.service";

import {
  getTasks,
} from "../../services/tasks/tasks.service";

import {
  createTaskAssignment,
  getTaskAssignments,
  updateTaskAssignment,
  updateTaskAssignmentStatus,
} from "../../services/tasks/taskAssignments.service";

import {
  getTeams,
} from "../../services/teams/teams.service";

import { useAuth } from "../../context/AuthContext";

import type {
  EmployeeWithTeam,
} from "../../types/employee";

import type {
  TaskWithRelations,
} from "../../types/task";

import type {
  Team,
} from "../../types/team";

import type {
  CreateTaskAssignmentInput,
  TaskAssignmentWithRelations,
} from "../../types/taskAssignment";

/* =========================================================
   PAGE
========================================================= */

function TaskAssignments() {
  const { profile } = useAuth();

  /* =======================================================
     DATA
  ======================================================= */

  const [assignments, setAssignments] =
    useState<TaskAssignmentWithRelations[]>(
      [],
    );

  const [tasks, setTasks] =
    useState<TaskWithRelations[]>([]);

  const [employees, setEmployees] =
    useState<EmployeeWithTeam[]>([]);

  const [teams, setTeams] =
    useState<Team[]>([]);

  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [formLoading, setFormLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [formOpen, setFormOpen] =
    useState(false);

  const [editingAssignment, setEditingAssignment] =
    useState<TaskAssignmentWithRelations | null>(
      null,
    );

  /* =======================================================
     FILTER
  ======================================================= */

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [selectedTeamId, setSelectedTeamId] =
    useState<string>("");

  /* =======================================================
     ROLE & TEAM RESOLUTION
  ======================================================= */

  const isLead =
    profile?.role === "associate_lead" ||
    profile?.role === "team_lead";

  const isCoordinator =
    profile?.role === "project_coordinator";

  const isAdminOrExec =
    profile?.role === "admin" ||
    profile?.role === "manager" ||
    profile?.role === "director";

  const userTeamId = profile?.team_id ?? null;

  const currentTeam = useMemo(() => {
    if (!userTeamId) return null;
    return (
      teams.find((t) => t.id === userTeamId) ??
      employees.find((e) => e.team_id === userTeamId)?.team ??
      null
    );
  }, [teams, employees, userTeamId]);

  const currentTeamName = currentTeam?.name ?? null;

  const isFlowForceLead = useMemo(() => {
    if (!isLead || !currentTeamName) return false;
    const name = currentTeamName.toLowerCase();
    const type = ((currentTeam as any)?.team_type || "").toLowerCase();
    return (
      name.includes("flow force") ||
      name.includes("project coordinator") ||
      name.includes("coordinator") ||
      type === "flow_force" ||
      type === "project_coordination"
    );
  }, [isLead, currentTeamName, currentTeam]);

  // Operational production lead (Creative Clan, Cut Masters, Web Development, Digital Ninjas, etc.)
  const isProductionLead = isLead && !isFlowForceLead;

  // Active members of user's team
  const userTeamEmployees = useMemo(() => {
    if (!userTeamId) return [];
    return employees.filter((e) => e.team_id === userTeamId);
  }, [employees, userTeamId]);

  const userTeamEmployeeIds = useMemo(() => {
    return new Set(userTeamEmployees.map((e) => e.id));
  }, [userTeamEmployees]);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData = useCallback(
    async () => {
      setLoading(true);
      setErrorMessage("");

      const results =
        await Promise.allSettled([
          getTaskAssignments(),
          getTasks(),
          getActiveEmployees(),
          getTeams(),
        ]);

      const [
        assignmentsResult,
        tasksResult,
        employeesResult,
        teamsResult,
      ] = results;

      /* -----------------------------------------------
         ASSIGNMENTS
      ----------------------------------------------- */

      if (
        assignmentsResult.status ===
        "fulfilled"
      ) {
        setAssignments(
          assignmentsResult.value,
        );
      } else {
        setErrorMessage(
          assignmentsResult.reason
            ?.message ||
            "Unable to load task assignments.",
        );
      }

      /* -----------------------------------------------
         TASKS
      ----------------------------------------------- */

      if (
        tasksResult.status ===
        "fulfilled"
      ) {
        setTasks(
          tasksResult.value,
        );
      }

      /* -----------------------------------------------
         EMPLOYEES
      ----------------------------------------------- */

      if (
        employeesResult.status ===
        "fulfilled"
      ) {
        setEmployees(
          employeesResult.value,
        );
      }

      /* -----------------------------------------------
         TEAMS
      ----------------------------------------------- */

      if (
        teamsResult &&
        teamsResult.status ===
        "fulfilled"
      ) {
        setTeams(
          teamsResult.value,
        );
      }

      setLoading(false);
    },
    [],
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =======================================================
     SCOPING BY ROLE & TEAM
  ======================================================= */

  const scopedAssignments = useMemo(() => {
    // 1. Associate lead of a specific production team: strictly see their team's work
    if (isProductionLead && userTeamId) {
      return assignments.filter((a) => {
        const inTeam = a.employee_id
          ? userTeamEmployeeIds.has(a.employee_id)
          : false;
        const teamMatches = a.employee?.team_id === userTeamId;
        const assignedByMe = Boolean(profile?.id && a.assigned_by === profile.id);
        return inTeam || teamMatches || assignedByMe;
      });
    }

    // 2. Specific team selected by admin, manager, or coordinator
    if (selectedTeamId) {
      const selectedEmpIds = new Set(
        employees.filter((e) => e.team_id === selectedTeamId).map((e) => e.id),
      );
      return assignments.filter((a) => {
        const inTeam = a.employee_id ? selectedEmpIds.has(a.employee_id) : false;
        const teamMatches = a.employee?.team_id === selectedTeamId;
        return inTeam || teamMatches;
      });
    }

    // 3. Coordinator view: tasks assigned by this coordinator or coordinator's team
    if (isCoordinator) {
      return assignments.filter((a) => {
        return (
          a.assigned_by === profile?.id ||
          (userTeamId && a.employee?.team_id === userTeamId)
        );
      });
    }

    // 4. Employee view
    if (profile?.role === "employee") {
      const myEmp = employees.find((e) => e.profile_id === profile?.id);
      return assignments.filter((a) => myEmp && a.employee_id === myEmp.id);
    }

    // 5. Default: admins, directors, managers, and flow force leads oversee all
    return assignments;
  }, [
    assignments,
    isProductionLead,
    userTeamId,
    userTeamEmployeeIds,
    selectedTeamId,
    isCoordinator,
    profile?.id,
    profile?.role,
    employees,
  ]);

  const scopedEmployees = useMemo(() => {
    if (isProductionLead && userTeamId) {
      return userTeamEmployees;
    }
    if (selectedTeamId) {
      return employees.filter((e) => e.team_id === selectedTeamId);
    }
    if (profile?.role === "employee") {
      return employees.filter((e) => e.profile_id === profile?.id);
    }
    return employees;
  }, [
    employees,
    isProductionLead,
    userTeamId,
    userTeamEmployees,
    selectedTeamId,
    profile?.role,
    profile?.id,
  ]);

  const scopedTasks = useMemo(() => {
    if (isProductionLead && userTeamId) {
      return tasks.filter((t) => {
        const projectTeamId = (t.project as any)?.team_id;
        const matchesProject = !projectTeamId || projectTeamId === userTeamId;
        const hasTeamAssignment =
          t.assignments?.some((a) => userTeamEmployeeIds.has(a.employee_id)) ||
          (t.assignment?.employee_id && userTeamEmployeeIds.has(t.assignment.employee_id));
        return matchesProject || hasTeamAssignment;
      });
    }
    if (selectedTeamId) {
      const selectedEmpIds = new Set(
        employees.filter((e) => e.team_id === selectedTeamId).map((e) => e.id),
      );
      return tasks.filter((t) => {
        const projectTeamId = (t.project as any)?.team_id;
        return (
          projectTeamId === selectedTeamId ||
          t.assignments?.some((a) => selectedEmpIds.has(a.employee_id))
        );
      });
    }
    return tasks;
  }, [
    tasks,
    isProductionLead,
    userTeamId,
    userTeamEmployeeIds,
    selectedTeamId,
    employees,
  ]);

  /* =======================================================
     FILTER ASSIGNMENTS
  ======================================================= */

  const filteredAssignments =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return scopedAssignments.filter(
        (assignment) => {
          const taskTitle =
            assignment.task?.title ||
            "";

          const employeeName =
            assignment.employee
              ?.full_name ||
            "";

          const employeeCode =
            assignment.employee
              ?.employee_code ||
            "";

          const matchesSearch =
            !normalizedSearch ||
            taskTitle
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employeeName
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employeeCode
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            !statusFilter ||
            assignment.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      scopedAssignments,
      search,
      statusFilter,
    ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    const assigned =
      scopedAssignments.filter(
        (assignment) =>
          assignment.status ===
          "assigned",
      ).length;

    const inProgress =
      scopedAssignments.filter(
        (assignment) =>
          assignment.status ===
          "in_progress",
      ).length;

    const completed =
      scopedAssignments.filter(
        (assignment) =>
          assignment.status ===
          "completed",
      ).length;

    const uniqueEmployees =
      new Set(
        scopedAssignments
          .filter(
            (assignment) =>
              assignment.status !==
              "rejected",
          )
          .map(
            (assignment) =>
              assignment.employee_id,
          ),
      ).size;

    return {
      total: scopedAssignments.length,
      assigned,
      inProgress,
      completed,
      uniqueEmployees,
    };
  }, [scopedAssignments]);

  /* =======================================================
     OPEN CREATE
  ======================================================= */

  const handleOpenCreate =
    () => {
      setEditingAssignment(null);
      setErrorMessage("");
      setFormOpen(true);
    };

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  const handleOpenEdit =
    (
      assignment: TaskAssignmentWithRelations,
    ) => {
      setEditingAssignment(
        assignment,
      );

      setErrorMessage("");
      setFormOpen(true);
    };

  /* =======================================================
     CLOSE FORM
  ======================================================= */

  const handleCloseForm =
    () => {
      if (formLoading) {
        return;
      }

      setFormOpen(false);
      setEditingAssignment(null);
      setErrorMessage("");
    };

  /* =======================================================
     CREATE ASSIGNMENT
  ======================================================= */

  const handleCreateAssignment =
    async (
      payload: CreateTaskAssignmentInput,
    ) => {
      setFormLoading(true);
      setErrorMessage("");

      try {
        await createTaskAssignment(
          payload,
        );

        await loadData();

        setFormOpen(false);
        setEditingAssignment(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to assign task.";

        setErrorMessage(message);

        throw error;
      } finally {
        setFormLoading(false);
      }
    };

  /* =======================================================
     STATUS CHANGE
  ======================================================= */

  const handleStatusChange =
    async (
      assignment: TaskAssignmentWithRelations,
      nextStatus: string,
    ) => {
      try {
        setErrorMessage("");

        const updated =
          await updateTaskAssignmentStatus(
            assignment.id,
            nextStatus,
          );

        setAssignments(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                assignment.id
                  ? {
                      ...item,
                      ...updated,
                    }
                  : item,
            ),
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to update assignment.",
        );
      }
    };

  /* =======================================================
     EDIT ASSIGNMENT
  ======================================================= */

  const handleEditAssignment =
    async (
      assignment: TaskAssignmentWithRelations,
      employeeId: string,
      notes: string,
    ) => {
      setFormLoading(true);
      setErrorMessage("");

      try {
        await updateTaskAssignment(
          assignment.id,
          {
            employee_id: employeeId,
            notes:
              notes.trim() ||
              null,
          },
        );

        await loadData();

        setFormOpen(false);
        setEditingAssignment(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to update assignment.",
        );
      } finally {
        setFormLoading(false);
      }
    };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters =
    () => {
      setSearch("");
      setStatusFilter("");
      if (!isProductionLead) {
        setSelectedTeamId("");
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              {isProductionLead ? "Your Team Workspace" : "Production Management"}
            </p>
            {isProductionLead && currentTeamName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 shadow-xs">
                <Users className="h-3 w-3" />
                {currentTeamName}
              </span>
            )}
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Team Work
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {isProductionLead && currentTeamName
              ? `Assign and track production tasks for your team (${currentTeamName}).`
              : "Assign production tasks to employees and track assignment progress across teams."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* REFRESH */}

          <button
            type="button"
            onClick={() =>
              void loadData()
            }
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>

          {/* NEW ASSIGNMENT */}

          <button
            type="button"
            onClick={
              handleOpenCreate
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />

            Assign Task
          </button>
        </div>
      </div>

      {/* ===================================================
          NO TEAM WARNING FOR LEAD
      =================================================== */}

      {isLead && !userTeamId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>No team assigned:</strong> Your account is registered as a team lead, but no team is currently linked to your profile. Please ask an administrator to assign your team in Team Members.
        </div>
      )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* ===================================================
          STATS
      =================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Assignments"
          value={stats.total}
          icon={
            <ClipboardList className="h-5 w-5" />
          }
        />

        <StatCard
          label="Assigned"
          value={stats.assigned}
          icon={
            <UserCheck className="h-5 w-5" />
          }
        />

        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={
            <ClockIcon className="h-5 w-5" />
          }
        />

        <StatCard
          label="Employees Working"
          value={
            stats.uniqueEmployees
          }
          icon={
            <Users className="h-5 w-5" />
          }
        />
      </div>

      {/* ===================================================
          FILTER BAR
      =================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search task, employee or employee code..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* TEAM SELECTOR (Admins, Managers, and Flow Force Leads) */}
          {(isAdminOrExec || isFlowForceLead) && (
            <select
              value={selectedTeamId}
              onChange={(event) =>
                setSelectedTeamId(
                  event.target.value,
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">
                All Teams
              </option>
              {teams.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                >
                  {t.name}
                </option>
              ))}
            </select>
          )}

          {/* PRODUCTION LEAD TEAM BADGE */}
          {isProductionLead && currentTeamName && (
            <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700">
              <Users className="h-4 w-4 text-slate-500" />
              <span>Team: {currentTeamName}</span>
            </div>
          )}

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">
              All Assignment Status
            </option>

            <option value="assigned">
              Assigned
            </option>

            <option value="accepted">
              Accepted
            </option>

            <option value="in_progress">
              In Progress
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="rejected">
              Rejected
            </option>
          </select>

          {/* CLEAR */}

          {(search ||
            statusFilter ||
            selectedTeamId) && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-3 text-xs text-slate-400">
          Showing{" "}
          <span className="font-semibold text-slate-600">
            {filteredAssignments.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-600">
            {scopedAssignments.length}
          </span>{" "}
          assignments
          {isProductionLead && currentTeamName && (
            <span> in {currentTeamName}</span>
          )}
        </div>
      </div>

      {/* ===================================================
          TABLE
      =================================================== */}

      <TaskAssignmentTable
        assignments={
          filteredAssignments
        }
        loading={loading}
        onEdit={
          handleOpenEdit
        }
        onStatusChange={
          handleStatusChange
        }
      />

      {/* ===================================================
          CREATE FORM
      =================================================== */}

      {!editingAssignment && (
        <TaskAssignmentForm
          open={formOpen}
          loading={formLoading}
          error={errorMessage}
          tasks={scopedTasks.map(
            (task) => ({
              id: task.id,
              title: task.title,
              category:
                task.category,
              priority:
                task.priority,
              status:
                task.status,
              planned_date:
                task.planned_date,
              due_date:
                task.due_date,
            }),
          )}
          employees={scopedEmployees.map(
            (employee) => ({
              id: employee.id,
              account_role: employee.account_role,
              full_name:
                employee.full_name,
              employee_code:
                employee.employee_code,
              email:
                employee.email,
              job_title:
                employee.job_title,
            }),
          )}
          onClose={
            handleCloseForm
          }
          onSubmit={
            handleCreateAssignment
          }
        />
      )}

      {/* ===================================================
          EDIT ASSIGNMENT MODAL
      =================================================== */}

      {editingAssignment && (
        <EditAssignmentModal
          open={formOpen}
          loading={formLoading}
          error={errorMessage}
          assignment={
            editingAssignment
          }
          employees={scopedEmployees}
          onClose={
            handleCloseForm
          }
          onSubmit={(
            employeeId,
            notes,
          ) =>
            handleEditAssignment(
              editingAssignment,
              employeeId,
              notes,
            )
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({
  label,
  value,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SIMPLE CLOCK ICON
========================================================= */

function ClockIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/* =========================================================
   EDIT ASSIGNMENT MODAL
========================================================= */

interface EditAssignmentModalProps {
  open: boolean;
  loading: boolean;
  error: string;
  assignment: TaskAssignmentWithRelations;
  employees: EmployeeWithTeam[];

  onClose: () => void;

  onSubmit: (
    employeeId: string,
    notes: string,
  ) => Promise<void>;
}

function EditAssignmentModal({
  open,
  loading,
  error,
  assignment,
  employees,
  onClose,
  onSubmit,
}: EditAssignmentModalProps) {
  const [employeeId, setEmployeeId] =
    useState(
      assignment.employee_id,
    );

  const [notes, setNotes] =
    useState(
      assignment.notes || "",
    );

  const [validationError, setValidationError] =
    useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setEmployeeId(
      assignment.employee_id,
    );

    setNotes(
      assignment.notes || "",
    );

    setValidationError("");
  }, [
    open,
    assignment,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown =
      (event: KeyboardEvent) => {
        if (
          event.key ===
            "Escape" &&
          !loading
        ) {
          onClose();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    loading,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setValidationError("");

    if (!employeeId) {
      setValidationError(
        "Please select an employee.",
      );

      return;
    }

    try {
      await onSubmit(
        employeeId,
        notes,
      );
    } catch {
      // Parent handles the error.
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Edit Assignment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Change the assigned employee
              or assignment notes.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
        >
          <div className="space-y-5 px-5 py-6 sm:px-6">
            {/* ERROR */}

            {(validationError ||
              error) && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {validationError ||
                  error}
              </div>
            )}

            {/* TASK */}

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Task
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {assignment.task
                  ?.title ||
                  "Unknown task"}
              </p>
            </div>

            {/* EMPLOYEE */}

            <div>
              <label
                htmlFor="edit-assignment-employee"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Assign To
              </label>

              <select
                id="edit-assignment-employee"
                value={employeeId}
                onChange={(event) =>
                  setEmployeeId(
                    event.target.value,
                  )
                }
                disabled={loading}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">
                  Select employee
                </option>

                {employees.map(
                  (employee) => (
                    <option
                      key={
                        employee.id
                      }
                      value={
                        employee.id
                      }
                    >
                      {
                        employee.full_name
                      }{" "}
                      —{" "}
                      {
                        employee.employee_code
                      }{employee.account_role ? ` - ${employee.account_role.replaceAll("_", " ")}` : ""}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* NOTES */}

            <div>
              <label
                htmlFor="edit-assignment-notes"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Assignment Notes
              </label>

              <textarea
                id="edit-assignment-notes"
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                disabled={loading}
                rows={4}
                placeholder="Add assignment instructions..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !employeeId
              }
              className="h-11 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskAssignments;