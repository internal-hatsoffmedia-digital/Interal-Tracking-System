# HatsOff Internal — website and assignment audit

**Date:** 22 September 2026. **Reviewed checkout:** `c1060b6`. **Verdict: not ready for an unrestricted staff rollout.**

The frontend compiles, the existing 61 tests pass, and the main screens render. However, targeted tests reproduced project isolation failures, ineffective coordinator access revocation, missing production-lead workload visibility, unsafe employee identity linking, and an assignment edit that silently discards changes. The migration sequence cannot run unchanged against the supplied test baseline.

No application source or migration was changed. No production database, account, invitation, deployment, or real employee assignment was changed. Audit scripts, screenshots, logs, and this report were created locally.

## 1. What was actually checked

### Execution results

| Check | Current result | What it establishes |
|---|---|---|
| `npm test` | **61 passed, 0 failed** | Existing unit/embedded PostgreSQL tests. Database tests cover selected migrations through 007, not the complete current sequence. |
| `npm run build` | **Passed** | TypeScript compilation and production asset generation. |
| `npm run lint` | **Failed: 44 errors, 1 warning** | Current repository quality gate is red. |
| `tests/all-routes-ui.mjs` | **Passed** | Fourteen authenticated routes and three public routes at 1440px and 390px; authenticated states mostly empty/mock admin. Unauthenticated route redirects to login. |
| Audit tablet variant | **Passed** | All seventeen routes at 768px; fourteen protected routes initialized in dark mode. Public context used its default theme. |
| `tests/auth-release-ui.mjs` | **Passed** | Mock recovery request/redirect, invalid credentials/link, password mismatch and password update/sign-out. No real email delivery. |
| `tests/sales-ui-smoke.mjs` | **Passed** | Mock lead creation/edit/conversion, activity, targets, access grants and viewer controls. |
| `tests/admin-access-ui.mjs` | **Passed** | Mock access directory, role/team/Sales save payload, non-admin controls, dark/mobile presentation. |
| `tests/brand-ui-smoke.mjs` | **Passed** | Dashboard navigation, themes and mobile layout. |
| `tests/ui-smoke.mjs` | **Failed** | First role reached the Sales navigation assertion, then timed out because the account's display-name-specific navigation hides Sales. Later roles were not reached in this original run. |
| `tests/future-ui-smoke.mjs` | **Failed** | Immediate post-resize mobile overflow assertion. A targeted check after layout settled measured 390px content at a 390px viewport; a persistent overflow defect was not established. |
| Audit project-only browser variant | **Passed for three roles** | Associate lead, coordinator and director: current UI visibility, filters, details, CSV download, notifications, responsive dialog, simulated data revocation and failed-load/retry states. Expectations were adjusted to current UI; this does not approve the underlying permission changes. |
| Stateful assignment browser audit | **Mixed: two confirmed defects** | Create assignment and dedicated reassignment work across mocked sessions. Edit Task discards assignment changes; team lead lacks New project despite positive management RPC. No page runtime exceptions. |
| Targeted current database audit | **Confirmed blockers** | See findings and role matrix. Runs in memory, with explicitly documented fixture adjustments. |

The existing browser suites intercept external HTTP requests. The new stateful assignment harness also blocks external WebSockets. Browser fixtures emulate backend state and are **not evidence of live RLS enforcement**. Permission findings were separately exercised in PGlite using repository SQL and synthetic users.

### Important database test limitation

Migration 010 fails unchanged with `syntax error at or near "ascending"`. To investigate downstream behavior, the audit replaced **only the in-memory SQL string** `ORDER BY name ascending` with `ORDER BY name asc`. Migration files were untouched. Migration 012 was skipped while building role/identity scenarios, then separately executed only in the synthetic database; it failed on a missing `projects.priority` column. Migration 013 was tested against that isolated fixture.

The reconstructed baseline comes from the repository's reference schema. The fixture includes explicit permissive legacy write policies, as the existing permission tests do. These results reproduce interactions between current functions, triggers and restrictive policies; they do not establish which migrations or legacy policies are installed in production.

## 2. Architecture and workflow map

React Router defines seventeen routes. `ProtectedRoute` checks authentication, an existing profile and active status. `AuthContext` loads the profile from Supabase. Each feature calls Supabase through services or directly from components; there is no separate application server in this repository.

Project access is implemented with `project_members`, RLS, private role/access helpers and `set_project_access`. Project writes generate activity and project notifications. Tasks belong to projects; task assignments link tasks to employees; employees link to authentication profiles. My Work resolves the current employee and loads their assignments plus task/project/client relations. Timesheets and performance records use task/employee relationships. Sales has separate permission grants and RPCs. Administrator access changes have concurrency checks and an audit table.

The frontend refreshes through a combination of focus events, polling and Supabase Realtime subscriptions. The current live publication and delivery behavior were not verified.

The intended main flow is:

`Auth account → active profile → verified employee/team → client/project → coordinator assignment → task → employee assignment → My Work/planner → timesheet → reporting`.

There are overlapping permission implementations: the shared management hook, page-specific role checks, sidebar display-name rules, database manager helpers and restrictive RLS. They currently disagree. Several older services/components coexist with newer workspace screens, and database typings are not generated centrally.

## 3. Assignment tests — practical results

| Scenario | Result |
|---|---|
| Admin opens Assign Task, selects a task and Worker A, saves | **Passed in browser mock.** Correct task ID, employee ID and authenticated assigner ID sent. |
| Worker A opens My Work in a separate session | **Passed in browser mock.** The assigned task appears. |
| Admin changes Assigned To and assignment notes in Edit Task | **Failed.** Only the task PATCH is sent; assignment still belongs to Worker A after reload. |
| Admin changes worker through dedicated Edit Assignment | **Passed in browser mock.** Assignment changes to Worker B. |
| Worker A/B open fresh My Work sessions afterward | **Passed in browser mock.** A sees zero copies; B sees one. |
| Admin inserts a task assignment; assigned employee reads task | **Passed in isolated database.** |
| Production lead reads work assigned to their employee under a coordination-team project | **Failed in isolated database.** Employee sees the task; their lead sees no task/assignment. |
| Coordinator B reads/edits Coordinator A's same-team project without being assigned/shared | **Failed isolation in isolated database.** B can read and update it. |
| Remove Coordinator B's explicit share | **Failed revocation in isolated database.** B still sees the project through the expanded manager helper. |
| Linked employee calls current-employee RPC | **Passed in isolated database.** |
| Missing employee calls self-provision RPC | **Failed in isolated database.** Existing guard raises `Only administrators can map employee accounts`. |
| Fresh account uses an unlinked worker's display name but a different email | **Failed identity isolation in isolated database.** Account claims that employee and can read their assigned task. |

A full real-account client → project → task → timesheet → report journey was not executed against a deployed environment. That remains an acceptance requirement, not a claimed pass.

## 4. Current role/access matrix

This table describes observed behavior in the synthetic scenario after 009–011, with the documented 010 syntax adjustment. Desired permissions must be reconciled with the product owner before changing role policy.

| Role | Observed project access | Assignment/work implications |
|---|---|---|
| Administrator | All fixture projects/tasks; management true | Task assignment works; administrator access RPCs have older passing allow/deny/concurrency tests. |
| Director | All fixture projects/tasks; management true after 009 | UI exposes creation and same-team assignment controls, but `can_manage_project` does not generally authorize a director. Oversight versus management is inconsistent. |
| Coordination associate lead | Same-team projects/tasks; management true | Coordinator assignment UI and payload checks pass. |
| Production associate lead | Management true, but no access to employee's cross-team parent task | 009 makes `coordinator_lead` true, disabling the normal production-team assignment access branch. |
| Team lead | Same regression in the tested production team; management RPC true | Shared React hook excludes all `team_lead` accounts, so New project remains hidden. |
| Project coordinator | All same-team projects/tasks, including another coordinator's | Can edit unassigned project; explicit share revocation does not isolate peers. |
| Employee | Own assigned task and its project context in the fixture | Normal task-based reads work; missing employee recovery and identity linkage have separate defects. |
| Inactive profile | Ordinary role helpers deny normal project access | New current-employee RPC still returns its active employee record; 013 backfill reactivates disabled profiles. |
| Sales viewer/member/manager | Independent Sales grant system | Existing SQL tests pass viewer write-denial, owner/reassignment boundaries and manager targets; current browser suite passes key flows. Live grants not inspected. |

## 5. Confirmed findings and reproducible defects

### F01 — Critical deployment hazard: destructive reset SQL is packaged as a migration

**Evidence:** `supabase/migrations/202609190012_clean_projects_and_fresh_production_setup.sql:5` deletes all rows from timesheets, task assignments, tasks, project activity, notifications, memberships and projects, without identifying test records. Migration 013 also deletes all employees without valid profile links at line 185.

**Expected:** Deploying normal feature changes preserves business records. **Actual:** If the reset migration executes successfully on a compatible database, those datasets are deleted and replaced with name-selected sample production data.

**Reproduction:** Inspect the unconditional DELETE statements; use only a disposable restored database for any execution. The audit did not execute this against production. Its isolated execution failed and rolled back, so this report does not claim production data was deleted.

**Impact:** Potential loss of operational history and employee records during rollout. **Fix:** Remove one-time reset/provisioning operations from the normal upgrade path. Define a reviewed baseline, explicit migration history and a rehearsed recovery plan. Do not simply correct the syntax and apply everything.

### F02 — High: employee identity can be claimed through a matching display name

**Evidence:** migration 010:21–27 links unclaimed employees by email **or full name**; migration 013:12–17 trusts Auth `raw_user_meta_data.full_name` for the profile name. The combined synthetic test created an account with a different email and an existing unlinked worker's name; it inherited that worker's employee row/team and could read their task.

**Expected:** Linking requires a verified identity mapping. **Actual:** A display name can determine ownership of an employee's work.

**Reproduction:** Create an unlinked employee and an assignment in the isolated database; create an Auth row whose metadata uses the same name but a different email; query tasks as the new identity. See `audit-latest-database.json`, “Auth creation claims unlinked employee…”.

**Impact:** Misassigned identities and potential unauthorized work access. External signup exposure depends on live Auth settings and installed migrations, which were not verified. **Fix:** Eliminate name-based identity ownership; use explicit administrator-reviewed IDs or verified invitation mappings. Keep display names editable presentation data.

### F03 — High: coordinator isolation and sharing revocation are broken

**Evidence:** migration 009:7–10 broadens `private.coordinator_lead` to every active coordinator/associate lead/team lead with a team. `private.full_project_access` from 007 then grants all projects in that team. `private.can_manage_project` from 006 grants management through the same helper.

**Reproduction:** Give Coordinator A and B separate projects in one team. Query/update A's project as B; update succeeds. Add then remove B's explicit share; B still reads A's project.

**Expected:** The existing assignment/sharing contract isolates coordinators until explicitly shared. **Actual:** Same-team role access bypasses membership. **Impact:** Confidential project access and editing remain after a user appears revoked. **Fix:** Separate project-creation eligibility from oversight and membership access; regression-test assignment, sharing, reassignment and revocation using all applicable migrations.

### F04 — High: production leads lose visibility of their team's assigned work

**Evidence:** `private.team_task_access` in 007 requires operational leads to satisfy `not private.coordinator_lead(uid)`. Migration 009 makes that false for all active leads with a team.

**Reproduction:** Coordination-team project → task → Production A employee. Employee can read the task; Production A associate lead and team lead return zero tasks/assignments in the same fixture.

**Expected:** Operational leads can see their team's assigned workload across parent projects. **Actual:** Neither the full-project branch nor task-assignment branch authorizes the lead. **Fix:** Restore explicit operational-team and coordination-team distinctions, and test cross-team project/task/employee combinations.

### F05 — High: current migration sequence is not executable against the supplied baseline

**Evidence:** migration 010:11 uses invalid PostgreSQL `ORDER BY name ascending`; unchanged execution fails with SQLSTATE 42601. Migration 012:80 inserts into `projects.priority`, absent from the reference schema and preceding migrations; isolated execution fails with `column "priority" of relation "projects" does not exist`.

**Expected:** A versioned sequence applies to a documented compatible baseline. **Actual:** Two independently reproduced blockers; existing tests do not run those migrations. **Impact:** Incomplete deployments, missing RPCs/triggers and frontend/backend mismatch. **Fix:** Establish the actual baseline, reconcile schema drift read-only, test the full non-destructive sequence in a restored staging database, and put that sequence in CI.

### F06 — High: active-project RPC exposes projects outside normal access

**Evidence:** migration 010:5–11 defines a SECURITY DEFINER function returning `SETOF public.projects`, filtering only `is_active` and caller role. It has no project/team/membership predicate. `getActiveProjects` in `src/services/projects/projects.service.ts` calls it for task forms.

**Reproduction:** Production lead's normal projects query returns zero; the RPC returns all three active fixture projects, including the unrelated confidential project. This reproduction used the explicitly corrected in-memory SQL syntax.

**Expected:** Dropdown options and returned fields honor project access. **Actual:** The function returns full project rows outside that scope. **Fix:** Enforce authorized project selection inside the RPC and return only required option fields. Merely filtering the dropdown in JavaScript does not protect the API.

### F07 — High: Edit Task silently ignores assignee and assignment-note changes

**Evidence:** `src/pages/tasks/Tasks.tsx:572` updates the task and returns before handling `assignedEmployeeId`/`assignmentNotes`. `TaskForm.tsx` exposes both inputs while editing.

**Reproduction:** Tasks → Table → Edit an assigned task → change Assigned To and Assignment Notes → Save Changes → reload. Stateful browser log shows only a `tasks` PATCH. Original employee remains assigned.

**Impact:** Managers believe work was reassigned when it was not. **Fix:** Persist assignment changes in the edit workflow and verify saved backend state, or remove those controls and direct users to the functioning dedicated assignment editor. Preserve unrelated assignment metadata.

### F08 — High: employee recovery conflicts with guards and deactivation handling

**Evidence:** migration 013:149 attempts employee INSERT/upsert from an ordinary authenticated session, while `crm_guard_employee` rejects non-admin inserts. The direct-match RPC branch checks employee activity but not profile activity. Backfill at 013:107 forces existing profiles active.

**Reproduction:** (1) Remove a synthetic employee link and call `get_current_employee_profile`: administrator-only error. (2) Disable a profile while its employee remains active: RPC returns employee data. (3) Run 013 in the isolated fixture with a disabled profile: profile becomes active.

**Expected:** Missing identity mappings fail clearly or are repaired through a narrowly authorized trusted path; disabled users remain disabled. **Impact:** My Work recovery cannot perform its stated task, and account deactivation can be undone by migration. **Fix:** Centralize verified provisioning, preserve active/inactive status, enforce active profile checks and reconcile the trusted path with identity guards.

### F09 — Medium: UI and backend management permissions disagree

**Evidence:** `src/hooks/useProjectManagement.ts:26` always allows directors/coordinators and only conditionally allows associate leads; it never returns true for team leads. `ProjectWorkspace.tsx:153` uses that hook to display same-team assignment controls. Database management uses different rules.

**Reproduction:** Return `can_manage_projects:true` for an active team lead; Projects still has no New project button. Director fixture displays assignment controls although the database's management predicate excludes directors from normal assignment management.

**Impact:** Missing authorized controls and controls that lead to backend denials. **Fix:** Use a single, explicit server capability contract for each action—create, edit, assign, share, archive—rather than one broadly interpreted boolean.

### F10 — Medium: task creation can erase its own assignment-failure message

**Evidence:** `Tasks.tsx:683` catches assignment failure and sets an error, then closes the form and calls `loadData(true)` at the end of the create path. `loadData` begins with `setError("")` at line 233.

**Reproduction:** Source-traced failure path: task INSERT succeeds, assignment INSERT fails, reload succeeds. **Expected:** A persistent partial-success message and a clear retry action. **Actual:** Reload clears the warning; task and assignment are separate writes.

**Impact:** Unassigned tasks can appear successfully completed in the creation flow. **Fix:** Preserve partial-success state and provide assignment retry, or use a properly authorized transactional operation. This path was source-verified, not separately exercised with an injected browser failure.

### F11 — Medium: workload reporting derives assignments from timesheets

**Evidence:** `src/pages/reports/Reports.tsx:593` and `:1125` build employee task IDs from `employeeTimesheets`, not `task_assignments`.

**Reproduction:** Assign a two-hour task to an employee with no time entries. Source calculation produces zero allocated tasks/hours for that employee. The populated browser fixture contains one assigned task but no timesheets; the overview reports zero employees “With tracked work”, which is accurate for that label but cannot establish assigned workload.

**Expected:** Allocated workload reflects assigned work before time is logged. **Actual:** Workload requires existing time entries and can attribute historical work to previous workers. **Fix:** Use assignments for allocated work and timesheets for actual hours, with explicit treatment of reassignment/multiple workers. Clarify whether employee performance is task-based or logged-work-based.

### F12 — Medium: date semantics differ across reports and planner

**Evidence:** `Reports.tsx:227` compares a due-date timestamp with the current instant; `Planner.tsx:319` derives “today” from UTC `toISOString()`. Project metrics correctly use a local calendar-date helper.

**Reproduction:** A date-only deadline of 22 September is marked overdue at noon on 22 September. At 00:30 India time on 22 September, Planner's UTC date is 21 September. See `audit-date-boundaries.json`.

**Impact:** Inconsistent today/overdue counts near day boundaries. **Fix:** Define a business timezone and distinguish date-only deadlines from timed deadlines, then reuse shared calculations.

### F13 — Medium: missing environment settings silently select a built-in backend

**Evidence:** `src/lib/supabase.ts:3–10` has a fixed backend and public anon-key fallback. The later “missing environment” check cannot fire when these fallbacks exist.

**Reproduction:** Build/run without VITE Supabase variables; configuration selects the built-in project instead of failing. Source-verified only; this audit did not connect a misconfigured build to that backend.

**Impact:** A staging/local deployment can target an unintended backend. The public anon key is not itself a service-role secret. **Fix:** Fail closed on missing environment configuration and explicitly identify the target environment during deployment.

### F14 — Medium: notification switches promise behavior they do not configure

**Evidence:** `src/pages/settings/Settings.tsx:622` saves preferences only in browser localStorage. At line 1000 the Email Notifications control promises email delivery. No email preference persistence/delivery pipeline was found connected to these switches.

**Reproduction:** Toggle setting → only browser storage changes. Another browser/account context does not share a server preference.

**Impact:** Users can believe email delivery or notification suppression is configured when it is not. **Fix:** Label local preferences accurately or implement user-scoped persistent preferences and connect each channel to them.

### F15 — Medium: lint quality gate fails

**Evidence:** 44 errors and one warning in `audit-eslint.json`: state-in-effect patterns (29), nested component definitions (8), purity errors (2), export warnings/errors, a constant condition, explicit `any`, and a useless assignment.

**Reproduction:** `npm run lint`. **Impact:** CI cannot be green; some patterns can reset component state or create unnecessary rendering, although lint findings alone do not prove a user-visible runtime failure. **Fix:** Address actual state/lifecycle issues and intentional rule exceptions explicitly; do not disable the entire rule set.

## 6. Potential risks requiring further verification

These are not counted as reproduced production defects.

- **Large datasets:** Most task, assignment, employee, timesheet and reports queries fetch one unpaginated response. Only newer project workspace/Sales services consistently use range-based loops. Totals may truncate at the backend row limit. Test above the configured cap and move aggregates/pagination server-side where appropriate.
- **Concurrent assignment editing:** Updates filter only by assignment ID, without a version/expected-state check. Two managers may overwrite each other. Sales/admin access have better concurrency checks; add an equivalent test for task/project edits.
- **Inline assignment race:** `Tasks.tsx:807` creates a temporary `temp-...` assignment ID instead of using the returned row, then reloads asynchronously. An immediate second action may target that temporary ID. Exercise slow refresh and rapid assign/unassign before calling this confirmed.
- **Assignment relation failures:** `tasks.service.ts` checks client/project query errors but converts assignment/employee query failures into empty relation arrays. A task can appear unassigned when relation loading failed. Inject those failures and verify visible recovery.
- **Multiple assignments/status semantics:** Task cards select a single assignment from a list; assignment status and task status are separate. Define multiple-assignee behavior, completed-task reassignment, timestamp resets and notification duplication before expanding acceptance coverage.
- **Employee-code collision:** Migration 013 uses only six hexadecimal UUID characters for unique employee codes, without retry. A prefix collision can reject provisioning. A collision-specific test remains outstanding.
- **Identity ambiguity:** Frontend My Work fallback also matches email prefixes/display-name substrings and attempts an unawaited mapping update. This can select the wrong visible employee and hide the mapping failure; replace it together with F02/F08.
- **Profile refresh:** Auth profile state updates on authentication events/manual refresh; permission changes in another session can leave stale UI controls. Database enforcement is essential, and every page needs revocation/error behavior tested.
- **Operational configuration:** Current SMTP, signup policy, Auth redirect allowlist, RLS grants/policies, realtime publication, monitoring, backups and restore capability were not inspected live. Older README statements about these are not treated as current facts.

## 7. Route coverage

“Render passed” means the actual local page loaded without detected page exceptions or horizontal document overflow in the sweep. It does not mean every business action passed.

| Route | Render | Additional checks / remaining limit |
|---|---|---|
| `/` | Passed, three widths | Landing screenshot/public navigation; external destinations not exhaustively followed. |
| `/login` | Passed, three widths | Mock invalid login and recovery request; real sign-in/email unverified. |
| `/reset-password` | Passed, three widths | Mock invalid link, mismatch, password update and sign-out. Real invitation acceptance unverified. |
| `/dashboard` | Passed | Light/dark, tabs, phone/tablet; immediate-resize smoke assertion failed once, settled check passed. Populated synthetic task screenshot reviewed. |
| `/teams` | Passed | Empty/mock directory and source reviewed; create/edit/team-lead persistence not exercised live. |
| `/employees` | Passed | Directory rendering; identity/linkage tested separately in isolated SQL. CRUD forms not exhaustively exercised. |
| `/clients` | Passed | Form/service and coordinator field reviewed; full client CRUD persistence unverified. |
| `/projects` | Passed | Three roles, filters, details, CSV download, assignment/share request, failed load/retry and mock refresh revocation. SQL isolation/revocation fails. |
| `/tasks` | Passed | Populated task, edit request and reload; confirmed discarded assignment edits. Creation failure path source-reviewed. |
| `/task-assignments` | Passed | Create/reassign through real controls against stateful mock; correct payloads and cross-session My Work effects. |
| `/my-work` | Passed | Worker A receives, loses task after dedicated reassignment; Worker B receives. Live identity setup unverified. |
| `/planner` | Passed | Planned-date source review; timezone mismatch reproduced with fixed inputs. Drag/reschedule or all scheduling actions not certified. |
| `/timesheet` | Passed | Services/validation/hour calculation read; real create/start/stop/overlap and reporting round trip unverified. |
| `/performance` | Passed | Empty filters/charts and source review; populated score calculation not exhaustively independently certified. |
| `/reports` | Passed | Populated task overview screenshot, query/calculation review and date-boundary check; workload attribution defect identified. |
| `/sales` | Passed | Mock create/edit/convert, activity, targets/access/viewer controls; dedicated metrics/SQL tests passed. Real grants and configured reporting IDs unverified. |
| `/settings` | Passed | Mock admin access mutations, role/team/Sales payload, dark/mobile and non-admin hiding; notification switches source-reviewed. |

Announcements and project/task/Sales notifications have existing SQL coverage and mocked browser coverage. Real two-session realtime delivery and revoked notification caches remain unverified.

## 8. Design, accessibility and reliability review

The rendered pages have a coherent sidebar, clear page headings and consistent form/table surfaces. Phone layouts stack cards and filters without document-level overflow in the main sweep. The project detail dialog uses a portal, focus management, keyboard trapping, Escape handling and focus restoration.

Concrete improvements:

- Task forms and the assignment modal do not consistently use the shared accessible dialog. TaskForm labels generally lack `htmlFor`/wrapping relationships, and TaskAssignmentForm lacks `role="dialog"`/`aria-modal` and a focus trap. Reuse the shared dialog and associate every label. Verify with keyboard and screen-reader testing.
- The dark-mode phone/tablet screenshots show a light top bar with very faint or visually missing navigation/theme icons. Treat this as a visual contrast finding; computed contrast ratios and full accessibility certification were not performed. Use explicit theme-aware header colors and verify all controls remain discoverable.
- Task pages devote substantial phone scroll height to stacked statistics and empty status groups. Collapse empty groups and prioritize the user's work/action area. This is a usability recommendation, not a functional bug.
- Sidebar shows both My Team and Teams pointing to `/teams`; clarify whether those entries serve different needs. Sales visibility also depends on a particular display-name/email match (`Sidebar.tsx:21`), so renamed accounts can change navigation independently of grants. Drive navigation through capabilities.
- Some generic error handling keeps old relation data or hides partial failures. Use clear stale-data/error states and preserve unsaved values when requests fail.

Measured build: main JS **260.49 kB / 82.87 kB gzip**, Supabase chunk **208.91 kB / 54.20 kB gzip**, CSS **114.68 kB / 21.05 kB gzip**. Route-level lazy loading is present. These are build sizes, not Core Web Vitals or network timings.

Multiple dashboard widgets independently query overlapping datasets and subscribe/poll, some every 15 seconds. Services also perform repeated array `find` joins. These are scaling risks; no realistic load test or measured database query plan was run. Consolidate shared dashboard data and measure with representative records before optimizing further.

## 9. Ordered remediation and verification plan

1. **Make the upgrade path safe.** Separate reset scripts from migrations; inventory installed schema/migrations read-only; preserve a backup and verify restore in staging. Resolve baseline and migration syntax/column mismatches without applying destructive scripts.
2. **Fix identity ownership.** Remove display-name/prefix linking, preserve deactivation and implement a guarded provisioning path. Add synthetic tests for duplicate names, mismatched emails, missing profiles, inactive accounts and code collisions.
3. **Unify access rules.** Restore coordinator isolation, production-lead task access and per-project checks in the dropdown RPC. Decide director and team-lead capabilities explicitly. Run the full latest SQL matrix, including direct API denials and share/reassignment revocation.
4. **Fix assignment persistence.** Correct Edit Task, preserve assignment failure feedback, retain actual returned assignment IDs and test concurrency. Verify create → employee receipt → reassignment → old employee revocation → completion/notifications.
5. **Correct reporting and dates.** Base allocated workload on assignments, actual hours on timesheets, and date-only rules on the business calendar. Test archived records, multiple assignments, zero targets and cross-midnight work.
6. **Finish reliability/accessibility.** Fix critical lint issues, consistent dialog/label behavior, header contrast, accurate notification settings, configuration fail-closed behavior and paginated data loading.
7. **Run staging acceptance with real role accounts.** Create synthetic client/project/task, exercise every role and cross-team case, log time, verify reports/exports, refresh two sessions, test recovery email, observe notifications, archive/restore and confirm no unauthorized API access.
8. **Approve rollout only after operational checks.** Verify HTTPS/deep links, real domain/Auth redirects, monitoring, backup/restore, rollback and dependency review; pilot with a small staff group.

## 10. Access and requirements still needed for production certification

- Verified staging/deployed URL and read-only access to actual schema, grants/policies, migration history and Auth configuration.
- Dedicated synthetic accounts for every role and separate Sales levels; no real employee passwords needed.
- An agreed permission matrix, especially director editing, coordination versus production leads, and coordinator peer visibility.
- A staging mailbox/SMTP path for invitation delivery and recovery acceptance.
- Representative, anonymized data volumes and a documented business timezone/status lifecycle.
- A safe staging environment for end-to-end writes, realtime delivery, concurrency, load and restore exercises.

The local audit is complete within those access limits. It is not a production security certification or a claim that every form/data/role combination has been exercised.

## Evidence and reproduction files

All paths below are relative to the repository. `test-artifacts/` is ignored by Git, so retain/copy it if sharing the audit elsewhere.

- `test-artifacts/audit-latest-database.mjs` and `.json`: current SQL repro cases and results; includes all fixture adjustments.
- `test-artifacts/audit-assignment-browser.mjs` and `.json`: stateful intercepted assignment workflow and confirmed edit/hook defects.
- `test-artifacts/audit-project-current-ui.mjs` and `.log`: project-only adaptation of existing browser suite. Sales section omitted; current UI role visibility expectations updated; no production change.
- `test-artifacts/audit-routes.log`, `audit-tablet-dark.log`: route coverage. Tablet script retains original generic success wording; the logged width is authoritative (768px).
- `test-artifacts/audit-auth-release-ui.log`, `audit-sales-ui-smoke.log`, `audit-admin-access-ui.log`, `audit-brand-ui-smoke.log`, `audit-future-ui-smoke.log`, `audit-project-browser.log`: original suite outcomes, including failures.
- `test-artifacts/audit-eslint.json`, `audit-date-boundaries.json`: lint and deterministic date checks.
- `test-artifacts/audit-assignment-created.png`, `audit-worker-my-work.png`, `audit-task-after-edit.png`, `audit-populated-reports.png`, `audit-dashboard-dark-mobile.png`: populated synthetic workflow screenshots.
- `test-artifacts/route-*-390.png`, `route-*-768.png`, `route-*-1440.png`: route screenshots.

To reproduce the added browser harness, set `PLAYWRIGHT_MODULE` to an installed Playwright module, start Vite at `http://127.0.0.1:5173`, then run `node test-artifacts/audit-assignment-browser.mjs`. Run `node test-artifacts/audit-latest-database.mjs` for the in-memory SQL audit. These audit harnesses record failed scenarios in JSON; read those results rather than interpreting process exit 0 as an all-pass verdict.
