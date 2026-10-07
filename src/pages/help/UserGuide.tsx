import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Download,
  ArrowLeft,
  Search,
  Check,
  CheckCircle2,
  Clock,
  Users,
  Shield,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Calendar,
  Printer,
  CheckSquare,
  Timer,
  UserCheck,
  X,
} from 'lucide-react';
import guide from '../../../docs/USER_GUIDE.md?raw';

/* =========================================================
   TOPIC CATEGORIES
========================================================= */

type CategoryKey =
  | 'all'
  | 'quickstart'
  | 'roles'
  | 'tasks_team'
  | 'execution'
  | 'timing'
  | 'faq';

interface CategoryTab {
  id: CategoryKey;
  label: string;
  icon: typeof BookOpen;
}

const CATEGORIES: CategoryTab[] = [
  { id: 'all', label: 'All Topics', icon: BookOpen },
  { id: 'quickstart', label: 'Quick Start', icon: Zap },
  { id: 'roles', label: 'Roles & Access', icon: Shield },
  { id: 'tasks_team', label: 'Tasks & Team Work', icon: UserCheck },
  { id: 'execution', label: 'My Work & Execution', icon: CheckSquare },
  { id: 'timing', label: 'Delivery & Timing', icon: Clock },
  { id: 'faq', label: 'FAQs & Troubleshooting', icon: HelpCircle },
];

/* =========================================================
   ROLES DATA
========================================================= */

interface RoleInfo {
  role: string;
  badge: string;
  color: string;
  scope: string;
  description: string;
  keyResponsibilities: string[];
}

const ROLES_INFO: RoleInfo[] = [
  {
    role: 'Admin',
    badge: 'Full Ownership',
    color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    scope: 'Organization-wide (all teams, clients, and accounts)',
    description: 'Workspace owner who oversees system configuration, team assignments, verified logins, and database integrity.',
    keyResponsibilities: [
      'Manage employee accounts and authentication linking in Team Members',
      'Assign roles and assign members to specific production squads',
      'Oversee high-level system analytics and project allocations',
    ],
  },
  {
    role: 'Director & Manager',
    badge: 'Operations Leadership',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    scope: 'All production squads and cross-team workflows',
    description: 'Executive management team monitoring company-wide delivery health, team workloads, and project timelines.',
    keyResponsibilities: [
      'Monitor cross-team delivery speeds and monthly delay metrics in Team PC',
      'Inspect project budgets, client health, and executive briefing metrics',
      'Review team capacity across Creative Clan, Cut Masters, and Web squads',
    ],
  },
  {
    role: 'Associate Lead & Team Lead',
    badge: 'Squad Oversight',
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    scope: 'Assigned squad only (Creative Clan, Cut Masters, Web Development, Digital Ninjas)',
    description: 'Production leaders in charge of direct squad output, workload distribution, and task assignment.',
    keyResponsibilities: [
      'Manage tasks in "Team Work" exclusively for their squad members',
      'Assign deliverables directly to team members with clear deadlines',
      'Monitor live assignment statuses: Assigned, In Progress, and Completed',
      'Ensure zero tasks are blocked or overdue within the team',
    ],
  },
  {
    role: 'Project Coordinator (Flow Force)',
    badge: 'Client Coordination',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    scope: 'Coordinated projects and client accounts',
    description: 'The Flow Force squad acts as the bridge between clients and production teams, handling briefs and asset delivery.',
    keyResponsibilities: [
      'Create and update Client and Project profiles with full delivery details',
      'Add initial project tasks and define target completion deadlines',
      'Assign deliverables to relevant production squads',
      'Coordinate revisions between client feedback and team deliverables',
    ],
  },
  {
    role: 'Employee / Specialist',
    badge: 'Production Execution',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    scope: 'Assigned work only',
    description: 'Hands-on creative specialists (video editors, graphic designers, developers, copywriters).',
    keyResponsibilities: [
      'Focus daily work in "My Work" with direct status buttons (Accept, Start, Complete)',
      'Record daily effort hours accurately in the "Timesheet"',
      'Submit finished deliverables on or before the specified deadline time',
    ],
  },
];

/* =========================================================
   FAQ ITEMS
========================================================= */

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do Associate Leads view their team’s work in the sidebar?',
    answer:
      'In the sidebar under "Your workspace", click "Team Work". If your account is registered as an Associate Lead or Team Lead, the system automatically detects your team (e.g., Creative Clan, Cut Masters, Web Development) and filters the table, statistics cards, and worker options strictly to your squad. You will never be distracted by other teams\' assignments.',
    category: 'tasks_team',
  },
  {
    id: 'faq-2',
    question: 'Why is the "Clients" tab hidden for employees in the sidebar?',
    answer:
      'To maintain client privacy and prevent accidental updates, the Clients directory is accessible only to Coordinators, Leads, Managers, and Administrators. Regular production specialists focus on assigned deliverables in "My Work".',
    category: 'roles',
  },
  {
    id: 'faq-3',
    question: 'How is Delivery Delay / Net Timing calculated in Team PC?',
    answer:
      'Net Timing = (Total Minutes Late) minus (Total Minutes Early), calculated per employee per calendar month in Asia/Kolkata (IST). For example, if an editor finishes a task 90 minutes late (+90) and another task 60 minutes early (-60), their net timing is +30 minutes net delay. A negative number indicates you are ahead of schedule!',
    category: 'timing',
  },
  {
    id: 'faq-4',
    question: 'What is the difference between Tasks and Task Assignments?',
    answer:
      'A Task represents "what needs to be created" (e.g., "Reel #04 - Product Launch"). An Assignment represents "who is doing it and by when" (e.g., assigned to Vijay R with a 05:00 PM deadline). One master task can have multiple assignments across specialists.',
    category: 'tasks_team',
  },
  {
    id: 'faq-5',
    question: 'What should I do if my account has "No team assigned"?',
    answer:
      'If you see a notice saying "No team assigned", ask an Administrator to open Studio → Team Members, edit your profile, and select your squad (e.g., Creative Clan, Cut Masters, Flow Force). Once saved, your team workspace will populate immediately upon refresh.',
    category: 'roles',
  },
  {
    id: 'faq-6',
    question: 'How do Timesheet hours differ from Team PC delivery timing?',
    answer:
      'Timesheet measures total effort in hours (e.g., 8 hours logged). Team PC measures punctuality against deadlines (e.g., completed 15 minutes before 5:00 PM). Both are essential: Timesheet shows work capacity, while Team PC ensures client commitments are honored.',
    category: 'timing',
  },
  {
    id: 'faq-7',
    question: 'How do I toggle Dark Mode?',
    answer:
      'In the top navigation bar, click the Sun / Moon icon next to the search and notifications. The entire interface, including all tables and text, adapts instantly.',
    category: 'quickstart',
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function UserGuide() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>('faq-1');

  // Filter FAQs based on category and search query
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Filter Roles
  const filteredRoles = useMemo(() => {
    if (!searchQuery) return ROLES_INFO;
    const q = searchQuery.toLowerCase();
    return ROLES_INFO.filter(
      (r) =>
        r.role.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.scope.toLowerCase().includes(q) ||
        r.keyResponsibilities.some((kr) => kr.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      {/* ===================================================
          HERO BANNER
      =================================================== */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>HATSOFF INTERNAL FORCE · KNOWLEDGE BASE</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Workspace User Guide
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              A comprehensive handbook explaining daily workflows, role-based visibility, squad assignments, and delivery timing formulas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 shadow-sm transition hover:bg-slate-700 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 shadow-sm transition hover:bg-slate-700 hover:text-white"
            >
              <Printer className="h-4 w-4" />
              Print Guide
            </button>

            <a
              href={`data:text/markdown;charset=utf-8,${encodeURIComponent(guide)}`}
              download="Internal-Force-User-Guide.md"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-300"
            >
              <Download className="h-4 w-4" />
              Download Markdown
            </a>
          </div>
        </div>
      </section>

      {/* ===================================================
          SEARCH & CATEGORY NAV
      =================================================== */}
      <section className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, roles, workflows (e.g. 'Associate Lead', 'Timesheet', 'Delay formula', 'Team Work')..."
            className="h-13 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-10 text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-amber-400 dark:text-slate-950'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===================================================
          MODULE 1: 3-STEP DAILY ROUTINE
      =================================================== */}
      {(activeCategory === 'all' || activeCategory === 'quickstart') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Daily Workflow at a Glance
              </h2>
              <p className="text-xs text-slate-500">
                The recommended 3-step operating rhythm for every employee and lead.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  01
                </span>
                <span className="text-xs font-medium text-slate-400">Morning (09:30 AM)</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                Check Dashboard & Assignments
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Review your delivery queue in <strong>My Work</strong> (or <strong>Team Work</strong> for Associate Leads). Acknowledge incoming tasks by clicking <strong>Accept</strong>.
              </p>
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-2.5 text-[11px] text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                💡 <strong>Pro-Tip:</strong> Accepting tasks early flags to your coordinator that you have reviewed the brief.
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                  02
                </span>
                <span className="text-xs font-medium text-slate-400">Production Hours</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                Execute & Update Status
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Click <strong>Start</strong> when beginning work. When the deliverable is uploaded and ready for review, click <strong>Complete</strong> immediately.
              </p>
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-2.5 text-[11px] text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
                ⏱️ <strong>Timestamp Rule:</strong> Your completion timestamp is recorded live. Don’t delay clicking Complete!
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  03
                </span>
                <span className="text-xs font-medium text-slate-400">Wrap-Up (06:30 PM)</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                Log Timesheet & Check Planner
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Open <strong>Timesheet</strong> to log your hours spent per task for the day. Check the <strong>Planner</strong> for tomorrow’s upcoming deliverables.
              </p>
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 text-[11px] text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                ✅ <strong>Zero Missed Days:</strong> Always submit daily timesheets to maintain accurate resource metrics.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          MODULE 2: ROLES & PERMISSIONS
      =================================================== */}
      {(activeCategory === 'all' || activeCategory === 'roles') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400">
              <Shield className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Roles, Teams & Visibility Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Understand your permissions, scope boundaries, and responsibilities.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredRoles.map((r) => (
              <div
                key={r.role}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {r.role}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${r.color}`}
                    >
                      {r.badge}
                    </span>
                  </div>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    <span className="text-slate-400">Scope:</span> {r.scope}
                  </p>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {r.description}
                  </p>

                  <div className="mt-4 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Key Actions:
                    </p>
                    {r.keyResponsibilities.map((resp, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span>{resp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================
          MODULE 3: TASKS VS TEAM WORK (ASSOCIATE LEADS)
      =================================================== */}
      {(activeCategory === 'all' || activeCategory === 'tasks_team') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">
              <UserCheck className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Team Work & Squad Scoping (For Associate Leads)
              </h2>
              <p className="text-xs text-slate-500">
                How Associate Leads monitor, assign, and manage deliverables for their team.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                  <Users className="h-3.5 w-3.5" />
                  Automatic Squad Isolation
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Focused Workspace for Each Associate Lead
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  When an Associate Lead (e.g., Ganesh in <strong>Creative Clan</strong>, Sudeesh in <strong>Cut Masters</strong>, Vijay in <strong>Web Development</strong>, or Janani in <strong>Digital Ninjas</strong>) opens <strong>Team Work</strong>:
                </p>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span><strong>Scoped Assignments:</strong> Only assignments belonging to your team members or assigned by you appear in the table.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span><strong>Worker Dropdown Protection:</strong> When assigning a task, the employee list strictly displays your team members to prevent misallocations.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span><strong>Accurate Squad Stats:</strong> Total Assignments, In Progress, and Employees Working counters calculate strictly for your team.</span>
                  </li>
                </ul>
              </div>

              {/* Side-by-side Task vs Assignment explanation */}
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Understanding: Task vs. Assignment
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="rounded-lg bg-white p-3 shadow-2xs dark:bg-slate-900">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      📁 Master Task (What)
                    </p>
                    <p className="mt-1 text-slate-500">
                      Describes the deliverable details (Client, Project, Title, Script, Footage link, Priority).
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-3 shadow-2xs dark:bg-slate-900">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      👤 Task Assignment (Who & When)
                    </p>
                    <p className="mt-1 text-slate-500">
                      Describes who is executing the work, exact deadline time (e.g. 5:00 PM IST), and submission status.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Lifecycle Pipeline */}
            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Assignment Lifecycle Stages:
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  1. Assigned
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
                  2. Accepted
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  3. In Progress
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  4. Completed
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          MODULE 4: DELIVERY TIMING FORMULA & TEAM PC
      =================================================== */}
      {(activeCategory === 'all' || activeCategory === 'timing') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Delivery Timing Formula & Team PC
              </h2>
              <p className="text-xs text-slate-500">
                How delays, early credits, and monthly punctuality are measured.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            {/* The Formula Card */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/40 dark:bg-amber-950/30">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                The Golden Formula
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">
                Net Timing = Total Minutes Late — Total Minutes Early
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                Calculated per employee per calendar month based on assignment deadlines in <strong>Asia/Kolkata (IST)</strong>.
              </p>
            </div>

            {/* Example Walkthrough */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 dark:border-red-950/50 dark:bg-red-950/20">
                <span className="text-xs font-semibold text-red-700 dark:text-red-400">Scenario A: Late Submission</span>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Deadline: <strong>05:00 PM</strong><br />
                  Submitted: <strong>06:30 PM</strong>
                </p>
                <div className="mt-2 text-sm font-bold text-red-600 dark:text-red-400">+90 min Late</div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-950/50 dark:bg-emerald-950/20">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Scenario B: Early Submission</span>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Deadline: <strong>04:30 PM</strong><br />
                  Submitted: <strong>03:30 PM</strong>
                </p>
                <div className="mt-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">-60 min Early</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Net Month Result</span>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Calculation: <strong>90 - 60</strong>
                </p>
                <div className="mt-2 text-sm font-bold text-amber-600 dark:text-amber-400">+30 min Net Delay</div>
              </div>
            </div>

            {/* Essential Rules */}
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Crucial Punctuality Rules:
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-xs">
                <li>Early completion on one task helps offset late minutes on your other tasks in the <strong>same calendar month</strong>.</li>
                <li>Early minutes <strong>never transfer</strong> to another colleague or roll over to the next month.</li>
                <li>Unfinished or pending work earns zero early credits.</li>
                <li>Always click "Complete" at the exact moment you deliver so your timeliness is faithfully registered.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          MODULE 5: TIMESHEETS & PLANNER
      =================================================== */}
      {(activeCategory === 'all' || activeCategory === 'execution') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Timer className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Timesheet Logging & Planner
              </h2>
              <p className="text-xs text-slate-500">
                Recording daily effort hours and mapping out upcoming deliverables.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Timer className="h-4 w-4 text-emerald-600" />
                Timesheet: Measuring Effort
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                The Timesheet captures the total duration spent on creative tasks (e.g., 2 hours editing, 1.5 hours grading).
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Log hours on the same day they were worked.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Select the specific task for accurate reporting.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Timesheet hours show effort, not delivery speed.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Calendar className="h-4 w-4 text-blue-600" />
                Planner: Looking Ahead
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                The Planner provides a bird’s-eye view of upcoming deliverables, milestone dates, and asset release schedules.
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Spot overlapping deadlines before they create bottlenecks.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Align squad bandwidth with client release commitments.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Alert your Coordinator if raw footage or briefs are missing.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          MODULE 6: INTERACTIVE FAQS & TROUBLESHOOTING
      =================================================== */}
      {(activeCategory === 'all' || activeCategory === 'faq') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-400">
              <HelpCircle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Frequently Asked Questions & Troubleshooting
              </h2>
              <p className="text-xs text-slate-500">
                Quick solutions to common questions and edge cases.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredFaqs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 dark:border-slate-800">
                No FAQs matched your search. Try a different keyword or reset filters.
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="flex w-full items-center justify-between p-4 text-left text-sm font-bold text-slate-900 hover:bg-slate-50/50 dark:text-white dark:hover:bg-slate-800/50"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180 text-amber-500' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 px-4 pb-4 pt-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ===================================================
          FOOTER NOTE
      =================================================== */}
      <footer className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
        <p>
          Need additional assistance? Reach out to your <strong>Flow Force Project Coordinator</strong> or your <strong>System Administrator</strong>.
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Internal Force · Confidential & Proprietary · Hatsoff Media Private Limited
        </p>
      </footer>
    </div>
  );
}
