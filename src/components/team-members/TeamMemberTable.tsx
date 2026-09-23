import { Edit2, Shield, Trash2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import type { UserRole } from "../../types/auth";
import type { TeamMember } from "../../types/teamMember";

interface TeamMemberTableProps {
  members: TeamMember[];
  loading: boolean;
  canManage: boolean;
  currentUserId?: string;
  onEdit: (member: TeamMember) => void;
  onToggleStatus: (member: TeamMember) => Promise<void>;
  onDelete: (member: TeamMember) => Promise<void>;
}

const ROLE_BADGE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  admin: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  director: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  associate_lead: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  project_coordinator: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  team_lead: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  employee: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

const formatRoleName = (r: UserRole): string => {
  return r.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function TeamMemberTable({
  members,
  loading,
  canManage,
  currentUserId,
  onEdit,
  onToggleStatus,
  onDelete,
}: TeamMemberTableProps) {
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<TeamMember | null>(null);

  const handleToggle = async (m: TeamMember) => {
    try {
      setBusyMemberId(m.id);
      await onToggleStatus(m);
    } finally {
      setBusyMemberId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setBusyMemberId(deleteCandidate.id);
      await onDelete(deleteCandidate);
      setDeleteCandidate(null);
    } finally {
      setBusyMemberId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-slate-600">Loading team members...</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Shield size={24} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900">No team members found</h3>
        <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or add a new team member.</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">User / Name</th>
                <th className="px-5 py-4">Employee Code</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Job Title</th>
                <th className="px-5 py-4">Team</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Joined</th>
                {canManage && <th className="px-5 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {members.map((m) => {
                const roleStyle = ROLE_BADGE_COLORS[m.role] || ROLE_BADGE_COLORS.employee;
                const isSelf = m.id === currentUserId;
                const isBusy = busyMemberId === m.id;

                return (
                  <tr key={m.id} className="transition hover:bg-slate-50/60">
                    {/* USER & EMAIL */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-xs">
                          {m.full_name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">
                            {m.full_name}
                            {isSelf && (
                              <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                You
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-slate-500">{m.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* EMPLOYEE CODE */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-slate-600">
                        {m.employee_code}
                      </span>
                    </td>

                    {/* ROLE */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                      >
                        <Shield size={12} />
                        {formatRoleName(m.role)}
                      </span>
                    </td>

                    {/* JOB TITLE */}
                    <td className="px-5 py-4">
                      <span className="text-xs text-slate-700">{m.job_title || "—"}</span>
                    </td>

                    {/* TEAM */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-slate-700">{m.team_name || "Unassigned"}</span>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          m.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            m.is_active ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {m.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* CREATED DATE */}
                    <td className="px-5 py-4">
                      <span className="text-xs text-slate-500">
                        {new Date(m.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    {canManage && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* EDIT */}
                          <button
                            type="button"
                            onClick={() => onEdit(m)}
                            disabled={isBusy}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                            title="Edit Team Member"
                            aria-label="Edit Team Member"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* ACTIVATE / DEACTIVATE */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => void handleToggle(m)}
                              disabled={isBusy}
                              className={`rounded-lg p-2 transition disabled:opacity-40 ${
                                m.is_active
                                  ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                  : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                              title={m.is_active ? "Deactivate User Account" : "Activate User Account"}
                              aria-label={m.is_active ? "Deactivate User Account" : "Activate User Account"}
                            >
                              {m.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                          )}

                          {/* DELETE */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setDeleteCandidate(m)}
                              disabled={isBusy}
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                              title="Permanently Delete User"
                              aria-label="Permanently Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PERMANENT DELETE CONFIRMATION DIALOG */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Trash2 size={22} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-950">Permanently Delete User?</h3>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900">{deleteCandidate.full_name}</strong> ({deleteCandidate.email})?
            </p>
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              ⚠️ <strong>Warning:</strong> Deleting an account is permanent and deletes auth credentials. For normal staff departure, <strong>Deactivate</strong> is recommended to preserve history.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="h-10 rounded-xl bg-red-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
