import {
  AlertCircle,
  Building2,
  Loader2,
  Mail,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from "../../types/client";


interface ClientFormProps {
  open: boolean;
  client?: Client | null;
  coordinators?: { id: string; full_name: string; employee_code?: string }[];
  loading?: boolean;
  error?: string;
  onClose: () => void;

  onSubmit: (
    data:
      | CreateClientInput
      | UpdateClientInput,
  ) => void | Promise<void>;
}


interface ClientFormState {
  name: string;
  short_name: string;
  contact_person: string;
  email: string;
  phone: string;
  notes: string;
  assigned_coordinator_id: string;
}


const EMPTY_FORM: ClientFormState = {
  name: "",
  short_name: "",
  contact_person: "",
  email: "",
  phone: "",
  notes: "",
  assigned_coordinator_id: "",
};


function ClientForm({
  open,
  client = null,
  coordinators = [],
  loading = false,
  error = "",
  onClose,
  onSubmit,
}: ClientFormProps) {
  const isEditing = Boolean(client);

  const [form, setForm] =
    useState<ClientFormState>(
      EMPTY_FORM,
    );

  const [validationError, setValidationError] =
    useState("");


  /* =======================================================
     LOAD FORM
  ======================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    if (client) {
      setForm({
        name: client.name ?? "",
        short_name:
          client.short_name ?? "",
        contact_person:
          client.contact_person ?? "",
        email:
          client.email ?? "",
        phone:
          client.phone ?? "",
        notes:
          client.notes ?? "",
        assigned_coordinator_id:
          client.assigned_coordinator_id ?? "",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
      });
    }

    setValidationError("");
  }, [open, client]);


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
     LOCK BODY SCROLL
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
    field: keyof ClientFormState,
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
     VALIDATE
  ======================================================== */

  const validate = () => {
    const name =
      form.name.trim();

    const email =
      form.email.trim();


    if (!name) {
      setValidationError(
        "Client name is required.",
      );

      return false;
    }


    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      setValidationError(
        "Please enter a valid email address.",
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


    const payload = {
      name: form.name.trim(),

      short_name:
        form.short_name.trim() ||
        null,

      contact_person:
        form.contact_person.trim() ||
        null,

      email:
        form.email.trim() ||
        null,

      phone:
        form.phone.trim() ||
        null,

      notes:
        form.notes.trim() ||
        null,

      assigned_coordinator_id:
        form.assigned_coordinator_id ||
        null,
    };


    try {
      await onSubmit(payload);
    } catch {
      /*
       * The parent handles and displays
       * the Supabase error.
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
        aria-labelledby="client-form-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
      >

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">

              <Building2
                size={19}
                strokeWidth={1.8}
              />

            </div>


            <div className="min-w-0">

              <h2
                id="client-form-title"
                className="truncate text-base font-semibold text-slate-950"
              >
                {isEditing
                  ? "Edit Client"
                  : "Add Client"}
              </h2>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                {isEditing
                  ? "Update client information."
                  : "Add a new client to your workspace."}
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close client form"
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <X
              size={18}
              strokeWidth={1.8}
            />

          </button>

        </div>


        {/* =================================================
            FORM
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
                    Unable to save client
                  </p>

                  <p className="mt-1 break-words text-xs leading-5 text-red-600">
                    {displayedError}
                  </p>

                </div>

              </div>
            )}


            {/* =================================================
                CLIENT INFORMATION
            ================================================== */}

            <section>

              <div className="mb-3">

                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Client Information
                </p>

              </div>


              <div className="grid gap-4 sm:grid-cols-2">

                {/* CLIENT NAME */}

                <div className="sm:col-span-2">

                  <label
                    htmlFor="client-name"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Client Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <Building2
                      size={16}
                      strokeWidth={1.8}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="client-name"
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        updateField(
                          "name",
                          event.target.value,
                        )
                      }
                      placeholder="Enter client name"
                      disabled={loading}
                      autoComplete="organization"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                  </div>

                </div>


                {/* SHORT NAME */}

                <div>

                  <label
                    htmlFor="client-short-name"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Short Name
                  </label>

                  <input
                    id="client-short-name"
                    type="text"
                    value={
                      form.short_name
                    }
                    onChange={(event) =>
                      updateField(
                        "short_name",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. SDC"
                    disabled={loading}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm uppercase text-slate-900 outline-none transition placeholder:text-slate-400 placeholder:normal-case focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>


                {/* CONTACT PERSON */}

                <div>

                  <label
                    htmlFor="client-contact-person"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Contact Person
                  </label>

                  <div className="relative">

                    <UserRound
                      size={16}
                      strokeWidth={1.8}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="client-contact-person"
                      type="text"
                      value={
                        form.contact_person
                      }
                      onChange={(event) =>
                        updateField(
                          "contact_person",
                          event.target.value,
                        )
                      }
                      placeholder="Contact person name"
                      disabled={loading}
                      autoComplete="name"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                  </div>

                </div>

                {/* ASSIGNED PROJECT COORDINATOR */}

                <div className="sm:col-span-2">

                  <label
                    htmlFor="client-coordinator"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Assigned Project Coordinator
                  </label>

                  <div className="relative">

                    <UserRound
                      size={16}
                      strokeWidth={1.8}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      id="client-coordinator"
                      value={form.assigned_coordinator_id}
                      onChange={(event) =>
                        updateField(
                          "assigned_coordinator_id",
                          event.target.value,
                        )
                      }
                      disabled={loading}
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >

                      <option value="">
                        Select Project Coordinator (Unassigned)
                      </option>

                      {coordinators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} {c.employee_code ? `(${c.employee_code})` : ""}
                        </option>
                      ))}

                    </select>

                  </div>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Projects created under this client will be automatically routed & visible to the assigned coordinator.
                  </p>

                </div>

              </div>

            </section>


            {/* =================================================
                CONTACT DETAILS
            ================================================== */}

            <section>

              <div className="mb-3">

                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Contact Details
                </p>

              </div>


              <div className="grid gap-4 sm:grid-cols-2">

                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="client-email"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Email
                  </label>

                  <div className="relative">

                    <Mail
                      size={16}
                      strokeWidth={1.8}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="client-email"
                      type="email"
                      value={
                        form.email
                      }
                      onChange={(event) =>
                        updateField(
                          "email",
                          event.target.value,
                        )
                      }
                      placeholder="client@example.com"
                      disabled={loading}
                      autoComplete="email"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                  </div>

                </div>


                {/* PHONE */}

                <div>

                  <label
                    htmlFor="client-phone"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Phone
                  </label>

                  <div className="relative">

                    <Phone
                      size={16}
                      strokeWidth={1.8}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="client-phone"
                      type="tel"
                      value={
                        form.phone
                      }
                      onChange={(event) =>
                        updateField(
                          "phone",
                          event.target.value,
                        )
                      }
                      placeholder="Phone number"
                      disabled={loading}
                      autoComplete="tel"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                  </div>

                </div>

              </div>

            </section>


            {/* =================================================
                NOTES
            ================================================== */}

            <section>

              <label
                htmlFor="client-notes"
                className="mb-1.5 block text-xs font-medium text-slate-600"
              >
                Notes
              </label>

              <textarea
                id="client-notes"
                value={
                  form.notes
                }
                onChange={(event) =>
                  updateField(
                    "notes",
                    event.target.value,
                  )
                }
                placeholder="Add any additional client information..."
                disabled={loading}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:bg-slate-50"
              />

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
                  : "Create Client"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


export default ClientForm;