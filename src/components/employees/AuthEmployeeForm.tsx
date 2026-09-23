import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, RefreshCw, User, UserCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Account = { id: string; email: string; full_name: string };

export default function AuthEmployeeForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function refresh() {
    const r = await supabase.rpc("admin_team_accounts");
    if (r.error) {
      throw new Error(
        r.error.code === "PGRST202"
          ? "Apply migrations 015 and 016 in Supabase, then refresh users."
          : r.error.message,
      );
    }
    setAccounts((r.data ?? []).filter((a: Account) => a.email?.includes("@")));
  }

  useEffect(() => {
    let active = true;
    void supabase.rpc("admin_team_accounts").then((r) => {
      if (!active) return;
      if (r.error) {
        setError(
          r.error.code === "PGRST202"
            ? "Authentication user setup is not installed. Apply migrations 015 and 016 in Supabase, then click Refresh Authentication users."
            : r.error.message,
        );
      } else {
        setAccounts((r.data ?? []).filter((a: Account) => a.email?.includes("@")));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  async function run(save: boolean) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (save) {
        const r = await supabase.rpc("admin_save_auth_employee", {
          p_account: account,
          p_name: name.trim(),
        });
        if (r.error) throw r.error;
        await onSaved();
        setSuccess("Employee saved successfully. You can now assign their team in Teams.");
      }
      await refresh();
    } catch (e) {
      setError((e as { message?: string }).message ?? "Unable to save employee.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
      onSubmit={(e) => {
        e.preventDefault();
        void run(true);
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
          <UserCheck size={18} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-950">Add Employee from Authentication</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Select an existing login email to provision their employee record.
          </p>
        </div>
      </div>

      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        {/* EMAIL SELECT */}
        <div>
          <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-slate-700">
            Authentication Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              id="auth-email"
              required
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              value={account}
              onChange={(e) => {
                setAccount(e.target.value);
                const a = accounts.find((acc) => acc.id === e.target.value);
                setName(a && a.full_name !== a.email ? a.full_name : "");
                setSuccess("");
              }}
            >
              <option value="">Select an email address</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* EMPLOYEE NAME */}
        <div>
          <label htmlFor="auth-name" className="mb-1.5 block text-xs font-medium text-slate-700">
            Employee Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="auth-name"
              required
              maxLength={200}
              placeholder="e.g. Muskan Sharma"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => void run(false)}
            disabled={busy}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw size={14} className={busy ? "animate-spin text-slate-900" : ""} />
            Refresh Auth Users
          </button>

          <button
            type="submit"
            disabled={!name.trim() || !account || busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save Employee"}
          </button>
        </div>
      </fieldset>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          {success}
        </div>
      )}

      <div className="pt-1">
        <Link
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition hover:text-slate-900 hover:underline"
          to="/teams"
        >
          Create a team or assign membership <ArrowRight size={13} />
        </Link>
      </div>
    </form>
  );
}
