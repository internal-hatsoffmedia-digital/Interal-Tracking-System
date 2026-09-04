import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Layers3,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: ClipboardList,
    title: "Task Management",
    description:
      "Create, assign, prioritize and track every production task from one workspace.",
  },
  {
    icon: CalendarDays,
    title: "Production Planner",
    description:
      "Plan upcoming work, deadlines, resources and deliverables before execution begins.",
  },
  {
    icon: Clock3,
    title: "Time Tracking",
    description:
      "Track working hours, execution time, delays and production effort accurately.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Give every team visibility into assigned work, progress and responsibilities.",
  },
  {
    icon: BarChart3,
    title: "Performance Insights",
    description:
      "Understand workload, productivity, bottlenecks and project health.",
  },
];

const workflow = [
  {
    number: "01",
    title: "Plan",
    description: "Define projects, deliverables, deadlines and production requirements.",
  },
  {
    number: "02",
    title: "Assign",
    description: "Authorized coordinators allocate work to the right internal team.",
  },
  {
    number: "03",
    title: "Execute",
    description: "Artists work from their assigned queue and update progress.",
  },
  {
    number: "04",
    title: "Review",
    description: "Work moves through internal review, corrections and client review.",
  },
  {
    number: "05",
    title: "Deliver",
    description: "Approved work is completed, delivered and recorded.",
  },
  {
    number: "06",
    title: "Measure",
    description: "Production data becomes performance and operational insight.",
  },
];

const roles = [
  {
    title: "Admin",
    description: "Full operational visibility and system control.",
  },
  {
    title: "Project Coordinator",
    description: "Plan production and assign tasks across teams.",
  },
  {
    title: "Team Lead",
    description: "Monitor team execution and production progress.",
  },
  {
    title: "Employee",
    description: "View assigned work, execute tasks and log time.",
  },
];

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="group">
            <div className="text-lg font-bold tracking-tight">
              HATSOFF
            </div>

            <div className="text-[9px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Internal Force
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              How It Works
            </a>

            <a
              href="#teams"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              For Teams
            </a>

            <a
              href="#security"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Security
            </a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Log in
            </Link>

            <a
              href="#access"
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              Request Access
            </a>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-6 py-5 lg:hidden">
            <nav className="flex flex-col gap-4">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-700"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-700"
              >
                How It Works
              </a>

              <a
                href="#teams"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-700"
              >
                For Teams
              </a>

              <a
                href="#security"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-700"
              >
                Security
              </a>

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <Link
                  to="/login"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium"
                >
                  Log in
                </Link>

                <a
                  href="#access"
                  className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-center text-sm font-medium text-white"
                >
                  Request Access
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <main>
        <section className="relative overflow-hidden border-b border-slate-100">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_35%,rgba(59,130,246,0.10),transparent_35%)]" />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-28">
            {/* Hero Copy */}
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Built for Production Teams
              </div>

              <h1 className="max-w-2xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[68px]">
                Manage.
                <br />
                Produce.
                <br />
                <span className="text-blue-600">
                  Deliver Excellence.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
                Hatsoff Internal Force is the internal management
                system for production teams to plan projects, assign
                work, track execution and measure performance — all
                in one place.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#access"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Request Access
                  <ArrowRight size={16} />
                </a>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  See How It Works
                  <ChevronRight size={16} />
                </a>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-3">
                <div>
                  <ShieldCheck size={20} className="text-blue-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Secure
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Role-based access
                  </p>
                </div>

                <div>
                  <Zap size={20} className="text-blue-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Fast
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Built for production
                  </p>
                </div>

                <div>
                  <Users size={20} className="text-blue-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Connected
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    One team workspace
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[40px] bg-blue-100/40 blur-3xl" />

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                {/* Preview topbar */}
                <div className="flex h-12 items-center justify-between border-b border-slate-100 px-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  </div>

                  <div className="h-6 w-32 rounded-md bg-slate-50" />

                  <div className="h-7 w-7 rounded-full bg-slate-900" />
                </div>

                <div className="grid min-h-[440px] grid-cols-[125px_1fr]">
                  {/* Preview sidebar */}
                  <div className="border-r border-slate-100 bg-white p-3">
                    <div className="mb-6">
                      <p className="text-[9px] font-bold text-slate-900">
                        HATSOFF
                      </p>
                      <p className="text-[6px] tracking-[0.2em] text-slate-400">
                        INTERNAL FORCE
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      {[
                        "Dashboard",
                        "My Work",
                        "Tasks",
                        "Planner",
                        "Timesheet",
                        "Projects",
                        "Teams",
                        "Employees",
                      ].map((item, index) => (
                        <div
                          key={item}
                          className={`rounded-md px-2 py-1.5 text-[8px] font-medium ${
                            index === 0
                              ? "bg-slate-950 text-white"
                              : "text-slate-500"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview dashboard */}
                  <div className="bg-slate-50 p-4 sm:p-5">
                    <div className="mb-5">
                      <p className="text-[8px] text-slate-400">
                        Workspace / Dashboard
                      </p>

                      <p className="mt-1 text-base font-semibold text-slate-900">
                        Production Overview
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {[
                        ["24", "Tasks"],
                        ["08", "In Progress"],
                        ["05", "Review"],
                        ["05", "At Risk"],
                      ].map(([value, label]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-slate-200 bg-white p-3"
                        >
                          <p className="text-base font-semibold text-slate-950">
                            {value}
                          </p>
                          <p className="mt-1 text-[8px] text-slate-400">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-semibold text-slate-900">
                          Today&apos;s Production
                        </p>

                        <div className="mt-5 space-y-4">
                          {[75, 48, 32, 68].map((width, index) => (
                            <div key={index}>
                              <div className="mb-1.5 flex justify-between">
                                <span className="text-[8px] text-slate-500">
                                  {
                                    [
                                      "In Progress",
                                      "Internal Review",
                                      "Client Review",
                                      "Completed",
                                    ][index]
                                  }
                                </span>

                                <span className="text-[8px] font-semibold">
                                  {[8, 5, 3, 8][index]}
                                </span>
                              </div>

                              <div className="h-1.5 rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-slate-900"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-semibold text-slate-900">
                          Project Health
                        </p>

                        <div className="mt-5 space-y-4">
                          {[
                            ["On Track", "12", "bg-emerald-500"],
                            ["At Risk", "4", "bg-amber-500"],
                            ["Delayed", "2", "bg-red-500"],
                          ].map(([label, value, dot]) => (
                            <div
                              key={label}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${dot}`}
                                />
                                <span className="text-[8px] text-slate-500">
                                  {label}
                                </span>
                              </div>

                              <span className="text-[8px] font-semibold">
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-[10px] font-semibold text-slate-900">
                        Tasks Requiring Attention
                      </p>

                      <div className="mt-4 space-y-2.5">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3"
                          >
                            <div className="h-5 w-5 rounded-full bg-slate-100" />

                            <div className="h-2 flex-1 rounded-full bg-slate-100" />

                            <div className="h-2 w-10 rounded-full bg-slate-100" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 left-5 hidden rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <CheckCircle2
                      size={16}
                      className="text-emerald-600"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Production on track
                    </p>

                    <p className="text-[10px] text-slate-400">
                      Real-time operational visibility
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Powerful Features
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Everything production needs in one place.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600">
                Replace disconnected spreadsheets, scattered messages and
                unclear ownership with one operational workspace.
              </p>
            </div>

            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-5">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="bg-white p-7 transition hover:bg-slate-50"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon size={20} />
                    </div>

                    <h3 className="mt-6 text-sm font-semibold text-slate-950">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-xs leading-6 text-slate-500">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-y border-slate-100 bg-slate-50"
        >
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                How It Works
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                From planning to delivery, without the chaos.
              </h2>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {workflow.map((item) => (
                <div
                  key={item.number}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <span className="text-xs font-bold text-blue-600">
                    {item.number}
                  </span>

                  <h3 className="mt-5 text-lg font-semibold text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Teams */}
        <section id="teams" className="scroll-mt-20">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  Built Around Your Organization
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Everyone knows what they own.
                </h2>

                <p className="mt-5 text-base leading-7 text-slate-600">
                  Internal Force gives every role the right level of
                  visibility and control. Work flows through the organization
                  without giving everyone unnecessary permissions.
                </p>

                <div className="mt-7 flex items-center gap-3 text-sm font-medium text-slate-700">
                  <LockKeyhole size={17} className="text-blue-600" />
                  Role-based task assignment
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {roles.map((role) => (
                  <div
                    key={role.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                      {role.title.charAt(0)}
                    </div>

                    <h3 className="mt-5 font-semibold text-slate-950">
                      {role.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section
          id="security"
          className="scroll-mt-20 border-y border-slate-100 bg-slate-950 text-white"
        >
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck size={23} />
                </div>

                <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Built with control and security in mind.
                </h2>

                <p className="mt-5 leading-7 text-slate-400">
                  Internal operational data should stay internal. Access,
                  permissions and task assignment are designed around
                  organizational roles.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Role-Based Access",
                  "Protected Workspaces",
                  "Secure Authentication",
                  "Controlled Assignment",
                  "Database Permissions",
                  "Activity Tracking",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <CheckCircle2
                      size={17}
                      className="shrink-0 text-blue-400"
                    />

                    <span className="text-sm font-medium text-slate-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="access" className="scroll-mt-20">
          <div className="mx-auto max-w-5xl px-6 py-24 text-center lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-16 sm:px-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Layers3 size={21} />
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Bring production under control.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
                One workspace for planning, execution, collaboration,
                time tracking and performance.
              </p>

              <button className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                Request Internal Access
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <div className="text-sm font-bold text-slate-950">
              HATSOFF
            </div>

            <div className="text-[8px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Internal Force
            </div>
          </div>

          <div className="flex flex-wrap gap-5 text-xs text-slate-500">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>

            <a href="#how-it-works" className="hover:text-slate-900">
              How It Works
            </a>

            <a href="#security" className="hover:text-slate-900">
              Security
            </a>

            <Link to="/login" className="hover:text-slate-900">
              Login
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Hatsoff Media
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;