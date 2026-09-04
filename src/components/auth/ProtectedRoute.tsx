import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute() {
  const { user, profile, loading } = useAuth();
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
        </div>
      </div>
    );
  }

  // Everything is valid
  return <Outlet />;
}

export default ProtectedRoute;