import {
  Edit3,
  MoreHorizontal,
  Power,
  Users,
} from "lucide-react";
import type { Team } from "../../types/team";

interface TeamTableProps {
  teams: Team[];
  loading: boolean;
  onEdit: (team: Team) => void;
  onToggleStatus: (team: Team) => void;
}

function TeamTable({
  teams,
  loading,
  onEdit,
  onToggleStatus,
}: TeamTableProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            Loading teams...
          </div>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex h-64 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <Users size={20} className="text-slate-500" />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            No teams found
          </h3>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
            Create your first team to start organizing your
            internal workforce.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Team
              </th>

              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Type
              </th>

              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Team Lead
              </th>

              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>

              <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {teams.map((team) => (
              <tr
                key={team.id}
                className="transition hover:bg-slate-50/60"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {team.name}
                    </p>

                    {team.description && (
                      <p className="mt-1 max-w-sm truncate text-xs text-slate-500">
                        {team.description}
                      </p>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                    {formatTeamType(team.team_type)}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">
                    {team.team_lead_id
                      ? "Assigned"
                      : "Not assigned"}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      team.is_active
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        team.is_active
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      }`}
                    />

                    {team.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(team)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                      title="Edit team"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleStatus(team)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                      title={
                        team.is_active
                          ? "Deactivate team"
                          : "Activate team"
                      }
                    >
                      <Power size={16} />
                    </button>

                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                      title="More options"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatTeamType(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default TeamTable;