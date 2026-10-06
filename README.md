# HatsOff Internal Tracking System

Internal workspace for managing agency projects, production tasks, teams, employees, clients, timesheets and performance. Sales Tracker is temporarily disabled.

For staff instructions, read the [User Guide](docs/USER_GUIDE.md), also available from Dashboard → User Guide / README. The dated engineering status below is historical.

## Current status — 17 September 2026

The application builds and its existing automated tests pass locally. It is **not yet verified for a complete production staff rollout**. Local browser tests use intercepted Supabase responses; they do not validate real email delivery or live permissions.

| Check | Result |
|---|---|
| Database, permissions, metrics and provisioning unit tests | 59 passed |
| TypeScript compilation | Passed |
| Vite production build | Passed |
| Existing browser suites | All six passed |
| Route-wide browser review | See [test report](docs/test-report-20260917.md) |
| Repository lint | 43 errors and 1 warning remain |
| Live end-to-end staff acceptance | Pending |

## What has been implemented

- Branded landing page, sign-in screen, responsive workspace shell, navigation and light/dark themes.
- Protected application routes; missing/inactive profile handling with retry and sign-out.
- Password-recovery request and reset screen, validation and expired-link feedback.
- Route-level lazy loading and a page error boundary. The reviewed main JavaScript chunk is about 260 KB before compression, with separate page and Supabase chunks.
- Project visibility by account role, team, assignment and explicit sharing; coordinator isolation, assignment provenance and revocation.
- Project filters, details, team mapping, status/hold/archive workflows, metrics and CSV export.
- Tasks, assignment workflows, My Work, planner, timesheets, performance and operational reports.
- Administrator role/team/Sales access management with audit history and concurrent-change checks.
- Sales leads, activities, follow-ups, conversion tracking, targets, charts and separate sales-access permissions.
- In-app project/task/sales notifications and administrator image announcements.
- Versioned SQL feature migrations and embedded PostgreSQL permission tests.

These are implemented capabilities, not a claim that every feature is configured in the live project.

## Pages

| Route | Purpose |
|---|---|
| `/` | Public product landing page |
| `/login` | Sign in and request password recovery |
| `/reset-password` | Set a password from a valid recovery session |
| `/dashboard` | Workspace summary and production dashboard |
| `/teams` | Team directory and management |
| `/employees` | Employee directory and profile linkage |
| `/clients` | Client directory |
| `/projects` | Projects, sharing, assignments and access |
| `/tasks` | Production tasks and status views |
| `/task-assignments` | Employee task assignments |
| `/my-work` | Work assigned to the signed-in employee |
| `/planner` | Planned task schedule |
| `/timesheet` | Time entries |
| `/performance` | Performance records and summaries |
| `/reports` | Operational and project reporting |
| `/sales` | Sales workspace |
| `/settings` | Profile, local preferences and administrator access controls |

The fourteen workspace routes require authentication. Database policies and server-side functions must enforce authorisation independently of visible UI controls.

## Technology and architecture

- React 19, TypeScript, Vite 8, React Router, Tailwind CSS and Lucide icons.
- Supabase Auth for authentication.
- Supabase PostgreSQL, Row Level Security (RLS), RPC functions and triggers for backend behaviour.
- Supabase Realtime where configured; some dashboard widgets also poll.
- PGlite for local PostgreSQL tests and Playwright with Chrome for browser checks.

There is no separate Node application server to deploy. Vite builds static frontend assets. Sensitive operations belong in reviewed database functions or trusted server-side code, never browser code using a service-role key.

## Local setup

Use Node.js 22.12+ or a compatible newer version; this review ran on Node 24.18.0.

```sh
npm ci
```

Copy `.env.example` to `.env`, then fill in the public project configuration:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
VITE_SALES_HARISH_PROFILE_ID=
VITE_SALES_ABINAYA_PROFILE_ID=
```

The two sales IDs must be distinct, verified profile UUIDs. Missing/invalid values intentionally disable the affected reporting configuration. They do not grant database access.

```sh
npm run dev
npm run build
npm run preview
```

On Windows, if the npm PowerShell shim fails, use `npm.cmd`, or invoke the installed tools directly:

```sh
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
```

All `VITE_*` values are bundled into public browser code. Never put database passwords, SMTP credentials or `SUPABASE_SERVICE_ROLE_KEY` there. `.env`, archives, generated builds, local screenshots and private account-review notes are excluded from new commits. Removing previously tracked files does not remove older Git history.

## Database installation and changes

The supplied migrations extend an existing schema. **They are not a complete bootstrap for an empty database.** `supabase/reference/20260905-user-schema.sql` is context-only DDL with incomplete type information, not an installation script.

| Migration | Purpose |
|---|---|
| `202609050001_roles_and_statuses.sql` | Role and project-status enum additions |
| `202609050002_project_access.sql` | Project membership, access policies, activity and notifications |
| `202609050003_sales_tracker.sql` | Sales tables, functions and access rules |
| `202609050004_workspace_updates.sql` | Announcements, task archiving and notifications |
| `202609080005_coordinator_project_access.sql` | Coordinator assignment/access behaviour |
| `202609080006_team_access_admin.sql` | Team boundaries and audited administrator access management |

Before a migration, back up and inspect the target schema using the read-only inspection/preflight scripts. Compare actual definitions with the repository and rehearse in staging. Migration 001 must commit before later migrations use its new enum values. Do not blindly rerun all migrations: the inspected live project already contains feature objects but has no tracked migration history.

A clean backend requires a verified baseline for tables, types, constraints, policies, functions, grants and triggers, followed by tracked migrations. See [project deployment notes](docs/project-access-deployment.md) and [team access notes](docs/admin-team-access.md).

## Accounts and permissions

Auth users, profiles and employee records are distinct. A working employee login needs a valid identity mapping, active status, and the intended team and access grants. Creating an Auth user alone does not complete setup. Roles include administrator, director, associate lead, team lead, project coordinator and employee; Sales also has its own grants.

The agreed onboarding approach is email invitations, with employees choosing their own passwords. Login identifiers do not create actual email inboxes. SMTP and valid recipient mailboxes must be available.

The legacy `scripts/provision-employee-accounts.mjs` is retained for historical reference. It uses a name-based initial-password convention and name-specific role/team rules. **Do not run its `--apply` mode for the current invitation rollout.** The current roster has duplicate first names, so identities must be explicitly verified rather than inferred.

As of the last account operation on 16 September:

- Two requested accounts were created through the invitation flow; two other requested-domain accounts already existed.
- The next invitation failed with HTTP 429 `over_email_send_rate_limit`; remaining invitations were not completed.
- Inbox delivery, password setup, employee linkage and the new administrator's privileges were not verified/completed.
- The requested legacy account deletion was not performed. It was blocked by an `admin_access_history` foreign key and remains pending explicit removal handling. Do not delete audit records or disable constraints as a blanket workaround.

Private account details are kept in local operational notes rather than this README.

## Tests

```sh
npm test
npm run build
npm run lint
```

Browser scripts require Playwright and installed Google Chrome. Make `playwright` available in the Node environment, or set `PLAYWRIGHT_MODULE` to its installed absolute module path. Start the development server at `http://127.0.0.1:5173` and ensure `.env` exists. Several legacy scripts use that fixed origin.

```sh
node tests/ui-smoke.mjs
node tests/sales-ui-smoke.mjs
node tests/admin-access-ui.mjs
node tests/auth-release-ui.mjs
node tests/brand-ui-smoke.mjs
node tests/future-ui-smoke.mjs
node tests/all-routes-ui.mjs
```

Browser HTTP calls outside localhost are intercepted and answered with fixtures. These suites do not create real accounts or mutate production data. Screenshots and execution logs go to ignored `test-artifacts/`. The route sweep covers empty/mock administrator states, not every form/data/role combination. Use the specialised suites for populated project, sales and access workflows.

## Deployment process

1. Reconcile the live schema and establish a tested backup/restore procedure.
2. Prepare staging, configure its environment, and apply only reviewed required migrations.
3. Configure invitations/SMTP, verified identity mappings, roles, teams and sales reporting IDs.
4. Verify all roles with direct authenticated API allow/deny checks and two-session notification/revocation checks.
5. Build with `npm ci` and `npm run build`; publish `dist` using the selected static host.
6. Configure HTTPS, the production domain and SPA fallback to `index.html`. `vercel.json` supplies the Vercel rewrite.
7. Set Supabase Auth Site URL and permitted recovery redirects to the actual deployment.
8. Verify login and recovery from a browser without a hosting-provider session; pilot with staff before general rollout.
9. Keep the previous frontend artifact and environment settings for rollback. For database incidents, use a reviewed forward fix or verified recovery plan.

A push to a repository connected to Vercel may trigger its deployment integration. Git push alone does not prove the deployment succeeded or configure Supabase.

## Remaining production work

The following findings were observed on 16 September and must be rechecked after subsequent changes:

- Free/Nano backend in Tokyo; all 20 public tables had RLS enabled, but full policy correctness was not certified.
- Employee identities/teams and the planned role hierarchy were incomplete.
- Custom SMTP was disabled; invitations later hit the built-in email rate limit.
- The configured production recovery URL redirected unauthenticated visitors to Vercel login.
- Public signup was enabled; decide whether the internal tool should be invite-only.
- Realtime publication included notifications and announcements, but not the task/assignment tables subscribed to by dashboard code.
- No managed project backups on the current Free plan, and no separately verified restore procedure.
- Empty migration history despite installed feature objects.
- 43 lint errors and one warning, mainly React hook patterns, nested component definitions, purity and export/type issues.
- Settings notification switches are browser-local preferences; they are not an implemented email-delivery pipeline.

No live production acceptance, load test, exhaustive security audit or real email-delivery test is claimed by the local test results.

## Repository map

- `src/pages`, `src/components`: screens and reusable UI.
- `src/services`: Supabase data and RPC calls.
- `src/context`, `src/hooks`, `src/types`, `src/lib`: authentication, state, models and calculations.
- `supabase/migrations`: versioned feature changes.
- `supabase/reference`: supplied schema context.
- `tests`: database, metrics and mocked browser checks.
- `scripts`: historical account tooling; review before use.
- `docs`: implementation, deployment and verification records.

For this review's exact coverage and limitations, read [the test report](docs/test-report-20260917.md).

## Project controls FAQ

**Why is the coordinator dropdown empty?** It requires an employee record linked to an active Project Coordinator profile. For non-admin managers the coordinator must also be in the manager's team. Verify Settings → Access Management and Employees linkage; creating an Auth user alone is insufficient. Existing project sharing additionally requires matching project/coordinator teams.

**Why is there no project delete action?** The current Projects screen implements Archive/Restore through its edit workflow, not permanent deletion. Archiving preserves history. Permanent deletion would need an explicit UI/backend workflow with dependency handling; it was not added or executed in this review.
