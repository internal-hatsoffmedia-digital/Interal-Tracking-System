import { Eye, EyeOff, Lock, Mail, Shield, UserCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { UserRole } from "../../types/auth";
import type { Team } from "../../types/team";
import type { CreateTeamMemberInput, TeamMember, UpdateTeamMemberInput } from "../../types/teamMember";

interface TeamMemberFormModalProps {
  member?: TeamMember | null;
  teams: Team[];
  roles: { value: UserRole; label: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSaveAdd: (data: CreateTeamMemberInput) => Promise<void>;
  onSaveEdit: (id: string, data: UpdateTeamMemberInput) => Promise<void>;
}

export default function TeamMemberFormModal({
  member,
  teams,
  roles,
  isOpen,
  onClose,
  onSaveAdd,
  onSaveEdit,
}: TeamMemberFormModalProps) {
  const isEditing = Boolean(member);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [jobTitle, setJobTitle] = useState("");
  const [teamId, setTeamId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (member) {
      setFullName(member.full_name || "");
      setEmail(member.email || "");
      setPassword("");
      setConfirmPassword("");
      setRole(member.role || "employee");
      setJobTitle(member.job_title || "");
      setTeamId(member.team_id || "");
      setIsActive(member.is_active ?? true);
    } else {
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("employee");
      setJobTitle("");
      setTeamId("");
      setIsActive(true);
    }

    setFieldErrors({});
    setSubmitError("");
  }, [isOpen, member]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Full name is required.";
    }

    if (!isEditing) {
      if (!email.trim()) {
        errors.email = "Email address is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = "Please enter a valid email address.";
      }

      if (!password) {
        errors.password = "Temporary password is required.";
      } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
      }

      if (!confirmPassword) {
        errors.confirmPassword = "Please confirm the password.";
      } else if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }
    }

    if (!role) {
      errors.role = "Role selection is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEditing && member) {
        await onSaveEdit(member.id, {
          full_name: fullName.trim(),
          role,
          job_title: jobTitle.trim() || undefined,
          team_id: teamId || undefined,
          is_active: isActive,
        });
      } else {
        await onSaveAdd({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          job_title: jobTitle.trim() || undefined,
          team_id: teamId || undefined,
          is_active: isActive,
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save team member:", err);
      setSubmitError(err instanceof Error ? err.message : "An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
              <UserCheck size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                {isEditing ? "Edit Team Member" : "Add Team Member"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Update member role, job title, and team scope."
                  : "Provision a new authenticated user account for Internal Force."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto p-6">
          {submitError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              {submitError}
            </div>
          )}

          <div className="space-y-4">
            {/* FULL NAME */}
            <div>
              <label htmlFor="tm-name" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="tm-name"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                }}
                placeholder="e.g. Muskan Sharma"
                disabled={submitting}
                className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                  fieldErrors.fullName
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label htmlFor="tm-email" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="tm-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="user@hatsoffmedia.in"
                  disabled={isEditing || submitting}
                  className={`h-11 w-full rounded-xl border pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                    isEditing
                      ? "border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                      : fieldErrors.email
                      ? "border-red-300 bg-white focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 bg-white focus:border-slate-400 focus:ring-slate-100"
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* PASSWORDS (ADD MODE ONLY) */}
            {!isEditing && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="tm-password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Temporary Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="tm-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      placeholder="••••••••"
                      disabled={submitting}
                      className={`h-11 w-full rounded-xl border bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                        fieldErrors.password
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="tm-confirm-password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="tm-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }}
                      placeholder="••••••••"
                      disabled={submitting}
                      className={`h-11 w-full rounded-xl border bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                        fieldErrors.confirmPassword
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

            {/* ROLE & JOB TITLE */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tm-role" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    id="tm-role"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value as UserRole);
                      setFieldErrors((prev) => ({ ...prev, role: "" }));
                    }}
                    disabled={submitting}
                    className={`h-11 w-full rounded-xl border bg-white pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                      fieldErrors.role
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                    }`}
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.role && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.role}</p>
                )}
              </div>

              <div>
                <label htmlFor="tm-job-title" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Job Title
                </label>
                <input
                  id="tm-job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Video Editor"
                  disabled={submitting}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>

            {/* TEAM ASSIGNMENT */}
            <div>
              <label htmlFor="tm-team" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Assigned Team
              </label>
              <select
                id="tm-team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                disabled={submitting}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                <option value="">No team assignment</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ACTIVE STATUS */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={submitting}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Account Active Status (User can sign in)
                </span>
              </label>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-11 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Save Changes"
                : "Create Team Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
