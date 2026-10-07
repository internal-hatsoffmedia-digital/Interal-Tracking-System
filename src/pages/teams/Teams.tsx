import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Plus,
  RefreshCw,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";

import AssignTeamAccount from "../../components/teams/AssignTeamAccount";
import TeamDetailsModal from "../../components/teams/TeamDetailsModal";
import TeamFilters from "../../components/teams/TeamFilters";
import TeamForm from "../../components/teams/TeamForm";
import TeamTable from "../../components/teams/TeamTable";
import { useAuth } from "../../context/AuthContext";
import {
  getTeams,
  setTeamStatus,
} from "../../services/teams/teams.service";
import type { Team } from "../../types/team";

function TeamsRoute() {
  const { profile } = useAuth();
  if (profile?.role === "associate_lead" || profile?.role === "team_lead") {
    return <Navigate to="/my-team" replace />;
  }
  return <Teams />;
}

function Teams() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [department, setDepartment] = useState<string>("all");

  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    return (
      (localStorage.getItem("hatsoff:teams-view-mode") as "grid" | "table") ||
      "grid"
    );
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("hatsoff:teams-view-mode", mode);
  };

  /*
   * ============================================
   * LOAD TEAMS
   * ============================================
   */

  const loadTeams = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage("");

      const data = await getTeams();
      setTeams(data);
    } catch (error) {
      console.error("Failed to load teams:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load teams.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadTeams();
  }, []);

  /*
   * ============================================
   * FILTER TEAMS
   * ============================================
   */

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teams.filter((team) => {
      // 1. Text search
      const matchesSearch =
        !query ||
        team.name.toLowerCase().includes(query) ||
        team.team_type.toLowerCase().includes(query) ||
        (team.description ?? "").toLowerCase().includes(query) ||
        (team.team_lead_name ?? "").toLowerCase().includes(query) ||
        (team.members ?? []).some((m) =>
          m.full_name.toLowerCase().includes(query),
        );

      // 2. Status filter
      const matchesStatus =
        status === "all" ||
        (status === "active" && team.is_active) ||
        (status === "inactive" && !team.is_active);

      // 3. Department filter
      let matchesDept = true;
      if (department !== "all") {
        const tName = team.name.toLowerCase();
        const tType = team.team_type.toLowerCase();

        if (department === "creative") {
          matchesDept =
            tType.includes("creative") ||
            tType.includes("design") ||
            tName.includes("creative") ||
            tName.includes("design");
        } else if (department === "cut") {
          matchesDept =
            tType.includes("cut") ||
            tType.includes("video") ||
            tType.includes("editing") ||
            tName.includes("cut") ||
            tName.includes("video");
        } else if (department === "flow") {
          matchesDept =
            tType.includes("flow") ||
            tType.includes("coordinator") ||
            tName.includes("flow") ||
            tName.includes("coordinator");
        } else if (department === "web") {
          matchesDept =
            tType.includes("web") ||
            tName.includes("web") ||
            tName.includes("crafter");
        } else if (department === "digital") {
          matchesDept =
            tType.includes("digital") ||
            tType.includes("marketing") ||
            tName.includes("digital") ||
            tName.includes("marketing") ||
            tName.includes("ninja");
        } else if (department === "sales") {
          matchesDept =
            tName.includes("market") ||
            tName.includes("hunter") ||
            tName.includes("sales") ||
            tType.includes("sales");
        }
      }

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [teams, search, status, department]);

  /*
   * ============================================
   * ACTIONS
   * ============================================
   */

  const handleCreate = () => {
    setSelectedTeam(null);
    setIsFormOpen(true);
  };

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setIsFormOpen(true);
  };

  const handleSelectTeam = (team: Team) => {
    setViewingTeam(team);
  };

  const handleToggleStatus = async (team: Team) => {
    const action = team.is_active ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${team.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");
      await setTeamStatus(team.id, !team.is_active);
      await loadTeams(true);
    } catch (error) {
      console.error("Failed to update team status:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update team status.",
      );
    }
  };

  /*
   * ============================================
   * STATS METRICS
   * ============================================
   */

  const totalTeams = teams.length;
  const activeTeams = teams.filter((team) => team.is_active).length;
  const inactiveTeams = totalTeams - activeTeams;
  const totalSpecialists = teams.reduce(
    (sum, t) => sum + (t.members?.length ?? 0),
    0,
  );
  const assignedLeadsCount = teams.filter((t) => Boolean(t.team_lead_name)).length;

  return (
    <div className="space-y-6">
      {/* ======================================
          PAGE HERO HEADER
      ======================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-amber-400 shadow-md">
            <Users size={22} strokeWidth={2.2} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Teams
              </h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                Studio Squads
              </span>
            </div>

            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Organize internal departments, squad leads, and creative specialists.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void loadTeams(true)}
            disabled={loading || refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-60"
            title="Refresh teams"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-slate-900" : ""}
            />
            <span>Refresh</span>
          </button>

          {/* Test matches 'Add Team' text */}
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white shadow-md shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Team</span>
          </button>
        </div>
      </div>

      {/* ======================================
          MODERN STATS KPI CARDS
      ======================================= */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4">
        {/* Total Squads */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Squads</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Users size={14} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {totalTeams}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Internal departments
          </p>
        </div>

        {/* Active Squads */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Active Squads</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
              {activeTeams}
            </p>
            <span className="text-[11px] font-semibold text-emerald-600/80">
              ({totalTeams > 0 ? Math.round((activeTeams / totalTeams) * 100) : 0}%)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            In active production
          </p>
        </div>

        {/* Assigned Specialists */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Assigned Staff</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <UserCheck size={14} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {totalSpecialists}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Team specialists roster
          </p>
        </div>

        {/* Squad Leads */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Squad Leads</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Shield size={14} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {assignedLeadsCount}{" "}
            <span className="text-sm font-normal text-slate-400">/ {totalTeams}</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Designated team leads
          </p>
        </div>
      </div>

      {/* ======================================
          ERROR BANNER
      ======================================= */}
      {errorMessage && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => void loadTeams()}
            className="w-fit font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================
          ADMIN ASSIGNMENT
      ======================================= */}
      {profile?.role === "admin" && (
        <AssignTeamAccount teams={teams} onSaved={async () => loadTeams(true)} />
      )}

      {/* ======================================
          TOOLBAR & FILTERS
      ======================================= */}
      <TeamFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        department={department}
        onDepartmentChange={setDepartment}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        counts={{
          total: totalTeams,
          active: activeTeams,
          inactive: inactiveTeams,
        }}
      />

      {/* ======================================
          RESULTS BAR
      ======================================= */}
      {!loading && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-800">
              {filteredTeams.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-800">
              {totalTeams}
            </span>{" "}
            teams
          </p>

          {(search || status !== "all" || department !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setDepartment("all");
              }}
              className="text-xs font-semibold text-slate-500 underline hover:text-slate-800"
            >
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* ======================================
          TEAM TABLE / CARDS
      ======================================= */}
      <TeamTable
        teams={filteredTeams}
        loading={loading}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
        onSelect={handleSelectTeam}
        viewMode={viewMode}
      />

      {/* ======================================
          TEAM FORM MODAL
      ======================================= */}
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
            await loadTeams(true);
          }}
        />
      )}

      {/* ======================================
          TEAM DETAILS SLIDE-OVER MODAL
      ======================================= */}
      {viewingTeam && (
        <TeamDetailsModal
          team={viewingTeam}
          onClose={() => setViewingTeam(null)}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
}

export default TeamsRoute;