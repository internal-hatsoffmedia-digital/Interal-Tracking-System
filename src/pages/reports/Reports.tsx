import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Clock3,
  FolderKanban,
  RefreshCw,
  Target,
  Users,
} from "lucide-react";

import ReportHeader from "../../components/reports/ReportHeader";
import {
  PerformanceSpectrum,
  PriorityDistributionCards,
  TaskStatusMeters,
} from "../../components/reports/ReportCharts";
import ReportOverviewKpis from "../../components/reports/ReportOverviewKpis";
import {
  EmployeeTaskTable,
  EmptyReportState,
  ProjectReportTable,
  ReportCard,
  WorkloadTable,
} from "../../components/reports/ReportTables";
import ReportTabNav, { type ReportTab } from "../../components/reports/ReportTabNav";
import { supabase } from "../../lib/supabase";

/* ============================================================
   TYPES
============================================================ */

interface Employee {
  id: string;
  full_name: string | null;
  employee_code: string | null;
  job_title: string | null;
  team_id: string | null;
  is_active: boolean;
}

interface Client {
  id: string;
  name: string;
  short_name: string | null;
  is_active: boolean;
}

interface Project {
  id: string;
  client_id: string;
  name: string;
  series_title: string | null;
  total_assets_required: number;
  completed_assets: number;
  pending_assets: number;
  lead_employee_id: string | null;
  start_date: string | null;
  target_deadline: string | null;
  status: string;
  health: string;
  invoice_status: string;
  is_active: boolean;
}

interface Task {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  planned_date: string | null;
  due_date: string | null;
  estimated_hours: number;
  actual_hours: number;
}

interface Timesheet {
  id: string;
  employee_id: string;
  task_id: string;
  work_date: string;
  total_hours: number;
  performance: string;
}

/* ============================================================
   HELPERS
============================================================ */

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function formatHours(value: number) {
  return Number(value || 0).toFixed(1);
}

function isCompleted(status: string) {
  return [
    "completed",
    "approved_delivered",
    "approved_and_delivered",
    "approved_&_delivered",
    "delivered",
    "closed",
  ].includes(normalize(status));
}

function isDelayed(task: Task) {
  if (!task.due_date || isCompleted(task.status)) {
    return false;
  }
  const due = new Date(task.due_date);
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  return due < new Date();
}

function prettifyStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* ============================================================
   PAGE COMPONENT
============================================================ */

export default function Reports() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ==========================================================
     LOAD DATA FROM SUPABASE
  ========================================================== */

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        employeesRes,
        clientsRes,
        projectsRes,
        tasksRes,
        timesheetsRes,
      ] = await Promise.all([
        supabase
          .from("employees")
          .select("id, full_name, employee_code, job_title, team_id, is_active")
          .eq("is_active", true)
          .order("full_name"),

        supabase
          .from("clients")
          .select("id, name, short_name, is_active")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("projects")
          .select("id, client_id, name, series_title, total_assets_required, completed_assets, pending_assets, lead_employee_id, start_date, target_deadline, status, health, invoice_status, is_active")
          .order("created_at", { ascending: false }),

        supabase
          .from("tasks")
          .select("id, project_id, client_id, title, category, priority, status, planned_date, due_date, estimated_hours, actual_hours")
          .order("created_at", { ascending: false }),

        supabase
          .from("timesheets")
          .select("id, employee_id, task_id, work_date, total_hours, performance")
          .order("work_date", { ascending: false }),
      ]);

      if (employeesRes.error) throw employeesRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (timesheetsRes.error) throw timesheetsRes.error;

      setEmployees((employeesRes.data ?? []) as Employee[]);
      setClients((clientsRes.data ?? []) as Client[]);
      setProjects((projectsRes.data ?? []) as Project[]);
      setTasks((tasksRes.data ?? []) as Task[]);
      setTimesheets((timesheetsRes.data ?? []) as Timesheet[]);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(err instanceof Error ? err.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  /* ==========================================================
     QUICK PRESETS
  ========================================================== */

  const handleQuickPreset = (preset: "all" | "month" | "last30" | "quarter") => {
    const now = new Date();
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    const todayStr = now.toISOString().split("T")[0];
    setEndDate(todayStr);

    if (preset === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
    } else if (preset === "last30") {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past30.toISOString().split("T")[0]);
    } else if (preset === "quarter") {
      const pastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      setStartDate(pastQuarter.toISOString().split("T")[0]);
    }
  };

  /* ==========================================================
     FILTERED DATA
  ========================================================== */

  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((entry) => {
      if (startDate && entry.work_date < startDate) return false;
      if (endDate && entry.work_date > endDate) return false;
      return true;
    });
  }, [endDate, startDate, timesheets]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const date = task.planned_date || task.due_date?.split("T")[0] || "";
      if (startDate && date && date < startDate) return false;
      if (endDate && date && date > endDate) return false;
      return true;
    });
  }, [endDate, startDate, tasks]);

  /* ==========================================================
     METRICS & COMPUTATIONS
  ========================================================== */

  const overviewMetrics = useMemo(() => {
    const completed = filteredTasks.filter((t) => isCompleted(t.status)).length;
    const delayed = filteredTasks.filter((t) => isDelayed(t)).length;
    const totalHours = filteredTimesheets.reduce((sum, e) => sum + Number(e.total_hours || 0), 0);
    const activeProjects = projects.filter((p) => p.is_active).length;
    const completionRate = filteredTasks.length > 0 ? (completed / filteredTasks.length) * 100 : 0;

    return {
      totalTasks: filteredTasks.length,
      completed,
      delayed,
      totalHours,
      activeProjects,
      completionRate,
    };
  }, [filteredTasks, filteredTimesheets, projects]);

  // Task Status Rows
  const taskStatusRows = useMemo(() => {
    const counts = new Map<string, number>();
    filteredTasks.forEach((t) => {
      const status = t.status || "unknown";
      counts.set(status, (counts.get(status) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([status, value]) => ({
        label: prettifyStatus(status),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTasks]);

  // Priority Rows
  const priorityRows = useMemo(() => {
    const map = new Map<string, number>();
    filteredTasks.forEach((t) => {
      const priority = t.priority || "unknown";
      map.set(priority, (map.get(priority) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([priority, count]) => ({ priority, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTasks]);

  // Employee Task Rows
  const employeeTaskRows = useMemo(() => {
    return employees
      .map((employee) => {
        const empTimesheets = filteredTimesheets.filter((e) => e.employee_id === employee.id);
        const taskIds = new Set(empTimesheets.map((e) => e.task_id));
        const empTasks = filteredTasks.filter((t) => taskIds.has(t.id));
        const completed = empTasks.filter((t) => isCompleted(t.status)).length;
        const delayed = empTasks.filter((t) => isDelayed(t)).length;
        const estimated = empTasks.reduce((sum, t) => sum + Number(t.estimated_hours || 0), 0);
        const actual = empTimesheets.reduce((sum, e) => sum + Number(e.total_hours || 0), 0);

        return {
          employee_id: employee.id,
          employee_name: employee.full_name || "Unnamed",
          employee_code: employee.employee_code || "—",
          total_tasks: empTasks.length,
          completed_tasks: completed,
          delayed_tasks: delayed,
          estimated_hours: estimated,
          actual_hours: actual,
          completion_rate: empTasks.length > 0 ? (completed / empTasks.length) * 100 : 0,
        };
      })
      .filter((row) => row.total_tasks > 0)
      .sort((a, b) => b.total_tasks - a.total_tasks);
  }, [employees, filteredTasks, filteredTimesheets]);

  // Hours by Employee
  const employeeHoursRows = useMemo(() => {
    return employees
      .map((emp) => {
        const hours = filteredTimesheets
          .filter((e) => e.employee_id === emp.id)
          .reduce((sum, e) => sum + Number(e.total_hours || 0), 0);
        return {
          employee_id: emp.id,
          employee_name: emp.full_name || "Unnamed",
          employee_code: emp.employee_code || "—",
          hours,
        };
      })
      .filter((r) => r.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [employees, filteredTimesheets]);

  // Hours by Client
  const clientHoursRows = useMemo(() => {
    return clients
      .map((client) => {
        const clientTaskIds = new Set(
          filteredTasks.filter((t) => t.client_id === client.id).map((t) => t.id)
        );
        const hours = filteredTimesheets
          .filter((e) => clientTaskIds.has(e.task_id))
          .reduce((sum, e) => sum + Number(e.total_hours || 0), 0);
        return {
          client_id: client.id,
          client_name: client.name,
          hours,
        };
      })
      .filter((r) => r.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [clients, filteredTasks, filteredTimesheets]);

  // Hours by Project
  const projectHoursRows = useMemo(() => {
    return projects
      .map((project) => {
        const projectTaskIds = new Set(
          filteredTasks.filter((t) => t.project_id === project.id).map((t) => t.id)
        );
        const hours = filteredTimesheets
          .filter((e) => projectTaskIds.has(e.task_id))
          .reduce((sum, e) => sum + Number(e.total_hours || 0), 0);
        return {
          project_id: project.id,
          project_name: project.name,
          hours,
        };
      })
      .filter((r) => r.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [filteredTasks, filteredTimesheets, projects]);

  // Project Report Rows
  const projectReportRows = useMemo(() => {
    return projects
      .filter((p) => p.is_active)
      .map((project) => {
        const total = Number(project.total_assets_required || 0);
        const completed = Number(project.completed_assets || 0);
        const completion = total > 0 ? (completed / total) * 100 : 0;
        const delayed = project.target_deadline
          ? new Date(`${project.target_deadline}T23:59:59`) < new Date() && completion < 100
          : false;
        const hours = projectHoursRows.find((r) => r.project_id === project.id)?.hours || 0;
        const client = clients.find((c) => c.id === project.client_id);

        return {
          ...project,
          clientName: client?.name || "Unknown Client",
          completion,
          delayed,
          hours,
        };
      })
      .sort((a, b) => b.completion - a.completion);
  }, [clients, projectHoursRows, projects]);

  // Performance Summary
  const performanceSummary = useMemo(() => {
    const result = { green: 0, orange: 0, red: 0 };
    employeeTaskRows.forEach((emp) => {
      const delayRate = emp.total_tasks > 0 ? (emp.delayed_tasks / emp.total_tasks) * 100 : 0;
      if (emp.total_tasks === 0) {
        result.orange += 1;
      } else if (emp.completion_rate >= 80 && delayRate <= 10) {
        result.green += 1;
      } else if (emp.completion_rate < 50 || delayRate > 30) {
        result.red += 1;
      } else {
        result.orange += 1;
      }
    });
    return result;
  }, [employeeTaskRows]);

  // Workload Rows
  const workloadRows = useMemo(() => {
    return employees
      .map((employee) => {
        const empTimesheets = filteredTimesheets.filter((e) => e.employee_id === employee.id);
        const taskIds = new Set(empTimesheets.map((e) => e.task_id));
        const activeTasks = filteredTasks.filter((t) => taskIds.has(t.id) && !isCompleted(t.status));
        const allocated = activeTasks.reduce((sum, t) => sum + Number(t.estimated_hours || 0), 0);
        const actual = empTimesheets.reduce((sum, e) => sum + Number(e.total_hours || 0), 0);
        const utilization = (allocated / 40) * 100;

        return {
          employee_id: employee.id,
          employee_name: employee.full_name || "Unnamed",
          employee_code: employee.employee_code || "—",
          active_tasks: activeTasks.length,
          allocated_hours: allocated,
          actual_hours: actual,
          utilization,
        };
      })
      .filter((r) => r.active_tasks > 0 || r.actual_hours > 0)
      .sort((a, b) => b.utilization - a.utilization);
  }, [employees, filteredTasks, filteredTimesheets]);

  return (
    <div className="min-w-0 space-y-6 pb-12">
      {/* HEADER */}
      <ReportHeader
        startDate={startDate}
        endDate={endDate}
        loading={loading}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onQuickPreset={handleQuickPreset}
        onRefresh={() => void loadReports()}
      />

      {/* ERROR ALERT */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* OVERVIEW KPIS */}
      <ReportOverviewKpis metrics={overviewMetrics} />

      {/* TAB NAVIGATION */}
      <ReportTabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* TAB CONTENTS */}
      <div className="space-y-6">
        {/* ======================================================
            TAB 1: EXECUTIVE OVERVIEW
        ====================================================== */}
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Task Status Breakdown */}
            <ReportCard title="Task Velocity & Status" subtitle="Breakdown of tasks across workflow stages" icon={Target}>
              <TaskStatusMeters rows={taskStatusRows} />
            </ReportCard>

            {/* Performance Spectrum */}
            <ReportCard title="Employee Performance Distribution" subtitle="Overall workforce status health" icon={Activity}>
              <PerformanceSpectrum summary={performanceSummary} />
            </ReportCard>

            {/* Priority Distribution */}
            <ReportCard title="Task Priority Breakdown" subtitle="Distribution of tasks by priority level" icon={AlertTriangle}>
              <PriorityDistributionCards rows={priorityRows} />
            </ReportCard>

            {/* Top Projects Progress */}
            <ReportCard title="Active Projects Deliverables" subtitle="Top project asset completion progress" icon={FolderKanban}>
              <ProjectReportTable rows={projectReportRows.slice(0, 5)} />
            </ReportCard>
          </div>
        )}

        {/* ======================================================
            TAB 2: TASK ANALYTICS
        ====================================================== */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <ReportCard title="Task Status Meters" subtitle="Detailed task status metrics" icon={Target}>
                <TaskStatusMeters rows={taskStatusRows} />
              </ReportCard>

              <ReportCard title="Priority Distribution" subtitle="Task priority volume" icon={AlertTriangle}>
                <PriorityDistributionCards rows={priorityRows} />
              </ReportCard>
            </div>

            <ReportCard title="Tasks by Employee" subtitle="Completion metrics and estimated vs actual hours" icon={Users}>
              <EmployeeTaskTable rows={employeeTaskRows} />
            </ReportCard>
          </div>
        )}

        {/* ======================================================
            TAB 3: TIMESHEETS & HOURS
        ====================================================== */}
        {activeTab === "timesheets" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Hours by Employee */}
              <ReportCard title="Hours Logged by Employee" subtitle="Top staff by logged timesheet hours" icon={Users}>
                <div className="space-y-3">
                  {employeeHoursRows.length === 0 ? (
                    <EmptyReportState />
                  ) : (
                    employeeHoursRows.map((r) => (
                      <div key={r.employee_id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                        <div>
                          <p className="font-semibold text-slate-900">{r.employee_name}</p>
                          <p className="text-[10px] text-slate-400">{r.employee_code}</p>
                        </div>
                        <span className="font-bold text-indigo-700">{formatHours(r.hours)}h</span>
                      </div>
                    ))
                  )}
                </div>
              </ReportCard>

              {/* Hours by Client */}
              <ReportCard title="Hours Logged by Client" subtitle="Time distribution per client" icon={Briefcase}>
                <div className="space-y-3">
                  {clientHoursRows.length === 0 ? (
                    <EmptyReportState />
                  ) : (
                    clientHoursRows.map((r) => (
                      <div key={r.client_id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                        <span className="font-semibold text-slate-800">{r.client_name}</span>
                        <span className="font-bold text-slate-900">{formatHours(r.hours)}h</span>
                      </div>
                    ))
                  )}
                </div>
              </ReportCard>

              {/* Hours by Project */}
              <ReportCard title="Hours Logged by Project" subtitle="Time spent across projects" icon={FolderKanban}>
                <div className="space-y-3">
                  {projectHoursRows.length === 0 ? (
                    <EmptyReportState />
                  ) : (
                    projectHoursRows.map((r) => (
                      <div key={r.project_id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                        <span className="font-semibold text-slate-800">{r.project_name}</span>
                        <span className="font-bold text-indigo-700">{formatHours(r.hours)}h</span>
                      </div>
                    ))
                  )}
                </div>
              </ReportCard>
            </div>
          </div>
        )}

        {/* ======================================================
            TAB 4: PROJECT HEALTH
        ====================================================== */}
        {activeTab === "projects" && (
          <ReportCard title="Project Health & Deliverables Progress" subtitle="Asset completion percentage and project status" icon={FolderKanban}>
            <ProjectReportTable rows={projectReportRows} />
          </ReportCard>
        )}

        {/* ======================================================
            TAB 5: PERFORMANCE MATRIX
        ====================================================== */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <ReportCard title="Workforce Health Spectrum" subtitle="Distribution of employee completion & delay metrics" icon={Activity}>
              <PerformanceSpectrum summary={performanceSummary} />
            </ReportCard>

            <ReportCard title="Detailed Employee Performance Table" subtitle="Task throughput, completion rate, and delay rates" icon={Users}>
              <EmployeeTaskTable rows={employeeTaskRows} />
            </ReportCard>
          </div>
        )}

        {/* ======================================================
            TAB 6: TEAM WORKLOAD
        ====================================================== */}
        {activeTab === "workload" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-white p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Workload Capacity Standard (40h Weekly Baseline)</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Workload utilization calculates allocated task hours relative to a 40-hour weekly capacity per employee. Overloaded staff ({">"}100%) are highlighted in red.
                  </p>
                </div>
              </div>
            </div>

            <ReportCard title="Employee Workload & Capacity Utilization" subtitle="Allocated task hours versus actual logged time" icon={Users}>
              <WorkloadTable rows={workloadRows} />
            </ReportCard>
          </div>
        )}
      </div>

      {/* FLOATING LOADING BADGE */}
      {loading && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-xs font-semibold text-slate-800 shadow-xl backdrop-blur-md">
          <RefreshCw size={15} className="animate-spin text-indigo-600" />
          Updating Analytics Engine...
        </div>
      )}
    </div>
  );
}
