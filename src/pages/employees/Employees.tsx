import AuthEmployeeForm from "../../components/employees/AuthEmployeeForm";
import {
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../../context/AuthContext";

import EmployeeFilters from "../../components/employees/EmployeeFilters";

import EmployeeForm, {
  type EmployeeFormData,
} from "../../components/employees/EmployeeForm";

import EmployeeTable from "../../components/employees/EmployeeTable";

import {
  createEmployee,
  getAvailableEmployeeProfiles,
  getEmployees,
  setEmployeeStatus,
  updateEmployee,
} from "../../services/employees/employees.service";

import {
  getActiveTeams,
} from "../../services/teams/teams.service";

import type {
  EmployeeProfileOption,
} from "../../services/employees/employees.service";

import type {
  EmployeeWithTeam,
} from "../../types/employee";

import type {
  Team,
} from "../../types/team";


function Employees() {
  const {
    profile: currentProfile,
  } = useAuth();


  /* =========================================================
     STATE
  ========================================================== */

  const [
    employees,
    setEmployees,
  ] = useState<EmployeeWithTeam[]>(
    [],
  );

  const [
    teams,
    setTeams,
  ] = useState<Team[]>([]);

  const [
    profiles,
    setProfiles,
  ] = useState<EmployeeProfileOption[]>(
    [],
  );


  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  /* =========================================================
     FILTERS
  ========================================================== */

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    teamId,
    setTeamId,
  ] = useState("all");

  const [
    status,
    setStatus,
  ] = useState<
    "all" | "active" | "inactive"
  >("all");


  /* =========================================================
     FORM
  ========================================================== */

  const [
    isFormOpen,
    setIsFormOpen,
  ] = useState(false);

  const [
    editingEmployee,
    setEditingEmployee,
  ] = useState<EmployeeWithTeam | null>(
    null,
  );


  /* =========================================================
     PERMISSIONS
  ========================================================== */

  const canManageEmployees =
    currentProfile?.role ===
      "admin" ||
    currentProfile?.role ===
      "project_coordinator";


  /* =========================================================
     LOAD EMPLOYEES
  ========================================================== */

  const loadEmployees =
    useCallback(
      async (
        showRefresh = false,
      ) => {
        try {
          setErrorMessage("");

          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const [
            employeeData,
            teamData,
          ] = await Promise.all([
            getEmployees(),
            getActiveTeams(),
          ]);

          setEmployees(
            employeeData,
          );

          setTeams(teamData);
        } catch (error) {
          console.error(
            "Failed to load employees:",
            error,
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load employees.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );


  /* =========================================================
     LOAD PROFILES
  ========================================================== */

  const loadProfiles =
    useCallback(
      async () => {
        try {
          const profileData =
            await getAvailableEmployeeProfiles();

          setProfiles(
            profileData,
          );
        } catch (error) {
          console.error(
            "Failed to load employee profiles:",
            error,
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load available profiles.",
          );
        }
      },
      [],
    );


  /* =========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadEmployees();
    void loadProfiles();
  }, [
    loadEmployees,
    loadProfiles,
  ]);


  /* =========================================================
     FILTERED EMPLOYEES
  ========================================================== */

  const filteredEmployees =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return employees.filter(
        (employee) => {
          const matchesSearch =
            normalizedSearch === "" ||
            employee.full_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employee.email
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employee.employee_code
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesTeam =
            teamId === "all" ||
            employee.team_id ===
              teamId;

          const matchesStatus =
            status === "all" ||
            (
              status ===
                "active" &&
              employee.is_active
            ) ||
            (
              status ===
                "inactive" &&
              !employee.is_active
            );

          return (
            matchesSearch &&
            matchesTeam &&
            matchesStatus
          );
        },
      );
    }, [
      employees,
      search,
      teamId,
      status,
    ]);


  /* =========================================================
     COUNTS
  ========================================================== */

  const totalEmployees =
    employees.length;

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.is_active,
    ).length;

  const inactiveEmployees =
    employees.filter(
      (employee) =>
        !employee.is_active,
    ).length;


  /* =========================================================
     CLEAR FILTERS
  ========================================================== */

  const handleClearFilters =
    () => {
      setSearch("");
      setTeamId("all");
      setStatus("all");
    };


  /* =========================================================
     ADD EMPLOYEE
  ========================================================== */

  const handleAddEmployee =
    () => {
      setEditingEmployee(null);
      setErrorMessage("");
      setIsFormOpen(true);

      void loadProfiles();
    };


  /* =========================================================
     EDIT EMPLOYEE
  ========================================================== */

  const handleEdit = (
    employee: EmployeeWithTeam,
  ) => {
    setEditingEmployee(
      employee,
    );

    setErrorMessage("");
    setIsFormOpen(true);
  };


  /* =========================================================
     CLOSE FORM
  ========================================================== */

  const handleCloseForm =
    () => {
      if (saving) {
        return;
      }

      setIsFormOpen(false);
      setEditingEmployee(null);
    };


  /* =========================================================
     SAVE EMPLOYEE
  ========================================================== */

  const handleSubmitEmployee =
    async (
      formData: EmployeeFormData,
    ) => {
      setSaving(true);
      setErrorMessage("");

      try {
        if (editingEmployee) {
          const updatedEmployee =
            await updateEmployee(
              editingEmployee.id,
              {
                employee_code:
                  formData.employee_code,

                full_name:
                  formData.full_name,

                email:
                  formData.email,

                phone:
                  formData.phone ||
                  null,

                job_title:
                  formData.job_title ||
                  null,

                team_id:
                  formData.team_id ||
                  null,

                joining_date:
                  formData.joining_date ||
                  null,

                is_active:
                  formData.is_active,
              },
            );

          setEmployees(
            (
              currentEmployees,
            ) =>
              currentEmployees.map(
                (employee) =>
                  employee.id ===
                  updatedEmployee.id
                    ? updatedEmployee
                    : employee,
              ),
          );
        } else {
          const newEmployee =
            await createEmployee({
              profile_id:
                formData.profile_id,

              employee_code:
                formData.employee_code,

              full_name:
                formData.full_name,

              email:
                formData.email,

              phone:
                formData.phone ||
                null,

              job_title:
                formData.job_title ||
                null,

              team_id:
                formData.team_id ||
                null,

              joining_date:
                formData.joining_date ||
                null,
            });

          setEmployees(
            (
              currentEmployees,
            ) =>
              [
                ...currentEmployees,
                newEmployee,
              ].sort(
                (a, b) =>
                  a.full_name.localeCompare(
                    b.full_name,
                  ),
              ),
          );
        }

        setIsFormOpen(false);
        setEditingEmployee(null);

        await loadProfiles();
      } catch (error) {
        console.error(
          "Failed to save employee:",
          error,
        );

        throw error;
      } finally {
        setSaving(false);
      }
    };


  /* =========================================================
     TOGGLE STATUS
  ========================================================== */

  const handleToggleStatus =
    async (
      employee: EmployeeWithTeam,
    ) => {
      const action =
        employee.is_active
          ? "deactivate"
          : "activate";

      const confirmed =
        window.confirm(
          `Are you sure you want to ${action} ${employee.full_name}?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setErrorMessage("");

        const updatedEmployee =
          await setEmployeeStatus(
            employee.id,
            !employee.is_active,
          );

        setEmployees(
          (
            currentEmployees,
          ) =>
            currentEmployees.map(
              (currentEmployee) =>
                currentEmployee.id ===
                updatedEmployee.id
                  ? updatedEmployee
                  : currentEmployee,
            ),
        );
      } catch (error) {
        console.error(
          "Failed to update employee status:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to update employee status.",
        );
      }
    };


  /* =========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-w-0 space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="min-w-0">

        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div className="min-w-0">

            <div className="flex items-center gap-2">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Users size={19} />
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Organization
              </span>

            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Employees
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Manage employees, teams and
              internal workforce information.
            </p>

          </div>


          {/* ACTIONS */}

          {canManageEmployees && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  void loadEmployees(
                    true,
                  )
                }
                disabled={refreshing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >

                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh

              </button>


              <button
                type="button"
                onClick={
                  handleAddEmployee
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >

                <Plus size={17} />

                Add Employee

              </button>

            </div>
          )}

        </div>

      </section>


      {/* =====================================================
          ERROR
      ====================================================== */}

      {errorMessage && (
        <div className="flex min-w-0 items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

          <div className="min-w-0">

            <p className="text-sm font-semibold text-red-800">
              Something went wrong
            </p>

            <p className="mt-1 break-words text-xs leading-5 text-red-600">
              {errorMessage}
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setErrorMessage("")
            }
            className="shrink-0 text-xs font-medium text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>

        </div>
      )}


      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">

          <p className="text-xs font-medium text-slate-500">
            Total Employees
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {totalEmployees}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            All employee records
          </p>

        </div>


        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">

          <p className="text-xs font-medium text-slate-500">
            Active
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-600">
            {activeEmployees}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Currently active
          </p>

        </div>


        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">

          <p className="text-xs font-medium text-slate-500">
            Inactive
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-500">
            {inactiveEmployees}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Inactive employee records
          </p>

        </div>

      </section>


      {/* =====================================================
          FILTERS
      ====================================================== */}



      <EmployeeFilters
        search={search}
        teamId={teamId}
        status={status}
        teams={teams}
        onSearchChange={setSearch}
        onTeamChange={setTeamId}
        onStatusChange={setStatus}
        onClear={
          handleClearFilters
        }
      />


      {/* =====================================================
          COUNT
      ====================================================== */}

      {!loading && (
        <div className="flex min-w-0 items-center justify-between">

          <p className="text-xs text-slate-500">

            Showing{" "}

            <span className="font-semibold text-slate-700">
              {filteredEmployees.length}
            </span>

            {" "}of{" "}

            <span className="font-semibold text-slate-700">
              {employees.length}
            </span>

            {" "}employees

          </p>

        </div>
      )}


      {/* =====================================================
          TABLE
      ====================================================== */}

      <section className="min-w-0">

        <EmployeeTable
          employees={
            filteredEmployees
          }
          loading={loading}
          onEdit={handleEdit}
          onToggleStatus={
            handleToggleStatus
          }
        />

      </section>


      {/* =====================================================
          FORM
      ====================================================== */}

      {isFormOpen && !editingEmployee && currentProfile?.role === "admin" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <section role="dialog" aria-modal="true" aria-label="Add employee from Authentication" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4">
            <div className="mb-3 flex justify-end"><button type="button" autoFocus onClick={handleCloseForm} className="rounded-lg border px-3 py-2">Close</button></div>
            <AuthEmployeeForm onSaved={async () => { await loadEmployees(); }} />
          </section>
        </div>
      )}
      {isFormOpen && editingEmployee && (
        <EmployeeForm
          employee={
            editingEmployee
          }
          profiles={profiles}
          teams={teams}
          loading={
            loading || saving
          }
          onSubmit={
            handleSubmitEmployee
          }
          onClose={
            handleCloseForm
          }
        />
      )}

    </div>
  );
}

export default Employees;