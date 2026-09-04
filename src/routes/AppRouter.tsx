import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "../components/layouts/AppShell";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import Performance from "../pages/performance/Performance";
import Dashboard from "../components/dashboard/Dashboard";
import Planner from "../pages/planner/Planner";
import Projects from "../pages/projects/Projects";
import Tasks from "../pages/tasks/Tasks";
import TaskAssignments from "../pages/tasks/TaskAssignments";
import MyWork from "../pages/my-work/MyWork";
import Landing from "../pages/landing/Landing";
import Login from "../pages/auth/Login";
import Timesheet from "../pages/timesheet/Timesheet";
import Teams from "../pages/teams/Teams";
import Employees from "../pages/employees/Employees";
import Clients from "../pages/clients/Clients";
import Reports from "../pages/reports/Reports";
import Settings from "../pages/settings/Settings";
function AppRouter() {
  return (
    <Routes>
      {/* =================================================
          PUBLIC ROUTES
      ================================================== */}

      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />

      {/* =================================================
          PROTECTED APPLICATION
      ================================================== */}

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* =================================================
              DASHBOARD
          ================================================== */}

          <Route path="/dashboard" element={<Dashboard />} />

          {/* =================================================
              TEAMS
          ================================================== */}

          <Route path="/teams" element={<Teams />} />

          {/* =================================================
              EMPLOYEES
          ================================================== */}

          <Route path="/employees" element={<Employees />} />

          {/* =================================================
              CLIENTS
          ================================================== */}

          <Route path="/clients" element={<Clients />} />

          {/* =================================================
              PROJECTS
          ================================================== */}

          <Route path="/projects" element={<Projects />} />

          {/* =================================================
              TASKS
          ================================================== */}

          <Route path="/tasks" element={<Tasks />} />
          <Route path="/my-work" element={<MyWork />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/timesheet" element={<Timesheet />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />

          {/* =================================================
              TASK ASSIGNMENTS
          ================================================== */}

          <Route path="/task-assignments" element={<TaskAssignments />} />
        </Route>
      </Route>

      {/* =================================================
          FALLBACK
      ================================================== */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
