# Project visibility implementation and deployment

## Current delivery state

Application code, versioned migrations, and local PostgreSQL tests are provided. No live database was changed and no deployment was performed. The supplied table DDL is retained in supabase/reference/20260905-user-schema.sql. It omits full live policies, enum labels and functions. Tests use PGlite (real embedded PostgreSQL), including a reconstruction of the supplied DDL. This verifies SQL behavior, not equivalence to the live schema or live API/storage configuration.

## Behavior and decisions

| Role | Project visibility | Project writes |
| --- | --- | --- |
| Administrator | All projects | Create, edit, assign, share, map teams, archive, delete; map account roles |
| Director | All projects | Read only |
| Associate Lead | All projects in their configured team, plus explicit memberships | Create within team, edit visible projects, manage assignments/sharing within team, archive |
| Team Lead | Projects in their team that have been assigned by an Associate Lead, plus explicit memberships | Read only |
| Project Coordinator | Explicit assignments and shares only | Edit accessible project details; cannot assign/share/archive or change roles |
| Employee | Explicit memberships and existing current task assignments | Existing production permissions, intersected with project access |

Muskan maps to `associate_lead`; Kamalesh to `team_lead`; Lavanya and Esther both remain `project_coordinator`; Veena Mam and Sabari Sir map to `director`. Names are guidance only; enforcement uses account UUIDs and trusted database roles. The same team must be configured for Muskan, Kamalesh, and the projects they oversee. Unmapped projects are flagged and remain accessible to administrators/directors and their explicit members.

Associate Lead assignment provenance is sticky: `associate_assigned` remains true after an administrator reassigns the project. This preserves Kamalesh's oversight. `assigned_by`/`assigned_at` describe the most recent actual assignment change. Sharing alone does not create assignment provenance. Removal of an assignee or share removes that access path immediately in the database. Current employee task assignments remain an independent access path; coordinators cannot use this exception.

Only an explicit legacy `lead_employee_id -> employees.profile_id` is backfilled as a project assignee. Team is inferred from that lead's recorded team. Creator, historical assigner, and assignment date are not conflated. A new project created with an initial lead records a real assignment by the current caller. Existing membership timestamps remain null when unknown. Use the assignment panel for future changes; its first matching employee is mirrored to the legacy lead field for older screens.

## Before deployment

1. Back up the live database schema, data, grants, policies, and functions. Preserve the current frontend release. Obtain a staging database or restored snapshot.
2. Run `supabase/preflight.sql` and inspect the results. Verify profile/project role/status types, constraints, UUID foreign keys, source columns, policy recursion, and role lookup functions. Migration 001 supports enum columns; if the live schema uses text CHECK constraints, extend those verified constraints to accept the new role/status values before applying 002. Do not blindly remove constraints.
3. Review exposed SECURITY DEFINER RPCs and views returned by preflight. Revoke or rewrite any that bypass project checks; use `security_invoker = true` for appropriate PostgreSQL 15+ views. Materialized views require separate restricted access. These unknown live objects cannot be audited from the repository.
4. Review project-linked tables. Migration 002 discovers base tables in `public` with `project_id` or `task_id` and adds restrictive parent-access boundaries, including comments/attachments if they use those columns. Tables with other relationship paths need explicit policies before release. Existing restrictive policies may still narrow visibility and need reconciliation on staging.
5. The application currently stores external task footage links and contains no Supabase Storage upload workflow. If the live database uses Storage, inspect bucket/public settings and object paths. Public files and third-party links cannot be secured by project-table RLS. Add bucket/object policies tied to a verified project mapping before treating such attachments as protected.
6. Verify all six account UUIDs and the production team. Keep at least one separate administrator account. No accounts are automatically remapped by name.

## Apply on staging, then verify

1. Apply and **commit** `202609050001_roles_and_statuses.sql` separately. PostgreSQL requires enum values to commit before use.
2. Apply `202609050002_project_access.sql`. It runs atomically and fails on incompatible source columns. It creates membership, activity, and notification tables; replaces project policies; adds related-table boundaries; and guards account identity fields. It preserves existing rows. Run versioned migrations once through migration tracking, not repeatedly as ad-hoc SQL.
3. Deploy the matching application to staging. Use Projects → **Administrator: account roles & teams** to select verified accounts and save the roles/team listed above. Use project details → **Map project team** to resolve missing/incorrect legacy project teams. Review assignments; do not infer who originally assigned historical work.
4. Sign in separately as each role and exercise all scenarios in `tests/database.test.mjs`. Verify direct REST requests, related records, reports/exports, notifications, and any live storage/RPC/view paths. Test a legacy inactive client/employee record and incomplete project. Test multiple pages of projects.
5. Obtain explicit authorization before applying the reviewed migration and frontend release to production. Deploy the database first, then the frontend, during a coordinated release window. Administrators receive a read-only legacy listing when the membership relationship is missing; enhanced controls remain unavailable until migration.

## Local checks

```powershell
node --test tests/*.test.mjs
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
node node_modules/eslint/bin/eslint.js .
```

The system `npm` shim was broken on this workstation; the Node commands above avoid that shim. `C:\Program Files\nodejs\npm.cmd` also works. PGlite is a development-only dependency and never enters the application bundle. Repository-wide lint includes pre-existing issues in older components; report those separately from checks for the new code.

Verified locally on 2026-09-05:

- 35 database/metrics tests passed, including actual PostgreSQL RLS allow/deny checks, reassignment, notifications, account/team mapping, and CSV handling.
- TypeScript and the production Vite build passed. Vite reports the existing large-bundle warning.
- Browser smoke checks passed for Associate Lead, Project Coordinator, and Director controls; filtering, explicit sharing payloads, CSV download, notifications, mobile layout, and refresh after revocation. Screenshots were visually inspected. These tests intercept all Supabase traffic and do not authenticate against the live service.
- New implementation files pass ESLint. Repository-wide lint still reports 43 errors and 1 warning in existing components/services; these are outside this feature's new code.

For browser smoke tests, run the Vite development server, make Playwright available (or set `PLAYWRIGHT_MODULE` to its installed path), then run `node tests/ui-smoke.mjs`. It uses installed headless Chrome. Screenshots are written to the ignored `test-artifacts/` directory. Do not interpret mocked browser tests as live REST authorization verification.

## Dashboard and report definitions

- Totals count each accessible, filtered project once, including archived projects.
- Ongoing/active workload means active and not completed; on-hold projects remain workload.
- Completed means status exactly `completed`, independent of health.
- Overdue means active, not completed, deadline before today's local calendar date.
- Completion rate is completed / total filtered projects; an empty result is 0%.
- Date range filters use UTC project creation dates. Deadline filters include the selected date.
- A multi-assignee project counts once in global totals and once for each assignee's workload.
- Completeness flags name, client ID, current assignee, start date, deadline, status, team, and unknown assignment provenance. These are remediation flags, not destructive rejection of legacy records.
- Project loading is paginated in batches of 500. CSV re-fetches authorized records and re-applies filters before export; cells escape spreadsheet formulas. Older operational reports remain available and their underlying table access is protected by the new policies.

## Notifications

Database triggers create persistent notifications for actual assignment/sharing changes, creation, status/completion, asset progress, and deadline changes. A recipient gets at most one notification per event. The actor is excluded. Eligible members, team leads, associate leads, directors, and administrators receive events only while authorized. Unchanged saves generate no new assignment event. Revoked recipients cannot read old notifications or activity. In-app notifications refresh every minute and on open, and clicking rechecks project access. The panel shows the latest 100 accessible notifications and supports marking them read.

Email delivery is not configured. To add it, use a server-side worker/provider with stored delivery state, retries, deduplication, recipient preference handling, and an authorization recheck before delivery. Existing Settings notification switches do not configure an email provider and are not connected to the new project notification stream.

## Rollback

Migration 002 is transactional: failures roll it back. After a successful deployment, prefer a forward fix. To roll back intentionally, first stop project writes, export new memberships/history/notifications and latest project metadata, restore the verified prior policies/functions/triggers from the schema backup, and release the matching old frontend. Do not drop new tables containing audit data or restore old broad coordinator policies casually. Enum values added in 001 can remain unused; deleting enum labels requires a separately reviewed type migration. Reconcile all writes since backup before any database restore.

Security references: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/guides/api/securing-your-api
