import {
  CalendarDays,
  FileText,
  FolderKanban,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Client } from "../../types/client";
import type { EmployeeWithTeam } from "../../types/employee";
import type {
  CreateTaskInput,
  TaskWithRelations,
  UpdateTaskInput,
} from "../../types/task";

interface SelectOption {
  value: string;
  label: string;
}

interface ProjectOption {
  id: string;
  name: string;
  series_title: string | null;
  client_id: string;
}

interface TaskFormProps {
  open: boolean;

  task?: TaskWithRelations | null;

  loading: boolean;

  error: string;

  clients: Client[];

  projects: ProjectOption[];

  employees: EmployeeWithTeam[];

  categoryOptions: SelectOption[];

  revisionStatusOptions: SelectOption[];

  priorityOptions: SelectOption[];

  statusOptions: SelectOption[];

  onClose: () => void;

  onSubmit: (
    data:
      | CreateTaskInput
      | UpdateTaskInput,
    assignedEmployeeId: string | null,
    assignmentNotes: string,
  ) => Promise<void>;
}

/* =========================================================
   LABEL FORMATTER
========================================================= */

function formatLabel(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text = String(value);

  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

/* =========================================================
   INPUT CLASS
========================================================= */

const inputClass = `
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
  placeholder:text-slate-400
  focus:border-slate-400
  focus:ring-2
  focus:ring-slate-100
`;

/* =========================================================
   TEXTAREA CLASS
========================================================= */

const textareaClass = `
  min-h-[100px]
  w-full
  resize-y
  rounded-xl
  border
  border-slate-200
  bg-white
  px-3
  py-3
  text-sm
  font-medium
  text-slate-700
  outline-none
  transition
  placeholder:text-slate-400
  focus:border-slate-400
  focus:ring-2
  focus:ring-slate-100
`;

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </div>

      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </h3>
    </div>
  );
}

/* =========================================================
   TASK FORM
========================================================= */

function TaskForm({
  open,
  task,
  loading,
  error,
  clients,
  projects,
  employees,
  categoryOptions,
  revisionStatusOptions,
  priorityOptions,
  statusOptions,
  onClose,
  onSubmit,
}: TaskFormProps) {
  const isEdit =
    Boolean(task);

  /* =======================================================
     FORM STATE
  ======================================================== */

  const [
    clientId,
    setClientId,
  ] = useState("");

  const [
    projectId,
    setProjectId,
  ] = useState("");

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("");

  const [
    revisionStatus,
    setRevisionStatus,
  ] = useState("");

  const [
    priority,
    setPriority,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    plannedDate,
    setPlannedDate,
  ] = useState("");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    dueDate,
    setDueDate,
  ] = useState("");

  const [
    estimatedHours,
    setEstimatedHours,
  ] = useState("0");

  const [
    actualHours,
    setActualHours,
  ] = useState("0");

  const [
    footageLink,
    setFootageLink,
  ] = useState("");

  const [
    specialNotes,
    setSpecialNotes,
  ] = useState("");

  const [
    delayReason,
    setDelayReason,
  ] = useState("");

  /* =======================================================
     ASSIGNMENT STATE
  ======================================================== */

  const [
    assignedEmployeeId,
    setAssignedEmployeeId,
  ] = useState("");

  const [
    assignmentNotes,
    setAssignmentNotes,
  ] = useState("");

  const [
    formError,
    setFormError,
  ] = useState("");

  /* =======================================================
     RESET / POPULATE FORM
  ======================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormError("");

    if (task) {
      setClientId(
        task.client_id ?? "",
      );

      setProjectId(
        task.project_id ?? "",
      );

      setTitle(
        task.title ?? "",
      );

      setDescription(
        task.description ?? "",
      );

      setCategory(
        task.category ?? "",
      );

      setRevisionStatus(
        task.revision_status ?? "",
      );

      setPriority(
        task.priority ?? "",
      );

      setStatus(
        task.status ?? "",
      );

      setPlannedDate(
        task.planned_date ?? "",
      );

      setStartDate(
        task.start_date
          ? formatDateTimeLocal(
              task.start_date,
            )
          : "",
      );

      setDueDate(
        task.due_date
          ? formatDateTimeLocal(
              task.due_date,
            )
          : "",
      );

      setEstimatedHours(
        String(
          task.estimated_hours ??
            0,
        ),
      );

      setActualHours(
        String(
          task.actual_hours ??
            0,
        ),
      );

      setFootageLink(
        task.footage_link ?? "",
      );

      setSpecialNotes(
        task.special_notes ?? "",
      );

      setDelayReason(
        task.delay_reason ?? "",
      );

      /*
       * Assignment is handled separately.
       * When editing a task, the assignment
       * can be managed from Task Assignments.
       */

      setAssignedEmployeeId("");

      setAssignmentNotes("");
    } else {
      setClientId("");

      setProjectId("");

      setTitle("");

      setDescription("");

      setCategory(
        categoryOptions[0]?.value ??
          "",
      );

      setRevisionStatus(
        revisionStatusOptions[0]
          ?.value ?? "",
      );

      setPriority(
        priorityOptions[0]?.value ??
          "",
      );

      setStatus(
        statusOptions[0]?.value ??
          "",
      );

      setPlannedDate("");

      setStartDate("");

      setDueDate("");

      setEstimatedHours("0");

      setActualHours("0");

      setFootageLink("");

      setSpecialNotes("");

      setDelayReason("");

      setAssignedEmployeeId("");

      setAssignmentNotes("");
    }
  }, [
    open,
    task,
    categoryOptions,
    revisionStatusOptions,
    priorityOptions,
    statusOptions,
  ]);

  /* =======================================================
     BODY SCROLL LOCK
  ======================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, [open]);

  /* =======================================================
     ESCAPE KEY
  ======================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape" &&
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

  /* =======================================================
     FILTER PROJECTS BY CLIENT
  ======================================================== */

  const filteredProjects =
    useMemo(() => {
      if (!clientId) {
        return [];
      }

      return projects.filter(
        (project) =>
          project.client_id ===
          clientId,
      );
    }, [
      projects,
      clientId,
    ]);

  /* =======================================================
     CLIENT CHANGE
  ======================================================== */

  const handleClientChange = (
    value: string,
  ) => {
    setClientId(value);

    /*
     * Always reset project when
     * client changes.
     */

    setProjectId("");
  };

  /* =======================================================
     PROJECT CHANGE
  ======================================================== */

  const handleProjectChange = (
    value: string,
  ) => {
    setProjectId(value);

    const selectedProject =
      projects.find(
        (project) =>
          project.id === value,
      );

    if (
      selectedProject &&
      selectedProject.client_id !==
        clientId
    ) {
      setClientId(
        selectedProject.client_id,
      );
    }
  };

  /* =======================================================
     SUBMIT
  ======================================================== */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setFormError("");

    const cleanTitle =
      title.trim();

    if (!clientId) {
      setFormError(
        "Please select a client.",
      );
      return;
    }

    if (!projectId) {
      setFormError(
        "Please select a project.",
      );
      return;
    }

    if (!cleanTitle) {
      setFormError(
        "Please enter a task title.",
      );
      return;
    }

    if (!category) {
      setFormError(
        "Please select a category.",
      );
      return;
    }

    if (!revisionStatus) {
      setFormError(
        "Please select a revision status.",
      );
      return;
    }

    if (!priority) {
      setFormError(
        "Please select a priority.",
      );
      return;
    }

    if (!status) {
      setFormError(
        "Please select a production status.",
      );
      return;
    }

    const estimated =
      Number(
        estimatedHours,
      );

    const actual =
      Number(
        actualHours,
      );

    if (
      Number.isNaN(
        estimated,
      ) ||
      estimated < 0
    ) {
      setFormError(
        "Estimated hours must be 0 or greater.",
      );
      return;
    }

    if (
      Number.isNaN(
        actual,
      ) ||
      actual < 0
    ) {
      setFormError(
        "Actual hours must be 0 or greater.",
      );
      return;
    }

    if (
      plannedDate &&
      dueDate &&
      new Date(
        dueDate,
      ).getTime() <
        new Date(
          `${plannedDate}T00:00:00`,
        ).getTime()
    ) {
      setFormError(
        "Deadline cannot be before the planned date.",
      );
      return;
    }

    const payload:
      | CreateTaskInput
      | UpdateTaskInput = {
      project_id:
        projectId,

      client_id:
        clientId,

      title:
        cleanTitle,

      description:
        description.trim() ||
        null,

      category,

      revision_status:
        revisionStatus,

      priority,

      status,

      planned_date:
        plannedDate ||
        null,

      start_date:
        startDate
          ? new Date(
              startDate,
            ).toISOString()
          : null,

      due_date:
        dueDate
          ? new Date(
              dueDate,
            ).toISOString()
          : null,

      estimated_hours:
        estimated,

      actual_hours:
        actual,

      footage_link:
        footageLink.trim() ||
        null,

      special_notes:
        specialNotes.trim() ||
        null,

      delay_reason:
        delayReason.trim() ||
        null,
    };

    try {
      await onSubmit(
        payload,
        assignedEmployeeId ||
          null,
        assignmentNotes.trim(),
      );
    } catch (submitError) {
      setFormError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to save task.",
      );
    }
  };

  /* =======================================================
     DON'T RENDER
  ======================================================== */

  if (!open) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-slate-950/50
        p-4
        backdrop-blur-[2px]
      "
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
      <div
        className="
          flex
          max-h-[calc(100vh-32px)]
          w-full
          max-w-4xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >
        {/* =================================================
            HEADER
        ================================================== */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
              <FileText
                size={21}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit
                  ? "Edit Task"
                  : "Create Task"}
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                {isEdit
                  ? "Update production task details."
                  : "Create a task for your production workflow."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              disabled:opacity-40
            "
          >
            <X
              size={19}
            />
          </button>
        </div>

        {/* =================================================
            FORM BODY
        ================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-7 p-6">
            {/* =============================================
                ERROR
            ============================================== */}

            {(formError ||
              error) && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p className="font-semibold">
                  Unable to save task
                </p>

                <p className="mt-1">
                  {formError ||
                    error}
                </p>
              </div>
            )}

            {/* =============================================
                TASK INFORMATION
            ============================================== */}

            <section>
              <SectionHeader
                icon={
                  <FolderKanban
                    size={16}
                  />
                }
                title="Task Information"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* CLIENT */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Client{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      clientId
                    }
                    onChange={(
                      event,
                    ) =>
                      handleClientChange(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      Select client
                    </option>

                    {clients.map(
                      (
                        client,
                      ) => (
                        <option
                          key={
                            client.id
                          }
                          value={
                            client.id
                          }
                        >
                          {client.name}
                          {client.short_name
                            ? ` (${client.short_name})`
                            : ""}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* PROJECT */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Project{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      projectId
                    }
                    onChange={(
                      event,
                    ) =>
                      handleProjectChange(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading ||
                      !clientId
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      {!clientId
                        ? "Select client first"
                        : filteredProjects.length ===
                            0
                          ? "No active projects"
                          : "Select project"}
                    </option>

                    {filteredProjects.map(
                      (
                        project,
                      ) => (
                        <option
                          key={
                            project.id
                          }
                          value={
                            project.id
                          }
                        >
                          {project.name}
                          {project.series_title
                            ? ` — ${project.series_title}`
                            : ""}
                        </option>
                      ),
                    )}
                  </select>

                  {clientId &&
                    filteredProjects.length ===
                      0 && (
                      <p className="mt-1.5 text-[11px] text-amber-600">
                        No active project
                        is available
                        for this client.
                      </p>
                    )}
                </div>

                {/* TITLE */}

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Task Title{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      title
                    }
                    onChange={(
                      event,
                    ) =>
                      setTitle(
                        event.target
                          .value,
                      )
                    }
                    placeholder="e.g. Episode 101 — Final Edit"
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Description
                  </label>

                  <textarea
                    value={
                      description
                    }
                    onChange={(
                      event,
                    ) =>
                      setDescription(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Describe the work required..."
                    disabled={
                      loading
                    }
                    className={
                      textareaClass
                    }
                  />
                </div>
              </div>
            </section>

            {/* =============================================
                PRODUCTION
            ============================================== */}

            <section>
              <SectionHeader
                icon={
                  <FileText
                    size={16}
                  />
                }
                title="Production"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* CATEGORY */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Category{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      category
                    }
                    onChange={(
                      event,
                    ) =>
                      setCategory(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  >
                    {categoryOptions.map(
                      (
                        option,
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {formatLabel(
                            option.label ||
                              option.value,
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* REVISION */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Revision Status{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      revisionStatus
                    }
                    onChange={(
                      event,
                    ) =>
                      setRevisionStatus(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  >
                    {revisionStatusOptions.map(
                      (
                        option,
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {formatLabel(
                            option.label ||
                              option.value,
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* PRIORITY */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Priority{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      priority
                    }
                    onChange={(
                      event,
                    ) =>
                      setPriority(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  >
                    {priorityOptions.map(
                      (
                        option,
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {formatLabel(
                            option.label ||
                              option.value,
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* STATUS */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Production Status{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      status
                    }
                    onChange={(
                      event,
                    ) =>
                      setStatus(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  >
                    {statusOptions.map(
                      (
                        option,
                      ) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {formatLabel(
                            option.label ||
                              option.value,
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
            </section>

            {/* =============================================
                ASSIGNMENT
            ============================================== */}

            <section>
              <SectionHeader
                icon={
                  <UserRound
                    size={16}
                  />
                }
                title="Assignment"
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* ASSIGNED TO */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Assigned To
                      {!isEdit && (
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      )}
                    </label>

                    <select
                      value={
                        assignedEmployeeId
                      }
                      onChange={(
                        event,
                      ) =>
                        setAssignedEmployeeId(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        loading
                      }
                      className={
                        inputClass
                      }
                    >
                      <option value="">
                        Select team member
                      </option>

                      {employees.map(
                        (
                          employee,
                        ) => (
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
                            }
                            {employee.employee_code
                              ? ` (${employee.employee_code})`
                              : ""}
                          </option>
                        ),
                      )}
                    </select>

                    {!isEdit &&
                      employees.length ===
                        0 && (
                        <p className="mt-1.5 text-[11px] text-amber-600">
                          No active team
                          members found.
                        </p>
                      )}
                  </div>

                  {/* ASSIGNMENT NOTES */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Assignment Notes
                    </label>

                    <input
                      type="text"
                      value={
                        assignmentNotes
                      }
                      onChange={(
                        event,
                      ) =>
                        setAssignmentNotes(
                          event.target
                            .value,
                        )
                      }
                      placeholder="e.g. Complete first cut before 4 PM"
                      disabled={
                        loading
                      }
                      className={
                        inputClass
                      }
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <UserRound
                    size={15}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <p className="text-[11px] leading-5 text-slate-500">
                    Only Admin and Project
                    Coordinator should assign
                    production tasks. The
                    assigned team member will
                    see this task in{" "}
                    <span className="font-semibold text-slate-700">
                      My Work
                    </span>
                    .
                  </p>
                </div>
              </div>
            </section>

            {/* =============================================
                SCHEDULE & EFFORT
            ============================================== */}

            <section>
              <SectionHeader
                icon={
                  <CalendarDays
                    size={16}
                  />
                }
                title="Schedule & Effort"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* PLANNED DATE */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Planned Date
                  </label>

                  <input
                    type="date"
                    value={
                      plannedDate
                    }
                    onChange={(
                      event,
                    ) =>
                      setPlannedDate(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* START */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Start Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      startDate
                    }
                    onChange={(
                      event,
                    ) =>
                      setStartDate(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* DEADLINE */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Delivery Deadline
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      dueDate
                    }
                    onChange={(
                      event,
                    ) =>
                      setDueDate(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* ESTIMATED */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Estimated Hours
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={
                      estimatedHours
                    }
                    onChange={(
                      event,
                    ) =>
                      setEstimatedHours(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* ACTUAL */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Actual Hours
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={
                      actualHours
                    }
                    onChange={(
                      event,
                    ) =>
                      setActualHours(
                        event.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  />
                </div>
              </div>
            </section>

            {/* =============================================
                ASSETS & NOTES
            ============================================== */}

            <section>
              <SectionHeader
                icon={
                  <FileText
                    size={16}
                  />
                }
                title="Assets & Notes"
              />

              <div className="grid grid-cols-1 gap-4">
                {/* FOOTAGE LINK */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Footage / Asset Link
                  </label>

                  <input
                    type="url"
                    value={
                      footageLink
                    }
                    onChange={(
                      event,
                    ) =>
                      setFootageLink(
                        event.target
                          .value,
                      )
                    }
                    placeholder="https://drive.google.com/..."
                    disabled={
                      loading
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                {/* SPECIAL NOTES */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Special Notes
                  </label>

                  <textarea
                    value={
                      specialNotes
                    }
                    onChange={(
                      event,
                    ) =>
                      setSpecialNotes(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Additional production instructions..."
                    disabled={
                      loading
                    }
                    className={
                      textareaClass
                    }
                  />
                </div>

                {/* DELAY REASON */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Delay / Hold Reason
                  </label>

                  <textarea
                    value={
                      delayReason
                    }
                    onChange={(
                      event,
                    ) =>
                      setDelayReason(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Mention the reason if this task is delayed or on hold..."
                    disabled={
                      loading
                    }
                    className={
                      textareaClass
                    }
                  />
                </div>
              </div>
            </section>
          </div>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={
                loading
              }
              className="
                h-10
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                font-semibold
                text-slate-600
                transition
                hover:bg-slate-50
                hover:text-slate-900
                disabled:opacity-40
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading
              }
              className="
                inline-flex
                h-10
                items-center
                justify-center
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
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <FileText
                    size={16}
                  />
                  {isEdit
                    ? "Save Changes"
                    : "Create Task"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   DATETIME LOCAL FORMATTER
========================================================= */

function formatDateTimeLocal(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  const hours = String(
    date.getHours(),
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default TaskForm;