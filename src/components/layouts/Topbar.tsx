import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function formatRole(role?: string | null) {
  if (!role) {
    return "Internal User";
  }

  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getInitials(name?: string | null) {
  if (!name?.trim()) {
    return "U";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function Topbar() {
  const navigate = useNavigate();

  const { profile, signOut } = useAuth();

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState(false);

  const [currentDateTime, setCurrentDateTime] =
    useState(new Date());

  const displayName =
    profile?.full_name?.trim() || "Internal User";

  const displayRole = formatRole(
    profile?.role,
  );

  const initials = getInitials(
    profile?.full_name,
  );

  /*
   * =====================================================
   * LIVE DATE & TIME
   * =====================================================
   */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const formattedDate =
    currentDateTime.toLocaleDateString(
      "en-IN",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );

  const formattedTime =
    currentDateTime.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      },
    );

  /*
   * =====================================================
   * MOBILE SIDEBAR EVENTS
   * =====================================================
   */

  useEffect(() => {
    const handleSidebarClosed = () => {
      setIsMobileSidebarOpen(false);
    };

    window.addEventListener(
      "hatsoff:close-mobile-sidebar",
      handleSidebarClosed,
    );

    return () => {
      window.removeEventListener(
        "hatsoff:close-mobile-sidebar",
        handleSidebarClosed,
      );
    };
  }, []);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(
      (current) => !current,
    );

    window.dispatchEvent(
      new CustomEvent(
        "hatsoff:toggle-mobile-sidebar",
      ),
    );
  };

  /*
   * =====================================================
   * LOGOUT
   * =====================================================
   */

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      setIsProfileOpen(false);
      setIsMobileSidebarOpen(false);

      window.dispatchEvent(
        new CustomEvent(
          "hatsoff:close-mobile-sidebar",
        ),
      );

      await signOut();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout failed:",
        error,
      );

      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:h-20 sm:px-6 lg:px-8">

      {/* =====================================================
          MOBILE MENU
      ====================================================== */}

      <button
        type="button"
        onClick={toggleMobileSidebar}
        aria-label={
          isMobileSidebarOpen
            ? "Close navigation"
            : "Open navigation"
        }
        aria-expanded={isMobileSidebarOpen}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
      >
        {isMobileSidebarOpen ? (
          <X
            size={20}
            strokeWidth={1.8}
          />
        ) : (
          <Menu
            size={20}
            strokeWidth={1.8}
          />
        )}
      </button>


      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div className="relative min-w-0 flex-1 lg:max-w-xl">

        <Search
          size={17}
          strokeWidth={1.8}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 sm:left-4"
        />

        <input
          type="search"
          placeholder="Search tasks, projects, clients..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5 sm:h-12 sm:pl-11 sm:pr-16"
        />

        <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-400 sm:flex">
          Ctrl
          <span className="mx-0.5">
            +
          </span>
          K
        </div>

      </div>


      {/* =====================================================
          WORK THEME
      ====================================================== */}

      <div className="hidden min-w-0 items-center xl:flex">

        <div className="h-8 w-px bg-slate-200" />

        <div className="ml-5 min-w-0 max-w-[260px]">

          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Work Theme
          </p>

          <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
            Focus. Create. Deliver.
          </p>

        </div>

      </div>


      {/* =====================================================
          DATE + TIME
      ====================================================== */}

      <div className="hidden shrink-0 items-center gap-3 xl:flex">

        <div className="h-8 w-px bg-slate-200" />

        <div className="text-right">

          <p className="text-xs font-semibold text-slate-700">
            {formattedDate}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {formattedTime}
          </p>

        </div>

      </div>


      {/* =====================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="flex shrink-0 items-center gap-1.5 sm:ml-4 sm:gap-3">

        {/* Notification */}

        <button
          type="button"
          aria-label="Notifications"
          onClick={() =>
            navigate("/notifications")
          }
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell
            size={19}
            strokeWidth={1.8}
          />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
        </button>


        {/* Divider */}

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />


        {/* =================================================
            PROFILE
        ================================================== */}

        <div className="relative">

          <button
            type="button"
            onClick={() =>
              setIsProfileOpen(
                (current) => !current,
              )
            }
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50 sm:gap-3 sm:px-2 sm:py-1.5"
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
          >

            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white sm:h-10 sm:w-10">
                {initials}
              </div>
            )}

            <div className="hidden text-left sm:block">
              <p className="max-w-[130px] truncate text-sm font-semibold text-slate-900">
                {displayName}
              </p>

              <p className="max-w-[130px] truncate text-xs text-slate-500">
                {displayRole}
              </p>
            </div>

            <ChevronDown
              size={15}
              className={`hidden text-slate-400 transition-transform sm:block ${
                isProfileOpen
                  ? "rotate-180"
                  : ""
              }`}
            />

          </button>


          {/* =================================================
              PROFILE DROPDOWN
          ================================================== */}

          {isProfileOpen && (
            <>
              <button
                type="button"
                aria-label="Close profile menu"
                onClick={() =>
                  setIsProfileOpen(false)
                }
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-24px)] max-w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10">

                {/* Profile header */}

                <div className="border-b border-slate-100 p-4">

                  <div className="flex items-center gap-3">

                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-slate-900">
                        {displayName}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {displayRole}
                      </p>

                    </div>

                  </div>

                </div>


                {/* Profile actions */}

                <div className="p-2">

                  {/* My Profile */}

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate("/settings");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    <User
                      size={16}
                      strokeWidth={1.8}
                    />

                    <span>
                      My Profile
                    </span>
                  </button>


                  {/* Sign out */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LogOut
                      size={16}
                      strokeWidth={1.8}
                    />

                    <span>
                      {isLoggingOut
                        ? "Signing out..."
                        : "Sign out"}
                    </span>
                  </button>

                </div>

              </div>
            </>
          )}

        </div>

      </div>

    </header>
  );
}

export default Topbar;