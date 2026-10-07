import {
  ArrowUpRight,
  Edit3,
  Power,
  Shield,
  Users,
} from "lucide-react";
import type { Team } from "../../types/team";
import { getTeamVisuals } from "./TeamVisuals";

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onToggleStatus: (team: Team) => void;
  onSelect: (team: Team) => void;
}

export default function TeamCard({
  team,
  onEdit,
  onToggleStatus,
  onSelect,
}: TeamCardProps) {
  const visuals = getTeamVisuals(team);
  const Icon = visuals.icon;
  const members = team.members ?? [];
  const memberCount = members.length;

  return (
    <div
      className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300"
    >
      <div>
        {/* Card Header: Icon + Department Badge + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Squad Icon in Dark Obsidian Pill with Accent Glow */}
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm border border-slate-900 transition-transform duration-300 group-hover:scale-105">
              <Icon
                size={22}
                strokeWidth={2.2}
                style={{ color: visuals.accentColor }}
              />
              <span
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white"
                style={{ backgroundColor: visuals.accentColor }}
              />
            </div>

            <div>
              <span className="inline-block rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                {visuals.department}
              </span>
              <h3 className="mt-1 text-base font-bold tracking-tight text-slate-900 group-hover:text-slate-950 transition line-clamp-1">
                {team.name}
              </h3>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              team.is_active
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                team.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            {team.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3.5 text-xs leading-relaxed text-slate-500 line-clamp-2 min-h-[32px]">
          {team.description || "Internal studio production and delivery squad."}
        </p>

        {/* Leadership & Capacity Info Box */}
        <div className="mt-4 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
          {/* Team Lead */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-400">
              <Shield size={13} className="text-slate-400" />
              Team Lead
            </span>
            {team.team_lead_name ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-amber-400 font-bold">
                  {team.team_lead_name[0]?.toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate">{team.team_lead_name}</span>
              </span>
            ) : (
              <span className="text-slate-400 italic font-normal">Not assigned</span>
            )}
          </div>

          {/* Members Count & List (preserves test requirement) */}
          <div className="flex items-center justify-between text-xs border-t border-slate-200/50 pt-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-400">
              <Users size={13} className="text-slate-400" />
              Specialists
            </span>
            <div className="flex items-center gap-2">
              {memberCount > 0 ? (
                <span className="text-[11px] font-bold text-slate-800">
                  {memberCount} {memberCount === 1 ? "member:" : "members:"}{" "}
                  <span className="font-medium text-slate-500">
                    {members[0]?.full_name}
                    {memberCount > 1 ? ` +${memberCount - 1}` : ""}
                  </span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">0 members</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
        {/* Avatars Stack Preview */}
        <div className="flex items-center -space-x-1.5">
          {members.slice(0, 3).map((m, idx) => {
            const initials = m.full_name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={m.id || idx}
                title={m.full_name}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-700 shadow-xs"
              >
                {initials}
              </div>
            );
          })}
          {memberCount > 3 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-600 shadow-xs">
              +{memberCount - 3}
            </div>
          )}
          {memberCount === 0 && (
            <span className="text-[11px] text-slate-400 italic">No assigned staff</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelect(team)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
            title="View squad details"
          >
            <ArrowUpRight size={15} />
          </button>

          <button
            type="button"
            onClick={() => onEdit(team)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
            title="Edit team"
          >
            <Edit3 size={15} />
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus(team)}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
              team.is_active
                ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
            }`}
            title={team.is_active ? "Deactivate team" : "Activate team"}
          >
            <Power size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
