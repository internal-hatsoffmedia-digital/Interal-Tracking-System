import {
  ArrowUpRight,
  Edit3,
  Power,
  Shield,
  Users,
} from "lucide-react";
import type { Team } from "../../types/team";
import TeamCard from "./TeamCard";
import { formatTeamType, getTeamVisuals } from "./TeamVisuals";

interface TeamTableProps {
  teams: Team[];
  loading: boolean;
  onEdit: (team: Team) => void;
  onToggleStatus: (team: Team) => void;
  onSelect?: (team: Team) => void;
  viewMode?: "grid" | "table";
}

function TeamTable({
  teams,
  loading,
  onEdit,
  onToggleStatus,
  onSelect = () => {},
  viewMode = "grid",
}: TeamTableProps) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-12">
        <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          <span className="text-xs font-medium text-slate-400">Loading squad roster...</span>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Users size={24} />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900">
          No teams found
        </h3>

        <p className="mt-1.5 max-w-sm mx-auto text-xs leading-5 text-slate-500">
          No teams match your current filters. Create a new team or adjust your search.
        </p>
      </div>
    );
  }

  // 1. GRID CARDS VIEW
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  // 2. DETAILED TABLE VIEW
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-400">
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider">
                Team Squad
              </th>

              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider">
                Type
              </th>

              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider">
                Team Lead
              </th>

              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider">
                Status
              </th>

              <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {teams.map((team) => {
              const visuals = getTeamVisuals(team);
              const Icon = visuals.icon;
              const members = team.members ?? [];
              const memberCount = members.length;

              return (
                <tr
                  key={team.id}
                  className="group transition-colors hover:bg-slate-50/70 cursor-pointer"
                  onClick={() => onSelect(team)}
                >
                  {/* TEAM NAME & ICON */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xs border border-slate-900">
                        <Icon
                          size={18}
                          strokeWidth={2.2}
                          style={{ color: visuals.accentColor }}
                        />
                        <span
                          className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
                          style={{ backgroundColor: visuals.accentColor }}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition">
                          {team.name}
                        </p>

                        {team.description && (
                          <p className="mt-0.5 max-w-sm truncate text-xs text-slate-500">
                            {team.description}
                          </p>
                        )}

                        {/* Preserves tests looking for '1 member:' text */}
                        {memberCount > 0 && (
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-bold text-slate-800">
                              {memberCount} {memberCount === 1 ? "member:" : "members:"}
                            </span>
                            <span className="truncate max-w-xs text-slate-600">
                              {members.map((m) => m.full_name).join(", ")}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* TYPE */}
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {formatTeamType(team.team_type)}
                    </span>
                  </td>

                  {/* TEAM LEAD */}
                  <td className="px-6 py-4">
                    {team.team_lead_name ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-100 border border-slate-200/70 px-2.5 py-1 text-xs font-bold text-slate-800">
                        <Shield size={12} className="text-slate-500" />
                        {team.team_lead_name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Not assigned
                      </span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        team.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          team.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                        }`}
                      />
                      {team.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td
                    className="px-6 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelect(team)}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                        title="View details"
                      >
                        <ArrowUpRight size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(team)}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                        title="Edit team"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(team)}
                        className={`rounded-xl p-2 transition ${
                          team.is_active
                            ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                        }`}
                        title={team.is_active ? "Deactivate team" : "Activate team"}
                      >
                        <Power size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeamTable;
export { formatTeamType };