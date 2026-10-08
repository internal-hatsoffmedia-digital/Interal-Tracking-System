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
  Palette,
  Copy,
  X,
} from 'lucide-react';
import guide from '../../../docs/USER_GUIDE.md?raw';
import './UserGuide.css';

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
  | 'style_colors'
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
  { id: 'style_colors', label: 'Brand & Style Colors', icon: Palette },
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
  {
    id: 'faq-8',
    question: 'What are the official style colors for the Hatsoff workspace?',
    answer:
      'Internal Force uses a curated high-contrast palette: Primary Yellow (#FFCC00) for primary actions, Deep Yellow Hover (#E6B800) for button hover states, Off-White (#F8F8F6) for the main background canvas, Pure White (#FFFFFF) for cards, Brand Black (#000000) and Charcoal (#111111) for the sidebar, and semantic status colors (Success #16A34A, Error #DC2626, Warning #F59E0B). See the "Brand & Style Colors" tab for live swatches and copyable HEX values.',
    category: 'style_colors',
  },
];

/* =========================================================
   OFFICIAL STYLE COLORS SPECIFICATION
========================================================= */

interface StyleColorItem {
  role: string;
  colorName: string;
  hex: string;
  textDark?: boolean;
  border?: string;
  group: 'Brand & Yellows' | 'Surfaces & Backgrounds' | 'Typography & Borders' | 'Feedback & Status';
  description: string;
  recommendedUse: string;
}

const STYLE_COLORS: StyleColorItem[] = [
  {
    role: 'Brand Black',
    colorName: 'Black',
    hex: '#000000',
    textDark: false,
    group: 'Brand & Yellows',
    description: 'High-contrast base black for brand logos, selected icon badges, and pure black accents.',
    recommendedUse: 'Brand logos, black buttons, active nav text, top-level accents',
  },
  {
    role: 'Primary Yellow',
    colorName: 'Brand Yellow',
    hex: '#FFCC00',
    textDark: true,
    group: 'Brand & Yellows',
    description: 'Signature Hatsoff brand primary color for primary actions, active navigation states, and highlights.',
    recommendedUse: 'Primary buttons, active sidebar pills, brand indicators, focus rings',
  },
  {
    role: 'Yellow Hover',
    colorName: 'Deep Yellow',
    hex: '#E6B800',
    textDark: true,
    group: 'Brand & Yellows',
    description: 'Slightly deeper yellow for hover and active interactive feedback states.',
    recommendedUse: 'Primary button hover (:hover), focus highlights, active tab presses',
  },
  {
    role: 'Light Yellow',
    colorName: 'Soft Yellow',
    hex: '#FFF4BF',
    textDark: true,
    group: 'Brand & Yellows',
    description: 'Soft pastel yellow for badge backgrounds, card highlights, and subtle callouts.',
    recommendedUse: 'Metrics cards, badge tints, selected states, tooltip headers',
  },
  {
    role: 'Pale Yellow BG',
    colorName: 'Cream Yellow',
    hex: '#FFF8EA',
    textDark: true,
    border: '#E5E5E5',
    group: 'Brand & Yellows',
    description: 'Very soft cream yellow background for active table rows and secondary briefing panels.',
    recommendedUse: 'Table row hover/active backgrounds, briefing intro card, subtle alerts',
  },
  {
    role: 'Main Background',
    colorName: 'Off White',
    hex: '#F8F8F6',
    textDark: true,
    border: '#E5E5E5',
    group: 'Surfaces & Backgrounds',
    description: 'Clean, warm off-white canvas for the entire workspace background shell.',
    recommendedUse: 'Main shell background, dashboard canvas, canvas behind cards',
  },
  {
    role: 'White',
    colorName: 'Pure White',
    hex: '#FFFFFF',
    textDark: true,
    border: '#E5E5E5',
    group: 'Surfaces & Backgrounds',
    description: 'Pure white surface for card containers, modals, table bodies, and inputs.',
    recommendedUse: 'Card surfaces, input backgrounds, modal surfaces, popup menus',
  },
  {
    role: 'Dark Background',
    colorName: 'Charcoal',
    hex: '#111111',
    textDark: false,
    group: 'Surfaces & Backgrounds',
    description: 'Charcoal black foundation for the sidebar, dark mode canvas, and footer panels.',
    recommendedUse: 'Desktop sidebar navigation, dark theme canvas, dark card backgrounds',
  },
  {
    role: 'Dark Gray',
    colorName: 'Dark Gray',
    hex: '#1A1A1A',
    textDark: false,
    group: 'Surfaces & Backgrounds',
    description: 'Subtle charcoal gray for dark mode cards, borders, elevated surfaces, and toolbars.',
    recommendedUse: 'Dark mode card surfaces, compact navigation toggles, secondary dark containers',
  },
  {
    role: 'Heading Text',
    colorName: 'Heading Text',
    hex: '#0A0A0A',
    textDark: false,
    group: 'Typography & Borders',
    description: 'High-contrast dark ink for primary titles, section headers, and key table headings.',
    recommendedUse: 'H1–H4 headings, bold titles, critical data numbers, modal headers',
  },
  {
    role: 'Body Text',
    colorName: 'Body Text',
    hex: '#4A4A4A',
    textDark: false,
    group: 'Typography & Borders',
    description: 'Balanced contrast neutral gray for standard body copy, labels, and regular text.',
    recommendedUse: 'Paragraph text, form field labels, list items, description notes',
  },
  {
    role: 'Muted Text',
    colorName: 'Muted Text',
    hex: '#777777',
    textDark: false,
    group: 'Typography & Borders',
    description: 'Subdued gray for secondary metadata, timestamps, placeholders, and helper text.',
    recommendedUse: 'Input placeholders, timestamps, status subtext, disabled hints',
  },
  {
    role: 'Border',
    colorName: 'Border',
    hex: '#E5E5E5',
    textDark: true,
    border: '#D4D4D4',
    group: 'Typography & Borders',
    description: 'Standard container border for cards, table cells, form inputs, and dividers.',
    recommendedUse: 'Card perimeter, table grid lines, input outlines, panel dividers',
  },
  {
    role: 'Light Border',
    colorName: 'Light Border',
    hex: '#F0F0F0',
    textDark: true,
    border: '#E5E5E5',
    group: 'Typography & Borders',
    description: 'Ultra-subtle divider line for nested rows, soft card separators, and hairline borders.',
    recommendedUse: 'Inner list dividers, sub-item boundaries, subtle row separators',
  },
  {
    role: 'Success',
    colorName: 'Green',
    hex: '#16A34A',
    textDark: false,
    group: 'Feedback & Status',
    description: 'Vibrant green for completed tasks, approved timesheets, and on-time delivery credits.',
    recommendedUse: 'Status: Completed, on-time tags, success toasts, verified indicators',
  },
  {
    role: 'Error',
    colorName: 'Red',
    hex: '#DC2626',
    textDark: false,
    group: 'Feedback & Status',
    description: 'Clean red for overdue tasks, delayed delivery penalties, and destructive confirmations.',
    recommendedUse: 'Status: Overdue, late penalties, error toasts, validation alerts',
  },
  {
    role: 'Warning',
    colorName: 'Orange',
    hex: '#F59E0B',
    textDark: false,
    group: 'Feedback & Status',
    description: 'Amber orange for in-progress reviews, pending client actions, and deadline warnings.',
    recommendedUse: 'Status: In Review, on-hold badges, approaching deadline alerts',
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function UserGuide() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>('faq-1');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedTokens, setCopiedTokens] = useState(false);
  const [colorViewMode, setColorViewMode] = useState<'table' | 'cards'>('table');

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

  // Filter Colors
  const filteredColors = useMemo(() => {
    if (!searchQuery) return STYLE_COLORS;
    const q = searchQuery.toLowerCase();
    return STYLE_COLORS.filter(
      (c) =>
        c.role.toLowerCase().includes(q) ||
        c.colorName.toLowerCase().includes(q) ||
        c.hex.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.recommendedUse.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleCopyCssTokens = () => {
    const cssTokens = `:root {\n` +
      STYLE_COLORS.map(
        (c) => `  --${c.role.toLowerCase().replace(/\s+/g, '-')}: ${c.hex}; /* ${c.colorName} */`
      ).join('\n') +
      `\n}`;
    navigator.clipboard.writeText(cssTokens);
    setCopiedTokens(true);
    setTimeout(() => setCopiedTokens(false), 2000);
  };

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  return (
    <div className="user-guide-container">
      {/* ===================================================
          HERO BANNER
      =================================================== */}
      <section className="user-guide-hero">
        <div className="user-guide-hero-glow" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-3">
            <div className="user-guide-hero-badge">
              <Sparkles className="h-3.5 w-3.5 text-[#FFCC00]" />
              <span>HATSOFF INTERNAL FORCE · KNOWLEDGE BASE</span>
            </div>

            <h1 className="user-guide-hero-title">
              Workspace User Guide
            </h1>

            <p className="user-guide-hero-desc">
              A comprehensive handbook explaining daily workflows, role-based visibility, squad assignments, and delivery timing formulas.
            </p>
          </div>

          <div className="user-guide-hero-actions">
            <Link
              to="/dashboard"
              className="user-guide-btn-glass"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={() => window.print()}
              className="user-guide-btn-glass"
            >
              <Printer className="h-4 w-4" />
              <span>Print Guide</span>
            </button>

            <a
              href={`data:text/markdown;charset=utf-8,${encodeURIComponent(guide)}`}
              download="Internal-Force-User-Guide.md"
              className="user-guide-btn-primary"
            >
              <Download className="h-4 w-4" />
              <span>Download Markdown</span>
            </a>
          </div>
        </div>
      </section>

      {/* ===================================================
          SEARCH & CATEGORY NAV
      =================================================== */}
      <section className="space-y-4">
        {/* Search Input */}
        <div className="user-guide-search-wrapper">
          <Search className="user-guide-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, roles, workflows (e.g. 'Associate Lead', 'Timesheet', 'Delay formula', 'Team Work')..."
            className="user-guide-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="user-guide-categories" role="tablist" aria-label="User Guide Topics">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`guide-category-pill ${active ? 'is-active' : ''}`}
                aria-pressed={active}
              >
                <Icon className="h-4 w-4 shrink-0" />
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
            <div className="user-guide-step-card">
              <div>
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
              </div>
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-2.5 text-[11px] text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                💡 <strong>Pro-Tip:</strong> Accepting tasks early flags to your coordinator that you have reviewed the brief.
              </div>
            </div>

            {/* Step 2 */}
            <div className="user-guide-step-card">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFCC00] text-xs font-bold text-black shadow-xs">
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
              </div>
              <div className="user-guide-callout-yellow">
                ⏱️ <strong>Timestamp Rule:</strong> Your completion timestamp is recorded live. Don’t delay clicking Complete!
              </div>
            </div>

            {/* Step 3 */}
            <div className="user-guide-step-card">
              <div>
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
              </div>
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
            <div className="user-guide-formula-box">
              <p className="user-guide-formula-tag">
                The Golden Formula
              </p>
              <p className="user-guide-formula-eq">
                Net Timing = Total Minutes Late — Total Minutes Early
              </p>
              <p className="text-xs leading-5 text-slate-700 dark:text-slate-300">
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
          MODULE 6: BRAND STYLE & COLOR SYSTEM
      =================================================== */}
      {(activeCategory === 'all' || activeCategory === 'style_colors') && (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-400">
                <Palette className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Brand Style & Color Palette
                </h2>
                <p className="text-xs text-slate-500">
                  Official color tokens, hex values, and usage guidelines for Internal Force.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCssTokens}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {copiedTokens ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied :root CSS!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy CSS Tokens</span>
                  </>
                )}
              </button>

              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs dark:border-slate-800 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setColorViewMode('table')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    colorViewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Spec Table
                </button>
                <button
                  type="button"
                  onClick={() => setColorViewMode('cards')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    colorViewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Grid Cards
                </button>
              </div>
            </div>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/50 p-2.5 dark:border-amber-900/30 dark:bg-amber-950/20">
              <span className="h-3.5 w-3.5 rounded-full bg-[#FFCC00] shadow-xs" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200">Signature Yellow</p>
                <p className="font-mono text-[10px] text-amber-700 dark:text-amber-400">#FFCC00</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-900">
              <span className="h-3.5 w-3.5 rounded-full bg-[#000000] border border-slate-300 dark:border-slate-700" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white">Brand Black</p>
                <p className="font-mono text-[10px] text-slate-500">#000000</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-900">
              <span className="h-3.5 w-3.5 rounded-full bg-[#F8F8F6] border border-slate-300 dark:border-slate-700" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white">Main Canvas</p>
                <p className="font-mono text-[10px] text-slate-500">#F8F8F6</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-2.5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
              <span className="h-3.5 w-3.5 rounded-full bg-[#16A34A]" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200">Success Green</p>
                <p className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">#16A34A</p>
              </div>
            </div>
          </div>

          {/* TABLE VIEW: Exactly mirrors the user's uploaded image specification */}
          {colorViewMode === 'table' ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Color</th>
                      <th className="px-5 py-3.5">HEX</th>
                      <th className="px-5 py-3.5">Preview</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredColors.map((color) => {
                      const isCopied = copiedHex === color.hex;
                      return (
                        <tr
                          key={color.role}
                          className="transition hover:bg-[#FFF8EA] dark:hover:bg-slate-800/50"
                        >
                          <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                            {color.role}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                            {color.colorName || '—'}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                              {color.hex}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-6 w-10 rounded-md border shadow-2xs"
                                style={{
                                  backgroundColor: color.hex,
                                  borderColor: color.border || (color.hex === '#FFFFFF' || color.hex === '#F8F8F6' || color.hex === '#FFF8EA' || color.hex === '#FFF4BF' || color.hex === '#F0F0F0' || color.hex === '#E5E5E5' ? '#D4D4D4' : 'transparent'),
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopyHex(color.hex)}
                              title={`Copy ${color.hex}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-semibold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 text-slate-400" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID CARDS VIEW */
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredColors.map((color) => {
                const isCopied = copiedHex === color.hex;
                return (
                  <div
                    key={color.role}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className="h-12 w-12 shrink-0 rounded-xl border shadow-xs transition group-hover:scale-105"
                        style={{
                          backgroundColor: color.hex,
                          borderColor: color.border || (color.hex === '#FFFFFF' || color.hex === '#F8F8F6' || color.hex === '#FFF8EA' || color.hex === '#FFF4BF' || color.hex === '#F0F0F0' || color.hex === '#E5E5E5' ? '#D4D4D4' : 'transparent'),
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                            {color.role}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleCopyHex(color.hex)}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-mono text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            {isCopied ? (
                              <span className="font-semibold text-emerald-600">Copied!</span>
                            ) : (
                              <>
                                <span>{color.hex}</span>
                                <Copy className="h-2.5 w-2.5 text-slate-400" />
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500">
                          {color.colorName || 'Neutral'} · <span className="text-slate-400">{color.group}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] leading-relaxed text-slate-600 dark:border-slate-800/80 dark:text-slate-300">
                      <p>{color.description}</p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        <strong className="text-slate-500 dark:text-slate-400">Usage:</strong> {color.recommendedUse}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ===================================================
          MODULE 7: INTERACTIVE FAQS & TROUBLESHOOTING
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
                    className={`user-guide-faq-item ${isOpen ? 'user-guide-faq-open' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="user-guide-faq-btn"
                    >
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180 text-amber-500' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
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
