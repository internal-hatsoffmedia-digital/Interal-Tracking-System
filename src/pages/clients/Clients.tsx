import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Plus,
  RefreshCw,
  Users,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import ClientFilters from "../../components/clients/ClientFilters";
import ClientForm from "../../components/clients/ClientForm";
import ClientTable from "../../components/clients/ClientTable";

import {
  createClient,
  getClients,
  setClientStatus,
  updateClient,
} from "../../services/clients/clients.service";

import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from "../../types/client";


/* =========================================================
   CLIENTS PAGE
========================================================= */

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

function Clients() {
  const { profile } = useAuth();
  const canCreateClient = ["admin", "director", "project_coordinator", "associate_lead", "team_lead"].includes(profile?.role ?? "");

  /* =======================================================
     DATA
  ======================================================== */

  const [clients, setClients] =
    useState<Client[]>([]);

  const [coordinators, setCoordinators] =
    useState<{ id: string; full_name: string; employee_code?: string }[]>([]);


  /* =======================================================
     LOADING
  ======================================================== */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);


  /* =======================================================
     ERROR / SUCCESS
  ======================================================== */

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  /* =======================================================
     FILTERS
  ======================================================== */

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState<
      "all" | "active" | "inactive"
    >("all");


  /* =======================================================
     FORM
  ======================================================== */

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [editingClient, setEditingClient] =
    useState<Client | null>(null);


  /* =======================================================
     LOAD CLIENTS & EMPLOYEES
  ======================================================== */

  const loadClients = useCallback(
    async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [data, empResult] = await Promise.all([
          getClients(),
          supabase.from("employees").select("id, full_name, employee_code").order("full_name", { ascending: true })
        ]);

        setClients(data);
        if (empResult.data) {
          setCoordinators(empResult.data as { id: string; full_name: string; employee_code?: string }[]);
        }
      } catch (error) {
        console.error(
          "Failed to load clients:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load clients.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );


  /* =======================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    void loadClients();
  }, [loadClients]);


  /* =======================================================
     AUTO HIDE SUCCESS MESSAGE
  ======================================================== */

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3500);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [successMessage]);


  /* =======================================================
     FILTER CLIENTS
  ======================================================== */

  const filteredClients =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return clients.filter(
        (client) => {

          /* SEARCH */

          const matchesSearch =
            !normalizedSearch ||
            client.name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            (
              client.short_name ||
              ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            (
              client.contact_person ||
              ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            (
              client.email ||
              ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            (
              client.phone ||
              ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch,
              );


          /* STATUS */

          const matchesStatus =
            status === "all" ||
            (
              status === "active" &&
              client.is_active
            ) ||
            (
              status === "inactive" &&
              !client.is_active
            );


          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      clients,
      search,
      status,
    ]);


  /* =======================================================
     STATISTICS
  ======================================================== */

  const totalClients =
    clients.length;

  const activeClients =
    clients.filter(
      (client) =>
        client.is_active,
    ).length;

  const inactiveClients =
    totalClients -
    activeClients;


  /* =======================================================
     OPEN CREATE FORM
  ======================================================== */

  const handleAddClient = () => {
    setEditingClient(null);
    setErrorMessage("");
    setSuccessMessage("");
    setIsFormOpen(true);
  };


  /* =======================================================
     OPEN EDIT FORM
  ======================================================== */

  const handleEditClient = (
    client: Client,
  ) => {
    setEditingClient(client);
    setErrorMessage("");
    setSuccessMessage("");
    setIsFormOpen(true);
  };


  /* =======================================================
     CLOSE FORM
  ======================================================== */

  const handleCloseForm = () => {
    if (saving) {
      return;
    }

    setIsFormOpen(false);
    setEditingClient(null);
  };


  /* =======================================================
     CREATE / UPDATE CLIENT
  ======================================================== */

  const handleSubmitClient = async (
    data:
      | CreateClientInput
      | UpdateClientInput,
  ) => {

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (editingClient) {

        /* UPDATE */

        const updatedClient =
          await updateClient(
            editingClient.id,
            data as UpdateClientInput,
          );

        setClients(
          (current) =>
            current.map(
              (client) =>
                client.id ===
                updatedClient.id
                  ? updatedClient
                  : client,
            ),
        );

        setSuccessMessage(
          "Client updated successfully.",
        );

      } else {

        /* CREATE */

        const newClient =
          await createClient(
            data as CreateClientInput,
          );

        setClients(
          (current) => [
            ...current,
            newClient,
          ],
        );

        setSuccessMessage(
          "Client created successfully.",
        );
      }

      setIsFormOpen(false);
      setEditingClient(null);

    } catch (error) {
      console.error(
        "Failed to save client:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save client.",
      );

      throw error;

    } finally {
      setSaving(false);
    }
  };


  /* =======================================================
     TOGGLE CLIENT STATUS
  ======================================================== */

  const handleToggleStatus = async (
    client: Client,
  ) => {

    const action =
      client.is_active
        ? "deactivate"
        : "activate";


    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} "${client.name}"?`,
      );


    if (!confirmed) {
      return;
    }


    try {
      setErrorMessage("");
      setSuccessMessage("");

      const updatedClient =
        await setClientStatus(
          client.id,
          !client.is_active,
        );


      setClients(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updatedClient.id
                ? updatedClient
                : item,
          ),
      );


      setSuccessMessage(
        updatedClient.is_active
          ? "Client activated successfully."
          : "Client deactivated successfully.",
      );

    } catch (error) {
      console.error(
        "Failed to update client status:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update client status.",
      );
    }
  };


  /* =======================================================
     REFRESH
  ======================================================== */

  const handleRefresh = async () => {

    if (refreshing) {
      return;
    }

    try {
      setRefreshing(true);
      setErrorMessage("");

      await loadClients();

      setSuccessMessage(
        "Client list refreshed.",
      );

    } finally {
      setRefreshing(false);
    }
  };


  /* =======================================================
     CLEAR FILTERS
  ======================================================== */

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
  };


  /* =======================================================
     CLOSE ERROR
  ======================================================== */

  const handleCloseError = () => {
    setErrorMessage("");
  };


  /* =======================================================
     PAGE
  ======================================================== */

  return (
    <div className="min-w-0 space-y-6">

      {/* ===================================================
          PAGE HEADER
      ==================================================== */}

      <section className="min-w-0">

        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          {/* LEFT */}

          <div className="min-w-0">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">

                <BriefcaseBusiness
                  size={19}
                  strokeWidth={1.8}
                />

              </div>

              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Organization
              </span>

            </div>


            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Clients
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Manage clients, contacts and
              business information for your
              production workflow.
            </p>

          </div>


          {/* RIGHT ACTIONS */}

          <div className="flex shrink-0 flex-wrap items-center gap-2">

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                refreshing ||
                loading
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <RefreshCw
                size={16}
                strokeWidth={1.8}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              <span>
                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </span>

            </button>


            {canCreateClient && (
              <button
                type="button"
                onClick={
                  handleAddClient
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >

                <Plus
                  size={17}
                  strokeWidth={2}
                />

                Add Client

              </button>
            )}

          </div>

        </div>

      </section>


      {/* ===================================================
          SUCCESS MESSAGE
      ==================================================== */}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">

          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <p className="flex-1 text-sm text-emerald-700">
            {successMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
            className="shrink-0 text-emerald-500 transition hover:text-emerald-700"
            aria-label="Close success message"
          >
            <X
              size={16}
            />
          </button>

        </div>
      )}


      {/* ===================================================
          ERROR MESSAGE
      ==================================================== */}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">

          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0 text-red-500"
          />

          <p className="flex-1 break-words text-sm leading-5 text-red-600">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={
              handleCloseError
            }
            className="shrink-0 text-red-400 transition hover:text-red-600"
            aria-label="Close error message"
          >
            <X
              size={16}
            />
          </button>

        </div>
      )}


      {/* ===================================================
          STATISTICS
      ==================================================== */}

      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {/* TOTAL */}

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-medium text-slate-500">
                Total Clients
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {totalClients}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                All client records
              </p>

            </div>


            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">

              <Users
                size={18}
                strokeWidth={1.8}
              />

            </div>

          </div>

        </div>


        {/* ACTIVE */}

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-medium text-slate-500">
                Active
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-600">
                {activeClients}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Currently active
              </p>

            </div>


            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

              <CheckCircle2
                size={18}
                strokeWidth={1.8}
              />

            </div>

          </div>

        </div>


        {/* INACTIVE */}

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-medium text-slate-500">
                Inactive
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-500">
                {inactiveClients}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Inactive client records
              </p>

            </div>


            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">

              <Users
                size={18}
                strokeWidth={1.8}
              />

            </div>

          </div>

        </div>

      </section>


      {/* ===================================================
          FILTERS
      ==================================================== */}

      <ClientFilters
        search={search}
        status={status}
        onSearchChange={
          setSearch
        }
        onStatusChange={
          setStatus
        }
        onClearFilters={
          handleClearFilters
        }
      />


      {/* ===================================================
          RESULT COUNT
      ==================================================== */}

      <div className="flex min-w-0 items-center justify-between gap-4">

        <p className="text-xs text-slate-500">

          Showing{" "}

          <span className="font-medium text-slate-700">
            {filteredClients.length}
          </span>

          {" "}of{" "}

          <span className="font-medium text-slate-700">
            {totalClients}
          </span>

          {" "}clients

        </p>


        {(search ||
          status !== "all") && (
          <button
            type="button"
            onClick={
              handleClearFilters
            }
            className="shrink-0 text-xs font-medium text-slate-500 transition hover:text-slate-900"
          >
            Clear filters
          </button>
        )}

      </div>


      {/* ===================================================
          CLIENT TABLE
      ==================================================== */}

      <ClientTable
        clients={
          filteredClients
        }
        loading={loading}
        onEdit={
          handleEditClient
        }
        onToggleStatus={
          handleToggleStatus
        }
      />


      {/* ===================================================
          CLIENT FORM
      ==================================================== */}

      <ClientForm
        open={isFormOpen}
        client={editingClient}
        coordinators={coordinators}
        loading={saving}
        error=""
        onClose={
          handleCloseForm
        }
        onSubmit={
          handleSubmitClient
        }
      />

    </div>
  );
}


export default Clients;