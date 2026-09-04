import ActiveProjects from "../../components/dashboard/ActiveProjects";
import AttentionTasks from "../../components/dashboard/AttentionTasks";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import ProductionAlert from "../../components/dashboard/ProductionAlert";
import ProductionOverview from "../../components/dashboard/ProductionOverview";
import ProjectHealth from "../../components/dashboard/ProjectHealth";
import StatsCards from "../../components/dashboard/StatsCards";
import TeamWorkload from "../../components/dashboard/TeamWorkload";

function Dashboard() {
  return (
    <div className="min-h-full w-full">
      <div className="space-y-6">

        {/* ==================================================
            DASHBOARD HEADER
        ================================================== */}

        <DashboardHeader />

        {/* ==================================================
            KPI / SUMMARY CARDS
        ================================================== */}

        <section aria-label="Dashboard summary">
          <StatsCards />
        </section>

        {/* ==================================================
            PRODUCTION OVERVIEW
        ================================================== */}

        <section
          aria-label="Production overview"
          className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]"
        >
          <ProductionOverview />

          <ProjectHealth />
        </section>

        {/* ==================================================
            ACTIVE PROJECTS + TEAM WORKLOAD
        ================================================== */}

        <section
          aria-label="Projects and team workload"
          className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]"
        >
          <ActiveProjects />

          <TeamWorkload />
        </section>

        {/* ==================================================
            TASKS NEEDING ATTENTION
        ================================================== */}

        <section aria-label="Tasks requiring attention">
          <AttentionTasks />
        </section>

        {/* ==================================================
            PRODUCTION ALERTS
        ================================================== */}

        <section aria-label="Production alerts">
          <ProductionAlert />
        </section>

      </div>
    </div>
  );
}

export default Dashboard;