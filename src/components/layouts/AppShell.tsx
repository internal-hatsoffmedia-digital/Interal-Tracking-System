import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppShell() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#attention") {
      document.getElementById("attention")?.scrollIntoView({ block: "start" });
    }
  }, [location]);

  return (
    <div className="workspace-shell future-shell relative min-h-screen w-full bg-slate-50 dark:bg-[#09090b] dark:text-[#f4f4f5] overflow-x-hidden">
      {/* Floating Radium Ambient Balls Background */}
      <div className="radium-ambient-container pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="radium-ball radium-ball-1" />
        <div className="radium-ball radium-ball-2" />
        <div className="radium-ball radium-ball-3" />
        <div className="radium-ball radium-ball-4" />
      </div>

      {/* Desktop sidebar / mobile drawer */}
      <a className="future-skip-link" href="#main-content">Skip to content</a>
      <Sidebar />

      {/* Main application area */}
      <div className="future-main relative z-10 flex min-h-screen min-w-0 flex-col">
        <Topbar />

        <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="future-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
