import {
  CalendarDays,
  Mail,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { EmployeeWithTeam } from "../../types/employee";
import type { Team } from "../../types/team";

export interface EmployeeProfileOption {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
}

export interface EmployeeFormData {
  profile_id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  team_id: string;
  joining_date: string;
  is_active: boolean;
}

interface EmployeeFormProps {
  employee?: EmployeeWithTeam | null;
  profiles: EmployeeProfileOption[];
  teams: Team[];
  loading?: boolean;
  onSubmit: (
    data: EmployeeFormData,
  ) => Promise<void>;
  onClose: () => void;
}

interface FormErrors {
  profile_id?: string;
  employee_code?: string;
  full_name?: string;
  email?: string;
}

const EMPTY_FORM: EmployeeFormData = {
  profile_id: "",
  employee_code: "",
  full_name: "",
  email: "",
  phone: "",
  job_title: "",
  team_id: "",
  joining_date: "",
  is_active: true,
};

function EmployeeForm({
  employee,
  profiles,
  teams,
  loading = false,
  onSubmit,
  onClose,
}: EmployeeFormProps) {
  const isEditing = Boolean(employee);

  const [formData, setFormData] =
    useState<EmployeeFormData>(
      EMPTY_FORM,
    );

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [submitError, setSubmitError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);


  /*
   * Populate form for Add / Edit.
   */

  useEffect(() => {
    if (!employee) {
      setFormData(EMPTY_FORM);
      setErrors({});
      setSubmitError("");
      return;
    }

    setFormData({
      profile_id:
        employee.profile_id,
      employee_code:
        employee.employee_code,
      full_name:
        employee.full_name,
      email:
        employee.email,
      phone:
        employee.phone ?? "",
      job_title:
        employee.job_title ?? "",
      team_id:
        employee.team_id ?? "",
      joining_date:
        employee.joining_date ?? "",
      is_active:
        employee.is_active,
    });

    setErrors({});
    setSubmitError("");
  }, [employee]);


  /*
   * Update a form field.
   */

  const updateField = <
    K extends keyof EmployeeFormData,
  >(
    field: K,
    value: EmployeeFormData[K],
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setSubmitError("");
  };


  /*
   * Profile selection.
   *
   * Selecting a profile automatically fills
   * the profile's available information.
   */

  const handleProfileChange = (
    profileId: string,
  ) => {
    const selectedProfile =
      profiles.find(
        (profile) =>
          profile.id === profileId,
      );

    if (!selectedProfile) {
      updateField(
        "profile_id",
        profileId,
      );

      return;
    }

    setFormData((current) => ({
      ...current,
      profile_id: profileId,
      full_name:
        selectedProfile.full_name ??
        current.full_name,
      email:
        selectedProfile.email ??
        current.email,
      phone:
        selectedProfile.phone ??
        current.phone,
      job_title:
        selectedProfile.job_title ??
        current.job_title,
    }));

    setErrors((current) => ({
      ...current,
      profile_id: undefined,
    }));

    setSubmitError("");
  };


  /*
   * Validate form.
   */

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!isEditing && !formData.profile_id) {
      nextErrors.profile_id =
        "Please select a profile.";
    }

    if (!formData.employee_code.trim()) {
      nextErrors.employee_code =
        "Employee code is required.";
    }

    if (!formData.full_name.trim()) {
      nextErrors.full_name =
        "Full name is required.";
    }

    if (!formData.email.trim()) {
      nextErrors.email =
        "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim(),
      )
    ) {
      nextErrors.email =
        "Please enter a valid email address.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };


  /*
   * Submit form.
   */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      setSubmitError("Please correct the highlighted required fields above.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      await onSubmit({
        ...formData,
        profile_id:
          formData.profile_id,
        employee_code:
          formData.employee_code.trim(),
        full_name:
          formData.full_name.trim(),
        email:
          formData.email.trim(),
        phone:
          formData.phone.trim(),
        job_title:
          formData.job_title.trim(),
        team_id:
          formData.team_id,
        joining_date:
          formData.joining_date,
      });
    } catch (error) {
      console.error(
        "Employee form submission failed:",
        error,
      );

      setSubmitError(
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Unable to save employee.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  /*
   * Close form.
   */

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

      {/* =====================================================
          MODAL
      ====================================================== */}

      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
              <UserRound size={18} />
            </div>

            <div className="min-w-0">

              <h2 className="truncate text-lg font-semibold text-slate-950">
                {isEditing
                  ? "Edit Employee"
                  : "Add Employee"}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {isEditing
                  ? "Update employee information."
                  : "Create an internal employee record."}
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={19} />
          </button>

        </div>


        {/* ===================================================
            FORM
        ==================================================== */}

        <form
          onSubmit={handleSubmit}
          className="min-h-0 overflow-y-auto"
        >

          <div className="space-y-7 p-5 sm:p-6">

            {/* =================================================
                ACCOUNT PROFILE
            ================================================== */}

            <section>

              <div className="mb-4">

                <h3 className="text-sm font-semibold text-slate-900">
                  Account Profile
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Link this employee to an existing
                  internal profile.
                </p>

              </div>


              <label
                htmlFor="employee-profile"
                className="block"
              >

                <span className="mb-2 block text-xs font-medium text-slate-600">
                  Profile
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </span>

                <select
                  id="employee-profile"
                  value={
                    formData.profile_id
                  }
                  onChange={(event) =>
                    handleProfileChange(
                      event.target.value,
                    )
                  }
                  disabled={
                    isEditing ||
                    loading ||
                    isSubmitting
                  }
                  className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.profile_id
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                  }`}
                >

                  <option value="">
                    Select an existing profile
                  </option>

                  {profiles.map(
                    (profile) => (
                      <option
                        key={profile.id}
                        value={profile.id}
                      >
                        {profile.full_name ||
                          "Unnamed User"}

                        {profile.email
                          ? ` — ${profile.email}`
                          : ""}
                      </option>
                    ),
                  )}

                </select>

                {errors.profile_id && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.profile_id}
                  </p>
                )}

                {!isEditing &&
                  profiles.length === 0 && (
                    <p className="mt-1.5 text-xs leading-5 text-amber-600">
                      No available profiles were
                      found. Create or activate an
                      internal profile first.
                    </p>
                  )}

              </label>

            </section>


            {/* =================================================
                EMPLOYEE INFORMATION
            ================================================== */}

            <section>

              <div className="mb-4">

                <h3 className="text-sm font-semibold text-slate-900">
                  Employee Information
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Basic employee and contact details.
                </p>

              </div>


              <div className="grid gap-4 sm:grid-cols-2">

                {/* Employee Code */}

                <div>

                  <label
                    htmlFor="employee-code"
                    className="mb-2 block text-xs font-medium text-slate-600"
                  >
                    Employee Code
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="employee-code"
                    type="text"
                    value={
                      formData.employee_code
                    }
                    onChange={(event) =>
                      updateField(
                        "employee_code",
                        event.target.value,
                      )
                    }
                    placeholder="EMP-001"
                    disabled={isSubmitting}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                      errors.employee_code
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                    }`}
                  />

                  {errors.employee_code && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.employee_code}
                    </p>
                  )}

                </div>


                {/* Full Name */}

                <div>

                  <label
                    htmlFor="employee-name"
                    className="mb-2 block text-xs font-medium text-slate-600"
                  >
                    Full Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="employee-name"
                    type="text"
                    value={
                      formData.full_name
                    }
                    onChange={(event) =>
                      updateField(
                        "full_name",
                        event.target.value,
                      )
                    }
                    placeholder="Full name"
                    disabled={isSubmitting}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                      errors.full_name
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                    }`}
                  />

                  {errors.full_name && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.full_name}
                    </p>
                  )}

                </div>


                {/* Email */}

                <div>

                  <label
                    htmlFor="employee-email"
                    className="mb-2 block text-xs font-medium text-slate-600"
                  >
                    Email Address
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <Mail
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="employee-email"
                      type="email"
                      value={
                        formData.email
                      }
                      onChange={(event) =>
                        updateField(
                          "email",
                          event.target.value,
                        )
                      }
                      placeholder="employee@company.com"
                      disabled={isSubmitting}
                      className={`h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                        errors.email
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                      }`}
                    />

                  </div>

                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.email}
                    </p>
                  )}

                </div>


                {/* Phone */}

                <div>

                  <label
                    htmlFor="employee-phone"
                    className="mb-2 block text-xs font-medium text-slate-600"
                  >
                    Phone
                  </label>

                  <div className="relative">

                    <Phone
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="employee-phone"
                      type="tel"
                      value={
                        formData.phone
                      }
                      onChange={(event) =>
                        updateField(
                          "phone",
                          event.target.value,
                        )
                      }
                      placeholder="+91 XXXXX XXXXX"
                      disabled={isSubmitting}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                  </div>

                </div>


                {/* Job Title */}

                <div>

                  <label
                    htmlFor="employee-job-title"
                    className="mb-2 block text-xs font-medium text-slate-600"
                  >
                    Job Title
                  </label>

                  <input
                    id="employee-job-title"
                    type="text"
                    value={
                      formData.job_title
                    }
                    onChange={(event) =>
                      updateField(
                        "job_title",
                        event.target.value,
                      )
                    }
                    placeholder="Video Editor"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>


                {/* Team */}

                <div>

                  <label
                    htmlFor="employee-team"
                    className="mb-2 block text-xs font-medium text-slate-600"
                  >
                    Team
                  </label>

                  <select
                    id="employee-team"
                    value={
                      formData.team_id
                    }
                    onChange={(event) =>
                      updateField(
                        "team_id",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >

                    <option value="">
                      Not assigned
                    </option>

                    {teams.map((team) => (
                      <option
                        key={team.id}
                        value={team.id}
                      >
                        {team.name}
                      </option>
                    ))}

                  </select>

                </div>


                {/* Joining Date */}

                <div>

                  <label
                    htmlFor="employee-joining-date"
                    className="mb-2 block text-xs font-medium text-slate-600"
                  >
                    Joining Date
                  </label>

                  <div className="relative">

                    <CalendarDays
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="employee-joining-date"
                      type="date"
                      value={
                        formData.joining_date
                      }
                      onChange={(event) =>
                        updateField(
                          "joining_date",
                          event.target.value,
                        )
                      }
                      disabled={isSubmitting}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                  </div>

                </div>

              </div>

            </section>


            {/* =================================================
                ACTIVE STATUS
            ================================================== */}

            {isEditing && (
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <label className="flex cursor-pointer items-start gap-3">

                  <input
                    type="checkbox"
                    checked={
                      formData.is_active
                    }
                    onChange={(event) =>
                      updateField(
                        "is_active",
                        event.target.checked,
                      )
                    }
                    disabled={isSubmitting}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
                  />

                  <span className="min-w-0">

                    <span className="block text-sm font-medium text-slate-800">
                      Active Employee
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Inactive employees remain in
                      the system but are not treated
                      as active workforce members.
                    </span>

                  </span>

                </label>

              </section>
            )}


            {/* =================================================
                SUBMIT ERROR
            ================================================== */}

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                <p className="text-sm font-semibold text-red-800">
                  Unable to save employee
                </p>

                <p className="mt-1 break-words text-xs leading-5 text-red-600">
                  {submitError}
                </p>

              </div>
            )}

          </div>


          {/* =================================================
              FOOTER
          ================================================== */}

          {submitError && <p role="alert" className="shrink-0 border-t border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">{submitError}</p>}

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={
                isSubmitting ||
                loading
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />

                  {isEditing
                    ? "Save Changes"
                    : "Create Employee"}
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EmployeeForm;