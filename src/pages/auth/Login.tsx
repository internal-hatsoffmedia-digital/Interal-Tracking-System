import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { signIn } from "../../services/auth/auth.service";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please check your credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        {/* Left Panel */}
        <div className="relative hidden overflow-hidden bg-slate-950 lg:flex">
          <div className="absolute inset-0">
            <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />

            <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl" />

            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Logo */}
            <Link to="/" className="w-fit">
              <div className="text-xl font-bold tracking-tight text-white">
                HATSOFF
              </div>

              <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Internal Force
              </div>
            </Link>

            {/* Main Content */}
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300">
                <ShieldCheck
                  size={14}
                  className="text-blue-400"
                />

                Secure Internal Workspace
              </div>

              <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white xl:text-6xl">
                Your work.
                <br />

                Your team.
                <br />

                <span className="text-blue-400">
                  One force.
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-base leading-7 text-slate-400">
                Access your production workspace, manage assigned tasks,
                track progress and stay connected with your team.
              </p>

              <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
                <div className="border-l border-white/10 pl-4">
                  <p className="text-lg font-semibold text-white">
                    24/7
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Workspace access
                  </p>
                </div>

                <div className="border-l border-white/10 pl-4">
                  <p className="text-lg font-semibold text-white">
                    1
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Unified workspace
                  </p>
                </div>

                <div className="border-l border-white/10 pl-4">
                  <p className="text-lg font-semibold text-white">
                    RBAC
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Access control
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="text-xs text-slate-600">
              Hatsoff Media · Internal Operations Platform
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">

            {/* Mobile Logo */}
            <div className="mb-12 lg:hidden">
              <Link to="/">
                <div className="text-xl font-bold tracking-tight text-slate-950">
                  HATSOFF
                </div>

                <div className="text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Internal Force
                </div>
              </Link>
            </div>

            {/* Heading */}
            <div>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                <LockKeyhole size={19} />
              </div>

              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Welcome back.
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to continue to your internal workspace.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-9 space-y-5"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Work Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@hatsoffmedia.com"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="text-xs font-medium text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    disabled={isSubmitting}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                />

                <label
                  htmlFor="remember"
                  className="text-xs text-slate-500"
                >
                  Keep me signed in
                </label>
              </div>

              {/* Error */}
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600"
                >
                  {errorMessage}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In

                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Access */}
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-center text-xs text-slate-500">
                Don&apos;t have internal access?
              </p>

              <div className="mt-2 text-center">
                <Link
                  to="/"
                  className="text-xs font-semibold text-slate-900 hover:text-blue-600"
                >
                  Contact your administrator
                </Link>
              </div>
            </div>

            {/* Security */}
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck size={13} />
              Protected internal workspace
            </div>

            {/* Back */}
            <div className="mt-5 text-center">
              <Link
                to="/"
                className="text-xs text-slate-400 transition hover:text-slate-700"
              >
                ← Back to Internal Force
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;