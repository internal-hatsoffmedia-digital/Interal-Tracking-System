import { useEffect, useState } from 'react';
import { Users, RefreshCw, Mail, Briefcase, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyTeam, type MyTeamData } from '../../services/teams/myTeam.service';

export default function MyTeam() {
  const { profile } = useAuth();
  const [team, setTeam] = useState<MyTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTeam(null);
    setError('');
    getMyTeam()
      .then((data) => {
        if (!cancelled) setTeam(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Unable to load your team.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.id, profile?.team_id, profile?.role, revision]);

  return (
    <div className="space-y-6">
      {/* ===================================================
          PAGE HEADER
      =================================================== */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold tracking-wider text-amber-800 dark:text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>SQUAD OVERSIGHT</span>
          </div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            <Users className="h-7 w-7 text-amber-500" />
            My Team
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your assigned team and its active specialists roster.
          </p>
        </div>

        <button
          onClick={() => setRevision((v) => v + 1)}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </header>

      {loading ? (
        <p role="status" className="text-sm text-slate-500">Loading your team…</p>
      ) : error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </p>
      ) : !team ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No team assigned</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            No team is assigned to your account. Ask an administrator to assign your squad in Studio → Team Members.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-6 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{team.name}</h2>
                {team.description && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{team.description}</p>
                )}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                <UserCheck className="h-3.5 w-3.5 text-amber-600" />
                {team.members.length} team members
              </span>
            </div>
          </div>

          {team.members.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-500">
              No employees have been added to this team yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {team.members.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-[#FFF8EA] dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 font-bold text-amber-900 dark:text-amber-300 text-sm">
                      {member.full_name ? member.full_name.charAt(0).toUpperCase() : 'M'}
                    </span>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">
                        {member.full_name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {member.job_title || 'Team member'}
                        </span>
                        {member.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={
                      'rounded-full px-3 py-1 text-xs font-semibold ' +
                      (member.is_active
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-800')
                    }
                  >
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
