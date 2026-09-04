import {
  CheckCircle2,
  Edit3,
  Mail,
  Phone,
  Power,
  UserRound,
  XCircle,
} from "lucide-react";

import type {
  Client,
} from "../../types/client";


interface ClientTableProps {
  clients: Client[];

  loading?: boolean;

  onEdit: (
    client: Client,
  ) => void;

  onToggleStatus: (
    client: Client,
  ) => void | Promise<void>;
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyClientState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <UserRound
          size={22}
          strokeWidth={1.7}
        />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        No clients found
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        No clients match your current
        search or filter.
      </p>

    </div>
  );
}


/* =========================================================
   LOADING SKELETON
========================================================= */

function ClientTableSkeleton() {
  return (
    <div className="divide-y divide-slate-100">

      {Array.from(
        { length: 5 },
        (_, index) => (
          <div
            key={index}
            className="flex min-w-[950px] items-center gap-5 px-6 py-5"
          >

            <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-100" />

            <div className="w-[250px] shrink-0">

              <div className="h-3.5 w-32 animate-pulse rounded bg-slate-100" />

              <div className="mt-2 h-3 w-48 animate-pulse rounded bg-slate-100" />

            </div>

            <div className="h-7 w-20 animate-pulse rounded-lg bg-slate-100" />

            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />

            <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />

            <div className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />

            <div className="ml-auto h-8 w-24 animate-pulse rounded-lg bg-slate-100" />

          </div>
        ),
      )}

    </div>
  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function ClientStatus({
  active,
}: {
  active: boolean;
}) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">

        <CheckCircle2
          size={13}
          strokeWidth={1.8}
        />

        Active

      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">

      <XCircle
        size={13}
        strokeWidth={1.8}
      />

      Inactive

    </span>
  );
}


/* =========================================================
   CLIENT TABLE
========================================================= */

function ClientTable({
  clients,
  loading = false,
  onEdit,
  onToggleStatus,
}: ClientTableProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">

      {/* ===================================================
          DESKTOP TABLE
      ==================================================== */}

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1000px] border-collapse">

          <thead>

            <tr className="border-b border-slate-200 bg-slate-50/70">

              <th className="w-[280px] px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Client
              </th>

              <th className="w-[130px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Short Name
              </th>

              <th className="w-[200px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Contact Person
              </th>

              <th className="w-[220px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Contact
              </th>

              <th className="w-[130px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Status
              </th>

              <th className="w-[210px] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Actions
              </th>

            </tr>

          </thead>


          <tbody className="divide-y divide-slate-100">

            {loading && (
              <tr>

                <td
                  colSpan={6}
                  className="p-0"
                >
                  <ClientTableSkeleton />
                </td>

              </tr>
            )}


            {!loading &&
              clients.length === 0 && (
                <tr>

                  <td
                    colSpan={6}
                    className="p-0"
                  >
                    <EmptyClientState />
                  </td>

                </tr>
              )}


            {!loading &&
              clients.length > 0 &&
              clients.map(
                (client) => (
                  <tr
                    key={client.id}
                    className="transition hover:bg-slate-50/60"
                  >

                    {/* CLIENT */}

                    <td className="px-6 py-5">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold uppercase text-white">
                          {client.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-slate-900">
                            {client.name}
                          </p>

                          <div className="mt-1 flex min-w-0 items-center gap-1.5">

                            <Mail
                              size={12}
                              strokeWidth={1.8}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="truncate text-xs text-slate-400">
                              {client.email ||
                                "No email added"}
                            </span>

                          </div>

                        </div>

                      </div>

                    </td>


                    {/* SHORT NAME */}

                    <td className="px-5 py-5">

                      {client.short_name ? (
                        <span className="inline-flex whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {
                            client.short_name
                          }
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">
                          —
                        </span>
                      )}

                    </td>


                    {/* CONTACT PERSON */}

                    <td className="px-5 py-5">

                      <span className="whitespace-nowrap text-sm text-slate-600">
                        {
                          client.contact_person ||
                          "—"
                        }
                      </span>

                    </td>


                    {/* CONTACT */}

                    <td className="px-5 py-5">

                      <div className="space-y-1.5">

                        {client.email && (
                          <div className="flex items-center gap-1.5">

                            <Mail
                              size={12}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="max-w-[180px] truncate text-xs text-slate-500">
                              {client.email}
                            </span>

                          </div>
                        )}

                        {client.phone && (
                          <div className="flex items-center gap-1.5">

                            <Phone
                              size={12}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="text-xs text-slate-500">
                              {client.phone}
                            </span>

                          </div>
                        )}

                        {!client.email &&
                          !client.phone && (
                            <span className="text-xs text-slate-400">
                              No contact details
                            </span>
                          )}

                      </div>

                    </td>


                    {/* STATUS */}

                    <td className="px-5 py-5">

                      <ClientStatus
                        active={
                          client.is_active
                        }
                      />

                    </td>


                    {/* ACTIONS */}

                    <td className="px-5 py-5">

                      <div className="flex items-center gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            onEdit(client)
                          }
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                        >

                          <Edit3
                            size={14}
                            strokeWidth={1.8}
                          />

                          Edit

                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            void onToggleStatus(
                              client,
                            )
                          }
                          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
                            client.is_active
                              ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                              : "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >

                          <Power
                            size={14}
                            strokeWidth={1.8}
                          />

                          {client.is_active
                            ? "Deactivate"
                            : "Activate"}

                        </button>

                      </div>

                    </td>

                  </tr>
                ),
              )}

          </tbody>

        </table>

      </div>


      {/* ===================================================
          MOBILE
      ==================================================== */}

      <div className="divide-y divide-slate-100 md:hidden">

        {loading ? (
          <ClientTableSkeleton />
        ) : clients.length === 0 ? (
          <EmptyClientState />
        ) : (
          clients.map(
            (client) => (
              <div
                key={client.id}
                className="p-4"
              >

                {/* HEADER */}

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
                    {client.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-semibold text-slate-900">
                      {client.name}
                    </p>

                    {client.short_name && (
                      <p className="mt-1 text-xs text-slate-400">
                        {client.short_name}
                      </p>
                    )}

                  </div>

                  <ClientStatus
                    active={
                      client.is_active
                    }
                  />

                </div>


                {/* DETAILS */}

                <div className="mt-4 space-y-3">

                  {client.contact_person && (
                    <div className="rounded-xl bg-slate-50 p-3">

                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Contact Person
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-700">
                        {
                          client.contact_person
                        }
                      </p>

                    </div>
                  )}


                  {client.email && (
                    <div className="rounded-xl bg-slate-50 p-3">

                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Email
                      </p>

                      <p className="mt-1 break-all text-xs font-medium text-slate-700">
                        {client.email}
                      </p>

                    </div>
                  )}


                  {client.phone && (
                    <div className="rounded-xl bg-slate-50 p-3">

                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Phone
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-700">
                        {client.phone}
                      </p>

                    </div>
                  )}

                </div>


                {/* ACTIONS */}

                <div className="mt-4 flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      onEdit(client)
                    }
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                  >

                    <Edit3
                      size={14}
                    />

                    Edit Client

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      void onToggleStatus(
                        client,
                      )
                    }
                    className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-xs font-medium transition ${
                      client.is_active
                        ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                        : "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
                  >

                    <Power
                      size={14}
                    />

                    {client.is_active
                      ? "Deactivate"
                      : "Activate"}

                  </button>

                </div>

              </div>
            )
          )
        )}

      </div>

    </div>
  );
}

export default ClientTable;