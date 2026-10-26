import {supabase} from '../../lib/supabase';
import {projectRequirementError} from '../../lib/projectRequirements';
import {taskCategories} from '../../lib/taskCategories';
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
  useRef,
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
  monthlyTeamProject?:boolean;
  selfCoordinator?:boolean;

  project?: ProjectWithRelations | null;

  clients: Client[];
  teams: {id:string;name:string}[];

  employees: EmployeeWithTeam[];

  statusOptions: string[];

  healthOptions: string[];

  invoiceStatusOptions: string[];

  loading?: boolean;

  error?: string;

  onClose: () => void;
  onDelete?:()=>void;
  onManageAssignments?: () => void;

  onSubmit: (
    data:
      | CreateProjectInput
      | UpdateProjectInput,
  ) => void | Promise<void>;
}


interface ProjectFormState {
  billing_month:string;
  sales_credit_team_id:string;
  completed_by_profile_id:string;
  production_team_ids: string[];
  project_code: string;
  category: string;
  final_link: string;
  remarks: string;
  started_at: string;
  ended_at: string;
  rate: string;

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
  billing_month:new Date(Date.now()+19800000).toISOString().slice(0,7),
  sales_credit_team_id:"",
  completed_by_profile_id:"",
  production_team_ids: [],
  project_code: "",
  category: "",
  final_link: "",
  remarks: "",
  started_at: "",
  ended_at: "",
  rate: "",

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
  if(value==='internal_review')return 'Internal QC';
  if(value==='client_review')return 'Client approval';
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}


function ProjectForm({
  open,
  monthlyTeamProject=false,
  selfCoordinator=false,
  project = null,
  clients,
  teams,
  employees,
  statusOptions,
  healthOptions,
  invoiceStatusOptions,
  loading = false,
  error = "",
  onClose,
  onDelete,
  onManageAssignments,
  onSubmit,
}: ProjectFormProps) {
  const [completionPeople,setCompletionPeople]=useState<{id:string;name:string;employee_code?:string}[]>([]);
  const [completionError,setCompletionError]=useState('');
  useEffect(()=>{let active=true;if(!open||!project?.id)return;void supabase.rpc('project_completion_people',{p_project:project.id}).then(r=>{if(active){setCompletionPeople(r.data??[]);setCompletionError(r.error?r.error.message:'');}});return()=>{active=false;};},[open,project?.id]);
  const isMonthly=project?.monthly_team_project??monthlyTeamProject;
  const productionTeams=isMonthly?teams.filter(t=>["Digital Ninjas - M","Digital Ninjas - W"].includes(t.name)):teams;
  const isEditing =
    Boolean(project);

  const initialStatus = statusOptions[0] ?? "";
  const initialHealth = healthOptions[0] ?? "";
  const initialInvoiceStatus = invoiceStatusOptions[0] ?? "";

  const [form, setForm] =
    useState<ProjectFormState>(
      EMPTY_FORM,
    );

  const periodStart=isMonthly?form.billing_month+'-01':form.start_date;
  const periodEnd=isMonthly&&/^\d{4}-(0[1-9]|1[0-2])$/.test(form.billing_month)?new Date(Date.UTC(Number(form.billing_month.slice(0,4)),Number(form.billing_month.slice(5,7)),0)).toISOString().slice(0,10):form.target_deadline;

  const [
    validationError,
    setValidationError,
  ] = useState("");


  /* =======================================================
     INITIALIZE FORM
  ======================================================== */

  const initializedForm=useRef<string|null>(null);
  useEffect(() => {
    if (!open) {initializedForm.current=null;return;}
    const key=project?.id||'new-project';if(initializedForm.current===key)return;initializedForm.current=key;

    if (project) {
      setForm({
        billing_month:project.billing_month?.slice(0,7)||EMPTY_FORM.billing_month,
        sales_credit_team_id:project.sales_credit_team_id||"",
        completed_by_profile_id:project.completed_by_profile_id||"",
        production_team_ids: project.production_team_ids ?? [],
        project_code: String(project.project_code ?? ""),
        category: String(project.category ?? ""),
        final_link: String(project.final_link ?? ""),
        remarks: String(project.remarks ?? ""),
        started_at: project.started_at ? new Date(project.started_at).toLocaleString("sv-SE").slice(0,16).replace(" ","T") : "",
        ended_at: project.ended_at ? new Date(project.ended_at).toLocaleString("sv-SE").slice(0,16).replace(" ","T") : "",
        rate: String(project.rate ?? ""),
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
          initialStatus,

        health:
          initialHealth,

        invoice_status:
          initialInvoiceStatus,
      });
    }

    setValidationError("");
  }, [
    open,
    project,
    initialStatus,
    initialHealth,
    initialInvoiceStatus,
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
    if(isMonthly&&!/^\d{4}-\d{2}$/.test(form.billing_month)){setValidationError('Choose the full project month.');return false;}
    if(form.status==='completed'){
      if(!project){setValidationError('Create the project first. Then edit it to confirm final completion and sales credit.');return false;}
      if(isMonthly?(!form.sales_credit_team_id||!form.production_team_ids.includes(form.sales_credit_team_id)):!form.completed_by_profile_id){setValidationError(isMonthly?'Select the team to credit.':'Select the employee who completed this project.');return false;}
    }
    const requiredError=projectRequirementError(form);
    if(requiredError){setValidationError(requiredError);return false;}

    if (form.rate !== "" && (!Number.isFinite(Number(form.rate)) || Number(form.rate) < 0)) { setValidationError("Rate must be a non-negative number."); return false; }


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


    const commonPayload = {

      monthly_team_project:isMonthly,billing_month:isMonthly?form.billing_month+'-01':null,
      ...(form.status==='completed'?(isMonthly?{sales_credit_team_id:form.sales_credit_team_id}:{completed_by_profile_id:form.completed_by_profile_id}):{}),
      category: form.category.trim() || null,
      final_link: form.final_link.trim() || null,
      remarks: form.remarks.trim() || null,

      rate: form.rate === "" ? null : Number(form.rate),
      client_id:
        form.client_id,

      name:
        form.name.trim(),

      description:
        form.description.trim() ||
        null,

      production_team_ids: form.production_team_ids,
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


            <section aria-label="Project tracker details"><h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Project tracker details</h3><div className="grid gap-4 sm:grid-cols-2">
<label className="grid gap-1.5 text-xs font-medium text-slate-600" htmlFor="tracker-project_code">Project ID<input id="tracker-project_code" type="text" value={form.project_code || "Generated when project is created"} readOnly className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900" /></label>
<datalist id="project-category-options">{taskCategories.map(c=><option key={c.value} value={c.label}/>)}</datalist><label className="grid gap-1.5 text-xs font-medium text-slate-600" htmlFor="tracker-category">Category<input id="tracker-category" type="text" list="project-category-options"  value={form.category} onChange={e => updateField("category", e.target.value)} disabled={loading} className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900" /></label>
<label className="grid gap-1.5 text-xs font-medium text-slate-600" htmlFor="tracker-final_link">Final Link<input id="tracker-final_link" type="url"  value={form.final_link} onChange={e => updateField("final_link", e.target.value)} disabled={loading} className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900" /></label>
<label className="grid gap-1.5 text-xs font-medium text-slate-600" htmlFor="tracker-remarks">Remarks<input id="tracker-remarks" type="text"  value={form.remarks} onChange={e => updateField("remarks", e.target.value)} disabled={loading} className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900" /></label>
<label className="grid gap-1.5 text-xs font-medium text-slate-600" htmlFor="tracker-rate">Rate (INR) *<input id="tracker-rate" required type="number" min="0" step="0.01" value={form.rate} onChange={e => updateField("rate", e.target.value)} disabled={loading} className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900" /></label>
</div><p className="mt-2 text-xs text-slate-500">Production times are recorded through work tracking. Delivery Date is the client deadline. Rate is saved once per project in INR. Every task under this project uses the same rate, including work continued on another day.</p></section>
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

                {isMonthly&&<label className="sm:col-span-2 grid gap-2 text-sm">Project month *<input aria-label="Project month" type="month" required value={form.billing_month} onChange={e=>updateField('billing_month',e.target.value)} disabled={loading} className="h-11 rounded-xl border px-3"/><small className="text-slate-500">Covers the full calendar month. Choose the team to credit when the project is completed.</small></label>}
                <fieldset className="sm:col-span-2 rounded-xl border p-4"><legend className="px-2 text-sm font-semibold">Production teams *</legend><p className="mb-3 text-xs text-slate-500">Select every team working on this project. Assign individual employees through Tasks / Team Work.</p><div className="flex flex-wrap gap-4">{productionTeams.map(t=><label key={t.id} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={loading} checked={form.production_team_ids.includes(t.id)} onChange={e=>setForm({...form,production_team_ids:e.target.checked?[...form.production_team_ids,t.id]:form.production_team_ids.filter(id=>id!==t.id)})}/>{t.name}</label>)}</div></fieldset>
                {/* LEAD ARTIST */}

                <div>

                  <label
                    htmlFor="project-lead"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    {isEditing ? 'Project assignments' : 'Initial Project Coordinator'}
                  </label>

                  <div className="relative">

                    {!isEditing && <UserRound
                      size={16}
                      strokeWidth={1.8}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />}

                    {selfCoordinator ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">You are the project coordinator for projects you create. Your Associate Lead manages coordinator assignments.</p> : isEditing ? <div className="space-y-2"><p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Project coordinators are managed in Assignments & Shared Access. Assign production work to staff from Tasks.</p><button type="button" disabled={loading || !onManageAssignments} onClick={onManageAssignments} className="rounded-xl bg-yellow-300 px-4 py-2 text-sm font-semibold text-slate-900">Manage project assignees</button><p className="text-xs text-slate-500">Opening assignments closes this form without saving unsaved detail changes.</p></div> : <select
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

                    </select>}

                    {!selfCoordinator && !isEditing && employees.length === 0 && (
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
                      value={periodStart}
                      onChange={(event) =>
                        updateField(
                          "start_date",
                          event.target.value,
                        )
                      }
                      disabled={loading||isMonthly}
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
                    Delivery Date
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
                      value={periodEnd}
                      onChange={(event) =>
                        updateField(
                          "target_deadline",
                          event.target.value,
                        )
                      }
                      disabled={loading||isMonthly}
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


              {form.status==='completed'&&!isMonthly&&<label className="grid gap-2 text-sm mb-4">Completed by employee *<select aria-label="Completed by employee" value={form.completed_by_profile_id} onChange={e=>updateField('completed_by_profile_id',e.target.value)} disabled={loading} required><option value="">Choose the employee to credit</option>{completionPeople.map(p=><option key={p.id} value={p.id}>{p.name}{p.employee_code?` (${p.employee_code})`:""}</option>)}</select><small>The full project rate will be credited to the selected contributor. QC is optional; the coordinator confirms final completion.</small>{completionError&&<span role="alert">{completionError}</span>}{!completionPeople.length&&<small>No verified contributors yet. Assign the employee to this project first.</small>}</label>}
              {isMonthly&&form.status==='completed'&&<label className="grid gap-2 text-sm mb-4">Credit full rate to team *<select aria-label="Credit full rate to team" value={form.sales_credit_team_id} onChange={e=>updateField('sales_credit_team_id',e.target.value)} disabled={loading} required className="h-11 rounded-xl border px-3"><option value="">Choose the team to credit</option>{productionTeams.filter(t=>form.production_team_ids.includes(t.id)).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><small>The full monthly rate goes to this team. The coordinator confirms final completion; QC is optional.</small></label>}
              <div className="grid gap-4 sm:grid-cols-3">

                {/* STATUS */}

                <div>

                  <label
                    htmlFor="project-status"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Status *
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
                    Payment Status *
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

            {isEditing&&onDelete&&<button type="button" disabled={loading} className="text-red-600 underline sm:mr-auto" onClick={onDelete}>Delete project</button>}
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
