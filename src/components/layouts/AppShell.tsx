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
    <div className="workspace-shell future-shell min-h-screen w-full bg-slate-50">
      {/* Desktop sidebar / mobile drawer */}
      <a className="future-skip-link" href="#main-content">Skip to content</a>
      <Sidebar />

      {/* Main application area */}
      <div className="future-main flex min-h-screen min-w-0 flex-col">
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
