import { Plus, RefreshCw, UserCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import TeamMemberFilters from "../../components/team-members/TeamMemberFilters";
import TeamMemberFormModal from "../../components/team-members/TeamMemberFormModal";
import TeamMemberTable from "../../components/team-members/TeamMemberTable";
import { useAuth } from "../../context/AuthContext";
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembers,
  toggleTeamMemberStatus,
  updateTeamMember,
} from "../../services/team-members/teamMembers.service";
import { getActiveTeams } from "../../services/teams/teams.service";
import type { UserRole } from "../../types/auth";
import type { Team } from "../../types/team";
import type {
  CreateTeamMemberInput,
  TeamMember,
  UpdateTeamMemberInput,
} from "../../types/teamMember";

const VALID_ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "director", label: "Director" },
  { value: "associate_lead", label: "Associate Lead" },
  { value: "project_coordinator", label: "Project Coordinator" },
  { value: "team_lead", label: "Team Lead" },
  { value: "employee", label: "Employee" },
];

export default function TeamMembers() {
  const { profile: currentProfile } = useAuth();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [teamId, setTeamId] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const canManage = currentProfile?.role === "admin";

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      setErrorMessage("");
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [memberData, teamData] = await Promise.all([
        getTeamMembers(),
        getActiveTeams(),
      ]);

      setMembers(memberData);
      setTeams(teamData);
    } catch (err) {
      console.error("Failed to load team members data:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to load team members data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return members.filter((m) => {
      const matchesSearch =
        q === "" ||
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.employee_code.toLowerCase().includes(q) ||
        (m.job_title && m.job_title.toLowerCase().includes(q));

      const matchesTeam = teamId === "all" || m.team_id === teamId;
      const matchesRole = role === "all" || m.role === role;
      const matchesStatus =
        status === "all" ||
        (status === "active" && m.is_active) ||
        (status === "inactive" && !m.is_active);

      return matchesSearch && matchesTeam && matchesRole && matchesStatus;
    });
  }, [members, search, teamId, role, status]);

  // Stats
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.is_active).length;
  const inactiveCount = members.filter((m) => !m.is_active).length;
  const adminCount = members.filter((m) => m.role === "admin").length;

  const handleClearFilters = () => {
    setSearch("");
    setTeamId("all");
    setRole("all");
    setStatus("all");
  };

  const handleOpenAdd = () => {
    setSelectedMember(null);
    setErrorMessage("");
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: TeamMember) => {
    setSelectedMember(m);
    setErrorMessage("");
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const handleSaveAdd = async (input: CreateTeamMemberInput) => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      await createTeamMember(input);
      setSuccessMessage(`Team member "${input.full_name}" created successfully.`);
      await loadData(true);
    } catch (err) {
      console.error("Save add error:", err);
      throw err;
    }
  };

  const handleSaveEdit = async (id: string, input: UpdateTeamMemberInput) => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      await updateTeamMember(id, input);
      setSuccessMessage(`Team member updated successfully.`);
      await loadData(true);
    } catch (err) {
      console.error("Save edit error:", err);
      throw err;
    }
  };

  const handleToggleStatus = async (m: TeamMember) => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      await toggleTeamMemberStatus(m.id, m.is_active);
      setSuccessMessage(
        `Account for "${m.full_name}" is now ${!m.is_active ? "Active" : "Inactive"}.`,
      );
      await loadData(true);
    } catch (err) {
      console.error("Toggle status error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to change account status.",
      );
    }
  };

  const handleDeleteMember = async (m: TeamMember) => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      await deleteTeamMember(m.id);
      setSuccessMessage(`User "${m.full_name}" deleted successfully.`);
      await loadData(true);
    } catch (err) {
      console.error("Delete user error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to delete team member.",
      );
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* HEADER */}
      <section className="min-w-0">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                <UserCheck size={19} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Administration
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Team Members / User Management
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Manage application user accounts, system roles, team scope, and account access permissions.
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>

            {canManage && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
              >
                <Plus size={17} />
                Add Team Member
              </button>
            )}
          </div>
        </div>
      </section>

      {/* MESSAGES */}
      {errorMessage && (
        <div className="flex min-w-0 items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-800">Action Failed</p>
            <p className="mt-0.5 break-words text-xs leading-5 text-red-600">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="shrink-0 text-xs font-medium text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex min-w-0 items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-800">Success</p>
            <p className="mt-0.5 break-words text-xs leading-5 text-emerald-700">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="shrink-0 text-xs font-medium text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SUMMARY STATS */}
      <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Users</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{totalCount}</p>
          <p className="mt-1 text-xs text-slate-400">Application user accounts</p>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Active Accounts</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-600">{activeCount}</p>
          <p className="mt-1 text-xs text-slate-400">Can log in & access app</p>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Inactive Accounts</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-500">{inactiveCount}</p>
          <p className="mt-1 text-xs text-slate-400">Deactivated users</p>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Administrators</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-purple-600">{adminCount}</p>
          <p className="mt-1 text-xs text-slate-400">Full system access</p>
        </div>
      </section>

      {/* FILTERS */}
      <TeamMemberFilters
        search={search}
        teamId={teamId}
        role={role}
        status={status}
        teams={teams}
        roles={VALID_ROLES}
        onSearchChange={setSearch}
        onTeamChange={setTeamId}
        onRoleChange={setRole}
        onStatusChange={setStatus}
        onClear={handleClearFilters}
      />

      {/* RESULT COUNT */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredMembers.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{members.length}</span> team members
          </p>
        </div>
      )}

      {/* TABLE */}
      <TeamMemberTable
        members={filteredMembers}
        loading={loading}
        canManage={canManage}
        currentUserId={currentProfile?.id}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteMember}
      />

      {/* MODAL */}
      <TeamMemberFormModal
        member={selectedMember}
        teams={teams}
        roles={VALID_ROLES}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveAdd={handleSaveAdd}
        onSaveEdit={handleSaveEdit}
      />
    </div>
  );
}
