import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import {PageAccessProvider} from '../../context/PageAccessContext';
import {usePageAccess} from '../../context/pageAccess';
import '../../styles/daily-workspace.css';
import '../../styles/moon-theme.css';

function PageGate(){const {allowed,loading,error}=usePageAccess();const location=useLocation();if(loading)return <p role="status">Loading page access…</p>;if(error)return <p role="alert">{error}</p>;if(!allowed(location.pathname))return <section className="desk-card"><h1>Page access restricted</h1><p>Ask your Admin, Manager or Director to update your page access.</p></section>;return <Outlet/>;}

function AppShell() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#attention") {
      document.getElementById("attention")?.scrollIntoView({ block: "start" });
    }
  }, [location]);

  return (
    <PageAccessProvider><div className="workspace-shell future-shell modern-studio relative min-h-screen w-full bg-[#F8F8F6] text-[#4A4A4A] dark:bg-[#111111] dark:text-[#FFFFFF] overflow-x-hidden">
      <div className="moon-scene" aria-hidden="true"/>
      {/* Decorative workspace background */}
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
            <PageGate />
          </div>
        </main>
      </div>
    </div></PageAccessProvider>
  );
}

export default AppShell;
