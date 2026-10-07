import {
  Edit3,
  Mail,
  Power,
  Shield,
  Users,
  X,
} from "lucide-react";
import type { Team } from "../../types/team";
import { getTeamVisuals } from "./TeamVisuals";

interface TeamDetailsModalProps {
  team: Team | null;
  onClose: () => void;
  onEdit: (team: Team) => void;
  onToggleStatus: (team: Team) => void;
}

export default function TeamDetailsModal({
  team,
  onClose,
  onEdit,
  onToggleStatus,
}: TeamDetailsModalProps) {
  if (!team) return null;

  const visuals = getTeamVisuals(team);
  const Icon = visuals.icon;
  const members = team.members ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop with dark blur */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800/20 bg-white shadow-2xl transition-all">
        {/* Top Dark Hero Banner - High Contrast & Obsidian Studio Aesthetic */}
        <div className="relative bg-slate-950 px-6 py-6 text-white overflow-hidden border-b border-slate-900">
          {/* Subtle luminous accent glow matching squad department */}
          <div
            className="absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: visuals.accentColor }}
          />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Department Icon Box */}
              <div
                className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner border border-white/15 backdrop-blur-md"
                style={{ color: visuals.accentColor }}
              >
                <Icon size={26} strokeWidth={2.2} />
              </div>

              <div>
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-white/10 border border-white/10"
                >
                  {visuals.department}
                </span>

                <h2
                  id="team-details-title"
                  className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl drop-shadow-xs"
                >
                  {team.name}
                </h2>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-slate-300 hover:bg-white/20 hover:text-white transition"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          {/* Status & Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  team.is_active
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    team.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                {team.is_active ? "Active Squad" : "Inactive"}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200/60">
                {members.length} {members.length === 1 ? "Specialist" : "Specialists"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(team);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition"
              >
                <Edit3 size={13} />
                Edit Squad
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onToggleStatus(team);
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold border transition ${
                  team.is_active
                    ? "border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                <Power size={13} />
                {team.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>

          {/* Description */}
          {team.description && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                About this Squad
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {team.description}
              </p>
            </div>
          )}

          {/* Squad Leadership Box */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shield size={13} className="text-slate-500" />
              Squad Leadership
            </h4>

            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-amber-400 font-bold text-sm shadow-sm border border-slate-800">
                {team.team_lead_name
                  ? team.team_lead_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "?"}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  {team.team_lead_name || "Lead Position Unassigned"}
                </p>
                <p className="text-xs text-slate-500">
                  {team.team_lead_name
                    ? "Designated Squad Lead / Production Coordinator"
                    : "No coordinator currently assigned to lead this squad."}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Specialists Roster */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
              <Users size={13} className="text-slate-500" />
              Assigned Team Specialists ({members.length})
            </h4>

            {members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                No specialists are currently assigned to this squad.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {members.map((member) => {
                  const initials = member.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs hover:border-slate-300 transition"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {member.full_name}
                        </p>
                        {member.email && (
                          <p className="truncate text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail size={10} className="text-slate-400" />
                            {member.email}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-950 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
