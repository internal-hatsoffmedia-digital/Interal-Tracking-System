import { useState } from "react";
import ActiveProjects from "../../components/dashboard/ActiveProjects";
import AttentionTasks from "../../components/dashboard/AttentionTasks";
import ClientAccountRadar from "../../components/dashboard/ClientAccountRadar";
import ExecutiveBriefing from "../../components/dashboard/ExecutiveBriefing";
import ProductionAlert from "../../components/dashboard/ProductionAlert";
import ProductionFunnel from "../../components/dashboard/ProductionFunnel";
import ProductionOverview from "../../components/dashboard/ProductionOverview";
import ProjectHealth from "../../components/dashboard/ProjectHealth";
import StatsCards from "../../components/dashboard/StatsCards";
import TeamWorkload from "../../components/dashboard/TeamWorkload";

function Dashboard() {
  const [viewMode, setViewMode] = useState<"executive" | "operations">("executive");

  return (
    <div className="min-h-full w-full">
      <div className="space-y-7">

        {/* ==================================================
            EXECUTIVE BRIEFING HERO BANNER
        ================================================== */}
        <section aria-label="Executive Briefing">
          <ExecutiveBriefing
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
          />
        </section>

        {viewMode === "executive" ? (
          /* ==================================================
              CEO / EXECUTIVE COMMAND CENTER VIEW
          ================================================== */
          <>
            {/* AGENCY VELOCITY THROUGHPUT PIPELINE */}
            <section aria-label="Agency Velocity Pipeline">
              <ProductionFunnel />
            </section>

            {/* VIP CLIENT ACCOUNT RADAR */}
            <section aria-label="Client Account Radar">
              <ClientAccountRadar />
            </section>

            {/* ACTIVE INITIATIVES & WORKLOAD BALANCE */}
            <section
              aria-label="Projects and team workload"
              className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]"
            >
              <ActiveProjects />
              <TeamWorkload />
            </section>

            {/* CRITICAL ATTENTION MATRIX */}
            <section aria-label="Tasks requiring attention">
              <AttentionTasks />
            </section>
          </>
        ) : (
          /* ==================================================
              OPERATIONS & DETAILED STUDIO FLOW VIEW
          ================================================== */
          <>
            {/* KPI / SUMMARY CARDS */}
            <section aria-label="Dashboard summary">
              <StatsCards />
            </section>

            {/* PRODUCTION OVERVIEW + PROJECT HEALTH */}
            <section
              aria-label="Production overview"
              className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]"
            >
              <ProductionOverview />
              <ProjectHealth />
            </section>

            {/* ACTIVE PROJECTS + TEAM WORKLOAD */}
            <section
              aria-label="Projects and team workload"
              className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]"
            >
              <ActiveProjects />
              <TeamWorkload />
            </section>

            {/* TASKS NEEDING ATTENTION */}
            <section aria-label="Tasks requiring attention">
              <AttentionTasks />
            </section>

            {/* PRODUCTION ALERTS */}
            <section aria-label="Production alerts">
              <ProductionAlert />
            </section>
          </>
        )}

      </div>
    </div>
  );
}

export default Dashboard;