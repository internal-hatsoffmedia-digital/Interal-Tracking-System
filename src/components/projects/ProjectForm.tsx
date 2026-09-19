import {
  AlertCircle,
  Building2,
  CalendarDays,
  FileText,
  Loader2,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import type { Client } from "../../types/client";
import type {
  CreateProjectInput,
  ProjectWithRelations,
  UpdateProjectInput,
} from "../../types/project";
import type { EmployeeWithTeam } from "../../types/employee";


interface ProjectFormProps {
  open: boolean;

  project?: ProjectWithRelations | null;

  clients: Client[];

  employees: EmployeeWithTeam[];

  statusOptions: string[];

  healthOptions: string[];

  invoiceStatusOptions: string[];

  loading?: boolean;

  error?: string;

  onClose: () => void;

  onSubmit: (
    data:
      | CreateProjectInput
      | UpdateProjectInput,
  ) => void | Promise<void>;
}


interface ProjectFormState {
  client_id: string;
  name: string;
  series_title: string;
  description: string;
  total_assets_required: string;
  completed_assets: string;
  lead_employee_id: string;
  start_date: string;
  target_deadline: string;
  status: string;
  health: string;
  invoice_status: string;
}


const EMPTY_FORM: ProjectFormState = {
  client_id: "",
  name: "",
  series_title: "",
  description: "",
  total_assets_required: "0",
  completed_assets: "0",
  lead_employee_id: "",
  start_date: "",
  target_deadline: "",
  status: "",
  health: "",
  invoice_status: "",
};


function formatOption(
  value: string,
): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}


function ProjectForm({
  open,
  project = null,
  clients,
  employees,
  statusOptions,
  healthOptions,
  invoiceStatusOptions,
  loading = false,
  error = "",
  onClose,
  onSubmit,
}: ProjectFormProps) {
  const isEditing =
    Boolean(project);

  const [form, setForm] =
    useState<ProjectFormState>(
      EMPTY_FORM,
    );

  const [
    validationError,
    setValidationError,
  ] = useState("");


  /* =======================================================
     INITIALIZE FORM
  ======================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (project) {
      setForm({
        client_id:
          project.client_id ?? "",

        name:
          project.name ?? "",

        series_title:
          project.series_title ?? "",

        description:
          project.description ?? "",

        total_assets_required:
          String(
            project.total_assets_required ??
              0,
          ),

        completed_assets:
          String(
            project.completed_assets ??
              0,
          ),

        lead_employee_id:
          project.lead_employee_id ??
          "",

        start_date:
          project.start_date ?? "",

        target_deadline:
          project.target_deadline ?? "",

        status:
          project.status ?? "",

        health:
          project.health ?? "",

        invoice_status:
          project.invoice_status ?? "",
      });
    } else {
      setForm({
        ...EMPTY_FORM,

        status:
          statusOptions[0] ?? "",

        health:
          healthOptions[0] ?? "",

        invoice_status:
          invoiceStatusOptions[0] ??
          "",
      });
    }

    setValidationError("");
  }, [
    open,
    project,
    statusOptions,
    healthOptions,
    invoiceStatusOptions,
  ]);


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

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
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
     BODY SCROLL LOCK
  ======================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);


  /* =======================================================
     UPDATE FIELD
  ======================================================== */

  const updateField = (
    field: keyof ProjectFormState,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (validationError) {
      setValidationError("");
    }
  };


  /* =======================================================
     VALIDATION
  ======================================================== */

  const validate = () => {
    if (!form.client_id) {
      setValidationError(
        "Please select a client.",
      );

      return false;
    }

    if (!form.name.trim()) {
      setValidationError(
        "Project name is required.",
      );

      return false;
    }

    const total =
      Number(
        form.total_assets_required,
      );

    const completed =
      Number(
        form.completed_assets,
      );


    if (
      !Number.isFinite(total) ||
      total < 0
    ) {
      setValidationError(
        "Total assets must be a valid number.",
      );

      return false;
    }


    if (
      !Number.isFinite(completed) ||
      completed < 0
    ) {
      setValidationError(
        "Completed assets must be a valid number.",
      );

      return false;
    }


    if (completed > total) {
      setValidationError(
        "Completed assets cannot be greater than total assets.",
      );

      return false;
    }


    if (
      form.start_date &&
      form.target_deadline &&
      form.target_deadline <
        form.start_date
    ) {
      setValidationError(
        "Target deadline cannot be before the start date.",
      );

      return false;
    }


    if (!form.status) {
      setValidationError(
        "Please select a project status.",
      );

      return false;
    }


    if (!form.health) {
      setValidationError(
        "Please select the project health.",
      );

      return false;
    }


    if (!form.invoice_status) {
      setValidationError(
        "Please select the payment status.",
      );

      return false;
    }


    return true;
  };


  /* =======================================================
     SUBMIT
  ======================================================== */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setValidationError("");

    if (!validate()) {
      return;
    }


    const total =
      Math.max(
        0,
        Number(
          form.total_assets_required,
        ),
      );

    const completed =
      Math.max(
        0,
        Number(
          form.completed_assets,
        ),
      );


    const commonPayload = {
      client_id:
        form.client_id,

      name:
        form.name.trim(),

      series_title:
        form.series_title.trim() ||
        null,

      description:
        form.description.trim() ||
        null,

      total_assets_required:
        total,

      completed_assets:
        completed,

      pending_assets:
        Math.max(
          0,
          total - completed,
        ),

      ...(isEditing ? {} : { lead_employee_id: form.lead_employee_id || null }),

      start_date:
        form.start_date ||
        null,

      target_deadline:
        form.target_deadline ||
        null,

      status:
        form.status,

      health:
        form.health,

      invoice_status:
        form.invoice_status,
    };


    try {
      await onSubmit(
        commonPayload,
      );
    } catch {
      /*
       * The parent owns the actual
       * Supabase error state.
       */
    }
  };


  /* =======================================================
     CLOSED
  ======================================================== */

  if (!open) {
    return null;
  }


  const displayedError =
    validationError || error;


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">

      {/* =================================================
          BACKDROP
      ================================================== */}

      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onMouseDown={(event) => {
          if (
            event.target ===
              event.currentTarget &&
            !loading
          ) {
            onClose();
          }
        }}
      />


      {/* =================================================
          MODAL
      ================================================== */}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
      >

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">

              <FileText
                size={19}
                strokeWidth={1.8}
              />

            </div>


            <div className="min-w-0">

              <h2
                id="project-form-title"
                className="truncate text-base font-semibold text-slate-950"
              >
                {isEditing
                  ? "Edit Project"
                  : "Create Project"}
              </h2>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                {isEditing
                  ? "Update project details and progress."
                  : "Create a new project for your production workflow."}
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close project form"
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <X
              size={18}
              strokeWidth={1.8}
            />

          </button>

        </div>


        {/* =================================================
            FORM BODY
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >

          <div className="space-y-6 p-5 sm:p-6">

            {/* =================================================
                ERROR
            ================================================== */}

            {displayedError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3.5">

                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <div className="min-w-0">

                  <p className="text-xs font-medium text-red-700">
                    Unable to save project
                  </p>

                  <p className="mt-1 break-words text-xs leading-5 text-red-600">
                    {displayedError}
                  </p>

                </div>

              </div>
            )}


            {/* =================================================
                PROJECT INFORMATION
            ================================================== */}

            <section>

              <div className="mb-3">

                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Project Information
                </p>

              </div>


              <div className="grid gap-4 sm:grid-cols-2">

                {/* CLIENT */}

                <div>

                  <label
                    htmlFor="project-client"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Client
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <Building2
                      size={16}
                      strokeWidth={1.8}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      id="project-client"
                      value={
                        form.client_id
                      }
                      onChange={(event) =>
                        updateField(
                          "client_id",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >

                      <option value="">
                        Select client
                      </option>

                      {clients.map(
                        (client) => (
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

                </div>


                {/* PROJECT NAME */}

                <div>

                  <label
                    htmlFor="project-name"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Project Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="project-name"
                    type="text"
                    value={
                      form.name
                    }
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Episode 01"
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>


                {/* SERIES TITLE */}

                <div className="sm:col-span-2">

                  <label
                    htmlFor="project-series-title"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Project / Series Title
                  </label>

                  <input
                    id="project-series-title"
                    type="text"
                    value={
                      form.series_title
                    }
                    onChange={(event) =>
                      updateField(
                        "series_title",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Weekly Podcast Series"
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>


                {/* DESCRIPTION */}

                <div className="sm:col-span-2">

                  <label
                    htmlFor="project-description"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Description
                  </label>

                  <textarea
                    id="project-description"
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Briefly describe the project..."
                    disabled={loading}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>

              </div>

            </section>


            {/* =================================================
                PRODUCTION PROGRESS
            ================================================== */}

            <section>

              <div className="mb-3">

                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Production Progress
                </p>

              </div>


              <div className="grid gap-4 sm:grid-cols-3">

                {/* TOTAL */}

                <div>

                  <label
                    htmlFor="project-total-assets"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Total Assets
                  </label>

                  <input
                    id="project-total-assets"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.total_assets_required
                    }
                    onChange={(event) =>
                      updateField(
                        "total_assets_required",
                        event.target.value,
                      )
                    }
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>


                {/* COMPLETED */}

                <div>

                  <label
                    htmlFor="project-completed-assets"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Completed Assets
                  </label>

                  <input
                    id="project-completed-assets"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.completed_assets
                    }
                    onChange={(event) =>
                      updateField(
                        "completed_assets",
                        event.target.value,
                      )
                    }
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>


                {/* PENDING PREVIEW */}

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Pending Assets
                  </label>

                  <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-700">

                    {Math.max(
                      0,
                      Number(
                        form.total_assets_required ||
                          0,
                      ) -
                        Number(
                          form.completed_assets ||
                            0,
                        ),
                    )}

                  </div>

                </div>

              </div>


              <p className="mt-2 text-[11px] text-slate-400">
                Pending assets are calculated automatically from total and completed assets.
              </p>

            </section>


            {/* =================================================
                ASSIGNMENT & DATES
            ================================================== */}

            <section>

              <div className="mb-3">

                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Assignment & Timeline
                </p>

                {/* SERIES TITLE */}

                <div className="sm:col-span-2">

                  <label
                    htmlFor="project-series-title"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Project / Series Title
                  </label>

                  <input
                    id="project-series-title"
                    type="text"
                    value={
                      form.series_title
                    }
                    onChange={(event) =>
                      updateField(
                        "series_title",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Weekly Podcast Series"
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>


                {/* DESCRIPTION */}

                <div className="sm:col-span-2">

                  <label
                    htmlFor="project-description"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Description
                  </label>

                  <textarea
                    id="project-description"
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Briefly describe the project..."
                    disabled={loading}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>

              </div>

            </section>


            {/* =================================================
                PRODUCTION PROGRESS
            ================================================== */}

            <section>

              <div className="mb-3">

                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Production Progress
                </p>

              </div>


              <div className="grid gap-4 sm:grid-cols-3">

                {/* TOTAL */}

                <div>

                  <label
                    htmlFor="project-total-assets"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Total Assets
                  </label>

                  <input
                    id="project-total-assets"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.total_assets_required
                    }
                    onChange={(event) =>
                      updateField(
                        "total_assets_required",
                        event.target.value,
                      )
                    }
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>


                {/* COMPLETED */}

                <div>

                  <label
                    htmlFor="project-completed-assets"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Completed Assets
                  </label>

                  <input
                    id="project-completed-assets"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.completed_assets
                    }
                    onChange={(event) =>
                      updateField(
                        "completed_assets",
                        event.target.value,
                      )
                    }
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>


                {/* PENDING PREVIEW */}

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Pending Assets
                  </label>

                  <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-700">

                    {Math.max(
                      0,
                      Number(
                        form.total_assets_required ||
                          0,
                      ) -
                        Number(
                          form.completed_assets ||
                            0,
                        ),
                    )}

                  </div>

                </div>

              </div>


              <p className="mt-2 text-[11px] text-slate-400">
                Pending assets are calculated automatically from total and completed assets.
              </p>

            </section>


            {/* =================================================
                ASSIGNMENT & DATES
            ================================================== */}

            <section>

              <div className="mb-3">

                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Assignment & Timeline
                </p>

              </div>


              <div className="grid gap-4 sm:grid-cols-2">

                {/* LEAD ARTIST */}

                <div>

                  <label
                    htmlFor="project-lead"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    {isEditing ? 'Legacy lead (managed in Assignments & shared access)' : 'Initial Project Coordinator'}
                  </label>

                  <div className="relative">

                    <UserRound
                      size={16}
                      strokeWidth={1.8}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      id="project-lead"
                      aria-describedby={!isEditing && employees.length === 0 ? 'project-coordinator-setup' : undefined}
                      value={
                        form.lead_employee_id
                      }
                      onChange={(event) =>
                        updateField(
                          "lead_employee_id",
                          event.target.value,
                        )
                      }
                      disabled={loading || isEditing}
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >

                      <option value="">
                        Not assigned
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
                            }
                            {employee.employee_code
                              ? ` (${employee.employee_code})`
                              : ""}
                          </option>
                        ),
                      )}

                    </select>

                    {!isEditing && employees.length === 0 && (
                      <p id="project-coordinator-setup" role="status" className="mt-2 text-sm text-amber-800">
                        No eligible project coordinators are available. In Settings → Access Management, verify an active Project Coordinator profile and team, then link that profile to its employee record in Employees. Reopen this form after updating the mapping.
                      </p>
                    )}

                  </div>

                </div>


                {/* START DATE */}

                <div>

                  <label
                    htmlFor="project-start-date"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Start Date
                  </label>

                  <div className="relative">

                    <CalendarDays
                      size={16}
                      strokeWidth={1.8}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="project-start-date"
                      type="date"
                      value={
                        form.start_date
                      }
                      onChange={(event) =>
                        updateField(
                          "start_date",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                  </div>

                </div>


                {/* TARGET DEADLINE */}

                <div className="sm:col-span-2">

                  <label
                    htmlFor="project-deadline"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Target Deadline
                  </label>

                  <div className="relative">

                    <CalendarDays
                      size={16}
                      strokeWidth={1.8}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="project-deadline"
                      type="date"
                      value={
                        form.target_deadline
                      }
                      onChange={(event) =>
                        updateField(
                          "target_deadline",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                  </div>

                </div>

              </div>

            </section>


            {/* =================================================
                STATUS
            ================================================== */}

            <section>

              <div className="mb-3">

                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Project Status
                </p>

              </div>


              <div className="grid gap-4 sm:grid-cols-3">

                {/* STATUS */}

                <div>

                  <label
                    htmlFor="project-status"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Status
                  </label>

                  <select
                    id="project-status"
                    value={
                      form.status
                    }
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value,
                      )
                    }
                    disabled={loading}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >

                    <option value="">
                      Select status
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

                  <label
                    htmlFor="project-health"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Overall Health
                  </label>

                  <select
                    id="project-health"
                    value={
                      form.health
                    }
                    onChange={(event) =>
                      updateField(
                        "health",
                        event.target.value,
                      )
                    }
                    disabled={loading}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >

                    <option value="">
                      Select health
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


                {/* PAYMENT */}

                <div>

                  <label
                    htmlFor="project-payment"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Payment Status
                  </label>

                  <select
                    id="project-payment"
                    value={
                      form.invoice_status
                    }
                    onChange={(event) =>
                      updateField(
                        "invoice_status",
                        event.target.value,
                      )
                    }
                    disabled={loading}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >

                    <option value="">
                      Select payment status
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

            </section>

          </div>


          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {loading
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Project"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


export default ProjectForm;
