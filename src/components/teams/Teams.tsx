import { Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import TeamFilters from "../../components/teams/TeamFilters";
import TeamForm from "../../components/teams/TeamForm";
import TeamTable from "../../components/teams/TeamTable";

import {
  getTeams,
  setTeamStatus,
} from "../../services/teams/teams.service";

import type { Team } from "../../types/team";

function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] =
    useState<Team | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const loadTeams = async () => {
    try {
      setErrorMessage("");
      setLoading(true);

      const data = await getTeams();

      setTeams(data);
    } catch (error) {
      console.error("Failed to load teams:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load teams.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teams.filter((team) => {
      const matchesSearch =
        !query ||
        team.name.toLowerCase().includes(query) ||
        team.team_type.toLowerCase().includes(query) ||
        team.description
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        status === "all" ||
        (status === "active" && team.is_active) ||
        (status === "inactive" && !team.is_active);

      return Boolean(matchesSearch && matchesStatus);
    });
  }, [teams, search, status]);

  const handleCreate = () => {
    setSelectedTeam(null);
    setIsFormOpen(true);
  };

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (team: Team) => {
    const action = team.is_active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${team.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await setTeamStatus(
        team.id,
        !team.is_active,
      );

      await loadTeams();
    } catch (error) {
      console.error(
        "Failed to update team status:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update team status.",
      );
    }
  };

  const activeCount = teams.filter(
    (team) => team.is_active,
  ).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Users size={17} />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Teams
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Organize your internal workforce into teams.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <Plus size={16} />
          Add Team
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            Total Teams
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {teams.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            Active Teams
          </p>

          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            Inactive Teams
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-400">
            {teams.length - activeCount}
          </p>
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{errorMessage}</span>

          <button
            type="button"
            onClick={loadTeams}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <TeamFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      {/* Table */}
      <TeamTable
        teams={filteredTeams}
        loading={loading}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />

      {/* Form */}
      {isFormOpen && (
        <TeamForm
          team={selectedTeam}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedTeam(null);
          }}
          onSaved={async () => {
            setIsFormOpen(false);
            setSelectedTeam(null);
            await loadTeams();
          }}
        />
      )}
    </div>
  );
}

export default Teams;