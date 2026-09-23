# Website testing and UI review — 23 September 2026

Status: local checks passed for the flows below; live end-to-end sign-off is blocked. No live user was created during this review. Browser fixtures are not evidence that deployed database policies or Edge Functions work.

## Results

| Check | Result | Environment |
|---|---|---|
| Automated application/database tests | 68 passed | Local fixtures/PGlite |
| TypeScript and production build | Passed after fixes | Local |
| 14 protected routes, landing/login/reset | No page overflow or runtime errors at desktop/mobile widths | Browser with intercepted backend; mostly empty data |
| Coordinator creates project, saves client/creator/team/assets, reloads | Passed | Stateful intercepted backend |
| Associate lead/coordinator/director project controls, sharing, filters, notifications, CSV, mobile dialogs, refreshed revocation | Passed | Stateful intercepted backend |
| Existing Authentication account becomes named employee, new team created, membership saved, roster survives reload | Passed | Stateful intercepted backend |
| Task assignment, edit assignee and notes, new assignee receipt, previous assignee removal | Passed across browser sessions | Stateful intercepted backend |
| Authorized team lead sees New project | Passed | Browser permission RPC fixture |
| Password recovery, invalid-login feedback and admin access controls | Passed | Intercepted backend |
| Live Muskan/Vijay login | Failed: Invalid login credentials | Configured Supabase project |
| New live Authentication user creation, real team visibility and worker start/end timestamps | Blocked/unverified | Needs valid admin login and designated test email |

## Fixes made during this review

- Edit Task now saves the chosen assignee and assignment notes, then refreshes data.
- Removed direct browser signup fallback from admin provisioning: an Edge Function failure must not replace the administrator's session or silently leave a partially provisioned employee.
- Honor the existing management RPC for team leads in the project UI.
- Removed duplicate project description, series title and production-progress fields.
- Improved mobile team-assignment layout and light-theme project/detail contrast; visually inspected updated screenshots.
- Removed unused project imports blocking compilation.
- Added reusable browser regression scripts: tests/admin-team-flow-ui.mjs, tests/project-workflow-ui.mjs, tests/assignment-workflow-ui.mjs. They intercept backend traffic; they do not create live accounts.

## Remaining release checks

1. Provide a current administrator login and a designated test email. Create the test account via the deployed admin function, name the employee, assign its team, and verify login without changing the administrator session.
2. Repeat coordinator project/task assignment with real role sessions; verify teammates, restricted cross-team access, assignment actor/time, work start/end time and elapsed hours after reload.
3. Confirm required migrations and create-team-member Edge Function are installed in the same Supabase project used by Vercel. Redeploying Vercel alone does not install them. Follow docs/deploy-team-administration.md; do not run the destructive reset migration.
4. Review migration 202609230017 before applying it: it links and merges employees using partial emails/names (including four-character stems and name aliases), then transfers assignments/deactivates rows. Similar names are not proof of account ownership. This review did not apply it or validate safe handling of collisions. Use explicit verified account-to-employee mapping before production sign-off.
5. Project creation currently offers broadly inferred coordinator candidates; test server rejection of unauthorized/cross-team selections. The local browser fixture does not validate these database constraints.

Changes remain local for review. Screenshots and detailed browser JSON are under ignored test-artifacts/. Overall office-readiness is not yet certified.
