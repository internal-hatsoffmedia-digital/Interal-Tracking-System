import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppShell() {
  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Desktop sidebar / mobile drawer */}
      <Sidebar />

      {/* Main application area */}
      <div className="flex min-h-screen min-w-0 flex-col lg:ml-64">
        <Topbar />

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;