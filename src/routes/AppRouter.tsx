import {lazy,Suspense} from 'react';
import PageErrorBoundary from '../components/layouts/PageErrorBoundary';
const ResetPassword=lazy(()=>import('../pages/auth/ResetPassword'));
import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "../components/layouts/AppShell";
import ProtectedRoute from "../components/auth/ProtectedRoute";
const Performance=lazy(()=>import('../pages/performance/Performance'));
const Dashboard=lazy(()=>import('../components/dashboard/Dashboard'));
const Planner=lazy(()=>import('../pages/planner/Planner'));
const Projects=lazy(()=>import('../pages/projects/Projects'));
const Tasks=lazy(()=>import('../pages/tasks/Tasks'));
const TaskAssignments=lazy(()=>import('../pages/tasks/TaskAssignments'));
const MyWork=lazy(()=>import('../pages/my-work/MyWork'));
const Landing=lazy(()=>import('../pages/landing/Landing'));
const Login=lazy(()=>import('../pages/auth/Login'));
const Timesheet=lazy(()=>import('../pages/timesheet/Timesheet'));
const Teams=lazy(()=>import('../pages/teams/Teams'));
const Employees=lazy(()=>import('../pages/employees/Employees'));
const Clients=lazy(()=>import('../pages/clients/Clients'));
const Reports=lazy(()=>import('../pages/reports/Reports'));
const Settings=lazy(()=>import('../pages/settings/Settings'));
const SalesWorkspace=lazy(()=>import('../pages/sales/SalesWorkspace'));
function AppRouter() {
  return (
    <PageErrorBoundary><Suspense fallback={<div role="status" className="flex min-h-screen items-center justify-center text-sm">Loading page…</div>}><Routes>
      {/* =================================================
          PUBLIC ROUTES
      ================================================== */}

      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

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
          <Route path="/sales" element={<SalesWorkspace />} />

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
    </Routes></Suspense></PageErrorBoundary>
  );
}

export default AppRouter;
