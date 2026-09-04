import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  Timer,
  Users,
  UserRound,
  BriefcaseBusiness,
  X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const navigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Work",
    path: "/my-work",
    icon: CheckSquare,
  },
  {
    label: "Tasks",
    path: "/tasks",
    icon: ClipboardList,
  },
  {
    label: "Planner",
    path: "/planner",
    icon: CalendarDays,
  },
  {
    label: "Timesheet",
    path: "/timesheet",
    icon: Timer,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Clients",
    path: "/clients",
    icon: BriefcaseBusiness,
  },
  {
    label: "Teams",
    path: "/teams",
    icon: Users,
  },
  {
    label: "Employees",
    path: "/employees",
    icon: UserRound,
  },
  {
    label: "Performance",
    path: "/performance",
    icon: BarChart3,
  },
];

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

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    profile,
    loading,
    signOut,
  } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);

  /*
   * Listen for the mobile menu toggle from Topbar.
   *
   * Topbar will dispatch:
   * window.dispatchEvent(
   *   new CustomEvent("hatsoff:toggle-mobile-sidebar")
   * )
   */
  useEffect(() => {
    const handleToggle = () => {
      setMobileOpen((current) => !current);
    };

    const handleClose = () => {
      setMobileOpen(false);
    };

    window.addEventListener(
      "hatsoff:toggle-mobile-sidebar",
      handleToggle,
    );

    window.addEventListener(
      "hatsoff:close-mobile-sidebar",
      handleClose,
    );

    return () => {
      window.removeEventListener(
        "hatsoff:toggle-mobile-sidebar",
        handleToggle,
      );

      window.removeEventListener(
        "hatsoff:close-mobile-sidebar",
        handleClose,
      );
    };
  }, []);

  /*
   * Close the mobile sidebar whenever the route changes.
   */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /*
   * Prevent background scrolling while the mobile drawer is open.
   */
  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /*
   * Close the mobile drawer when Escape is pressed.
   */
  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [mobileOpen]);

  const closeMobileSidebar = () => {
    setMobileOpen(false);

    window.dispatchEvent(
      new CustomEvent(
        "hatsoff:close-mobile-sidebar",
      ),
    );
  };

  const handleLogout = async () => {
    try {
      closeMobileSidebar();

      await signOut();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout failed:",
        error,
      );
    }
  };

  const displayName =
    profile?.full_name?.trim() || "Internal User";

  const displayRole = formatRole(
    profile?.role,
  );

  const initials = getInitials(
    profile?.full_name,
  );

  const navItems = [
    ...navigation,
    {
      label: "Reports",
      path: "/reports",
      icon: BarChart3,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* =====================================================
          MOBILE BACKDROP
      ====================================================== */}

      <div
        aria-hidden={!mobileOpen}
        onClick={closeMobileSidebar}
        className={[
          "fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />


      {/* =====================================================
          SIDEBAR

          Desktop:
          - Always visible
          - Fixed
          - 256px wide

          Mobile:
          - Hidden off-screen by default
          - Slides in when mobileOpen = true
          - Overlay drawer
      ====================================================== */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out lg:z-40 lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >

        {/* =========================================
            BRAND
        ========================================== */}

        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 px-5 sm:px-6">

          <button
            type="button"
            onClick={() => {
              navigate("/dashboard");
              closeMobileSidebar();
            }}
            className="text-left"
          >
            <div className="text-lg font-bold tracking-tight text-slate-950">
              HATSOFF
            </div>

            <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Internal Force
            </div>
          </button>


          {/* Mobile close button */}

          <button
            type="button"
            onClick={closeMobileSidebar}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
          >
            <X size={19} />
          </button>

        </div>


        {/* =========================================
            NAVIGATION
        ========================================== */}

        <nav className="flex-1 overflow-y-auto p-4">

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>


          <div className="space-y-1">

            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        strokeWidth={1.8}
                      />

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {isActive && (
                        <ChevronRight
                          size={15}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}

          </div>

        </nav>


        {/* =========================================
            USER SECTION
        ========================================== */}

        <div className="shrink-0 border-t border-slate-200 p-4">

          <div className="rounded-xl bg-slate-50 p-3">

            {/* User Information */}

            <div className="flex items-center gap-3">

              {/* Avatar */}

              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {loading
                    ? "..."
                    : initials}
                </div>
              )}


              {/* Name + Role */}

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-semibold text-slate-900">
                  {loading
                    ? "Loading..."
                    : displayName}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {loading
                    ? "Please wait"
                    : displayRole}
                </p>

              </div>

            </div>


            {/* Logout */}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-red-600"
            >
              <LogOut
                size={14}
                strokeWidth={1.8}
              />

              <span>
                Sign out
              </span>
            </button>

          </div>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;