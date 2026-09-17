import {useState} from 'react';
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function recover(action:()=>Promise<void>){setBusy(true);setError('');try{await action();}catch{setError('Unable to complete this action. Please retry.');}finally{setBusy(false);}}
 const recoveryActions=<div className="mt-5"><div className="flex justify-center gap-3"><button disabled={busy} className="rounded-full border px-4 py-2" onClick={()=>void recover(refreshProfile)}>Retry profile</button><button disabled={busy} className="rounded-full bg-[#ffcc00] px-4 py-2 text-black" onClick={()=>void recover(signOut)}>Sign out</button></div>{error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</div>;
  const location = useLocation();

  // Wait until Supabase finishes checking the session
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          Loading your workspace...
        </div>
      </div>
    );
  }

  // No authenticated Supabase user
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  // Auth user exists but profile doesn't exist
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            !
          </div>

          <h1 className="mt-5 text-lg font-semibold text-slate-950">
            Profile not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your account is authenticated, but your internal
            profile has not been configured yet.
          </p>
        {recoveryActions}
        </div>
      </div>
    );
  }

  // Profile exists but account is inactive
  if (!profile.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            !
          </div>

          <h1 className="mt-5 text-lg font-semibold text-slate-950">
            Account inactive
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your internal account is currently inactive.
            Please contact your administrator.
          </p>
        {recoveryActions}
        </div>
      </div>
    );
  }

  // Everything is valid
  return <Outlet />;
}

export default ProtectedRoute;