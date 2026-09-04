import {
  AlertCircle,
  CheckCircle2,
  FolderKanban,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import ProjectFilters from "../../components/projects/ProjectFilters";
import ProjectForm from "../../components/projects/ProjectForm";
import ProjectTable from "../../components/projects/ProjectTable";

import { getActiveClients } from "../../services/clients/clients.service";
import {
  getActiveEmployees,
} from "../../services/employees/employees.service";

import {
  createProject,
  getProjects,
  setProjectStatus,
  updateProject,
} from "../../services/projects/projects.service";

import type { Client } from "../../types/client";
import type { EmployeeWithTeam } from "../../types/employee";
import type {
  CreateProjectInput,
  ProjectWithRelations,
  UpdateProjectInput,
} from "../../types/project";


/* =========================================================
   PROJECT ENUM OPTIONS

   IMPORTANT:
   These should eventually match your PostgreSQL enums
   exactly. We already know project_status contains
   "planning" from your database definition.

   Until we retrieve all enum values, keep these minimal.
========================================================= */

const PROJECT_STATUS_OPTIONS = [
  "planning",
];

const PROJECT_HEALTH_OPTIONS = [
  "on_track",
];

const PROJECT_INVOICE_STATUS_OPTIONS = [
  "pending_billing",
];


/* =========================================================
   PAGE
========================================================= */

function Projects() {
  const [
    projects,
    setProjects,
  ] = useState<ProjectWithRelations[]>(
    [],
  );

  const [
    clients,
    setClients,
  ] = useState<Client[]>(
    [],
  );

  const [
    employees,
    setEmployees,
  ] = useState<EmployeeWithTeam[]>(
    [],
  );


  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    formLoading,
    setFormLoading,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingProject,
    setEditingProject,
  ] =
    useState<ProjectWithRelations | null>(
      null,
    );


  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    health,
    setHealth,
  ] = useState("");

  const [
    invoiceStatus,
    setInvoiceStatus,
  ] = useState("");


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  /* =======================================================
     LOAD DATA
  ======================================================== */

  const loadData = useCallback(
    async (
      showRefreshState = false,
    ) => {
      try {
        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");


        /*
         * Load each resource independently.
         *
         * This is important because a Projects RLS
         * failure should NOT prevent Clients and
         * Employees from loading into the form.
         */

        const [
          projectsResult,
          clientsResult,
          employeesResult,
        ] = await Promise.allSettled([
          getProjects(),
          getActiveClients(),
          getActiveEmployees(),
        ]);


        /* =================================================
           PROJECTS
        ================================================== */

        if (
          projectsResult.status ===
          "fulfilled"
        ) {
          setProjects(
            projectsResult.value,
          );
        } else {
          console.error(
            "Failed to load projects:",
            projectsResult.reason,
          );

          setProjects([]);

          setErrorMessage(
            projectsResult.reason instanceof Error
              ? projectsResult.reason.message
              : "Unable to load projects.",
          );
        }


        /* =================================================
           CLIENTS
        ================================================== */

        if (
          clientsResult.status ===
          "fulfilled"
        ) {
          setClients(
            clientsResult.value,
          );
        } else {
          console.error(
            "Failed to load clients:",
            clientsResult.reason,
          );

          setClients([]);

          /*
           * Only replace the main error if
           * projects themselves loaded successfully.
           */

          if (
            projectsResult.status ===
            "fulfilled"
          ) {
            setErrorMessage(
              clientsResult.reason instanceof Error
                ? clientsResult.reason.message
                : "Unable to load clients.",
            );
          }
        }


        /* =================================================
           EMPLOYEES
        ================================================== */

        if (
          employeesResult.status ===
          "fulfilled"
        ) {
          setEmployees(
            employeesResult.value,
          );
        } else {
          console.error(
            "Failed to load employees:",
            employeesResult.reason,
          );

          setEmployees([]);

          if (
            projectsResult.status ===
              "fulfilled" &&
            clientsResult.status ===
              "fulfilled"
          ) {
            setErrorMessage(
              employeesResult.reason instanceof Error
                ? employeesResult.reason.message
                : "Unable to load employees.",
            );
          }
        }
      } catch (error) {
        console.error(
          "Unexpected project page error:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load project data.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );


  useEffect(() => {
    void loadData();
  }, [loadData]);


  /* =======================================================
     FILTER PROJECTS
  ======================================================== */

  const filteredProjects =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return projects.filter(
        (project) => {
          const matchesSearch =
            !query ||
            project.name
              .toLowerCase()
              .includes(query) ||
            project.series_title
              ?.toLowerCase()
              .includes(query) ||
            project.client?.name
              ?.toLowerCase()
              .includes(query) ||
            project.client?.short_name
              ?.toLowerCase()
              .includes(query) ||
            project.lead_employee
              ?.full_name
              ?.toLowerCase()
              .includes(query);


          const matchesStatus =
            !status ||
            project.status ===
              status;


          const matchesHealth =
            !health ||
            project.health ===
              health;


          const matchesInvoice =
            !invoiceStatus ||
            project.invoice_status ===
              invoiceStatus;


          return (
            matchesSearch &&
            matchesStatus &&
            matchesHealth &&
            matchesInvoice
          );
        },
      );
    }, [
      projects,
      search,
      status,
      health,
      invoiceStatus,
    ]);


  /* =======================================================
     PROJECT STATISTICS
  ======================================================== */

  const stats = useMemo(() => {
    const total =
      projects.length;


    const active =
      projects.filter(
        (project) =>
          project.is_active,
      ).length;


    const completed =
      projects.filter(
        (project) => {
          const value =
            String(
              project.health,
            ).toLowerCase();

          return (
            value.includes(
              "complete",
            ) ||
            value ===
              "completed"
          );
        },
      ).length;


    const atRisk =
      projects.filter(
        (project) => {
          const value =
            String(
              project.health,
            ).toLowerCase();

          return (
            value.includes(
              "risk",
            ) ||
            value.includes(
              "delay",
            ) ||
            value.includes(
              "block",
            )
          );
        },
      ).length;


    return {
      total,
      active,
      completed,
      atRisk,
    };
  }, [projects]);


  /* =======================================================
     CREATE PROJECT
  ======================================================== */

  const handleCreate = () => {
    setEditingProject(null);
    setErrorMessage("");
    setSuccessMessage("");
    setFormOpen(true);
  };


  /* =======================================================
     EDIT PROJECT
  ======================================================== */

  const handleEdit = (
    project: ProjectWithRelations,
  ) => {
    setEditingProject(project);
    setErrorMessage("");
    setSuccessMessage("");
    setFormOpen(true);
  };


  /* =======================================================
     CLOSE FORM
  ======================================================== */

  const handleCloseForm = () => {
    if (formLoading) {
      return;
    }

    setFormOpen(false);
    setEditingProject(null);
    setErrorMessage("");
  };


  /* =======================================================
     SAVE PROJECT
  ======================================================== */

  const handleSubmitProject =
    async (
      data:
        | CreateProjectInput
        | UpdateProjectInput,
    ) => {
      try {
        setFormLoading(true);
        setErrorMessage("");


        if (editingProject) {
          await updateProject(
            editingProject.id,
            data as UpdateProjectInput,
          );

          setSuccessMessage(
            "Project updated successfully.",
          );
        } else {
          await createProject(
            data as CreateProjectInput,
          );

          setSuccessMessage(
            "Project created successfully.",
          );
        }


        setFormOpen(false);
        setEditingProject(null);


        await loadData();
      } catch (error) {
        console.error(
          "Failed to save project:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Unable to save project.";

        setErrorMessage(message);

        throw error;
      } finally {
        setFormLoading(false);
      }
    };


  /* =======================================================
     TOGGLE PROJECT STATUS
  ======================================================== */

  const handleToggleStatus =
    async (
      project: ProjectWithRelations,
    ) => {
      const nextStatus =
        !project.is_active;


      const action =
        nextStatus
          ? "activate"
          : "deactivate";


      const confirmed =
        window.confirm(
          `Are you sure you want to ${action} "${project.name}"?`,
        );


      if (!confirmed) {
        return;
      }


      try {
        setErrorMessage("");


        await setProjectStatus(
          project.id,
          nextStatus,
        );


        setSuccessMessage(
          nextStatus
            ? "Project activated successfully."
            : "Project deactivated successfully.",
        );


        await loadData();
      } catch (error) {
        console.error(
          "Failed to change project status:",
          error,
        );


        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to update project status.",
        );
      }
    };


  /* =======================================================
     CLEAR FILTERS
  ======================================================== */

  const handleClearFilters =
    () => {
      setSearch("");
      setStatus("");
      setHealth("");
      setInvoiceStatus("");
    };


  /* =======================================================
     DISMISS MESSAGES
  ======================================================== */

  const dismissSuccess =
    () => {
      setSuccessMessage("");
    };


  const dismissError =
    () => {
      setErrorMessage("");
    };


  /* =======================================================
     STAT CARD
  ======================================================== */

  const StatCard = ({
    label,
    value,
    icon: Icon,
    description,
  }: {
    label: string;
    value: number;
    icon: typeof FolderKanban;
    description: string;
  }) => {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

        <div className="flex items-start justify-between gap-3">

          <div>

            <p className="text-xs font-medium text-slate-400">
              {label}
            </p>

            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {value}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              {description}
            </p>

          </div>


          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">

            <Icon
              size={18}
              strokeWidth={1.8}
            />

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

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

        <div>

          <div className="flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">

              <FolderKanban
                size={17}
                strokeWidth={1.8}
              />

            </div>

            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
              Production Management
            </p>

          </div>


          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Projects
          </h1>


          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Manage clients, production projects,
            progress, deadlines and overall project
            health from one place.
          </p>

        </div>


        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() =>
              void loadData(true)
            }
            disabled={
              loading ||
              refreshing
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <RefreshCw
              size={15}
              strokeWidth={1.8}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            <span className="hidden sm:inline">
              Refresh
            </span>

          </button>


          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >

            <Plus
              size={16}
              strokeWidth={2}
            />

            New Project

          </button>

        </div>

      </div>


      {/* =================================================
          SUCCESS MESSAGE
      ================================================== */}

      {successMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">

          <div className="flex min-w-0 items-center gap-2.5">

            <CheckCircle2
              size={17}
              className="shrink-0 text-emerald-600"
              strokeWidth={1.8}
            />

            <p className="truncate text-sm font-medium text-emerald-700">
              {successMessage}
            </p>

          </div>


          <button
            type="button"
            onClick={
              dismissSuccess
            }
            className="shrink-0 text-emerald-500 hover:text-emerald-700"
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* =================================================
          ERROR MESSAGE
      ================================================== */}

      {errorMessage && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">

          <div className="flex min-w-0 items-start gap-2.5">

            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0 text-red-600"
              strokeWidth={1.8}
            />

            <div className="min-w-0">

              <p className="text-sm font-medium text-red-700">
                Something went wrong
              </p>

              <p className="mt-0.5 break-words text-xs leading-5 text-red-600">
                {errorMessage}
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={
              dismissError
            }
            className="shrink-0 text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* =================================================
          STATS
      ================================================== */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

        <StatCard
          label="Total Projects"
          value={stats.total}
          icon={FolderKanban}
          description="All projects"
        />

        <StatCard
          label="Active Projects"
          value={stats.active}
          icon={TrendingUp}
          description="Currently active"
        />

        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          description="Healthy / completed"
        />

        <StatCard
          label="At Risk"
          value={stats.atRisk}
          icon={Users}
          description="Needs attention"
        />

      </div>


      {/* =================================================
          FILTERS
      ================================================== */}

      <ProjectFilters
        search={search}
        status={status}
        health={health}
        invoiceStatus={
          invoiceStatus
        }
        statusOptions={
          PROJECT_STATUS_OPTIONS
        }
        healthOptions={
          PROJECT_HEALTH_OPTIONS
        }
        invoiceStatusOptions={
          PROJECT_INVOICE_STATUS_OPTIONS
        }
        onSearchChange={
          setSearch
        }
        onStatusChange={
          setStatus
        }
        onHealthChange={
          setHealth
        }
        onInvoiceStatusChange={
          setInvoiceStatus
        }
        onClearFilters={
          handleClearFilters
        }
      />


      {/* =================================================
          OVERVIEW
      ================================================== */}

      <div>

        <p className="text-sm font-semibold text-slate-900">
          Project Overview
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          Showing{" "}
          <span className="font-medium text-slate-600">
            {filteredProjects.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-600">
            {projects.length}
          </span>{" "}
          projects
        </p>

      </div>


      {/* =================================================
          PROJECT TABLE
      ================================================== */}

      <ProjectTable
        projects={
          filteredProjects
        }
        loading={loading}
        onEdit={
          handleEdit
        }
        onToggleStatus={
          handleToggleStatus
        }
      />


      {/* =================================================
          PROJECT FORM
      ================================================== */}

      <ProjectForm
        open={formOpen}
        project={
          editingProject
        }
        clients={clients}
        employees={employees}
        statusOptions={
          PROJECT_STATUS_OPTIONS
        }
        healthOptions={
          PROJECT_HEALTH_OPTIONS
        }
        invoiceStatusOptions={
          PROJECT_INVOICE_STATUS_OPTIONS
        }
        loading={
          formLoading
        }
        error={
          errorMessage
        }
        onClose={
          handleCloseForm
        }
        onSubmit={
          handleSubmitProject
        }
      />

    </div>
  );
}


export default Projects;