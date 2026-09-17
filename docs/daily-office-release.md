# Daily office release report — 8 September 2026

## Decision
Local release fixes are complete and the build is available in dist. This is suitable for review; daily office production approval remains blocked by live verification. No production SQL, accounts, access grants or business records were changed during this release pass.

## Changes
- Login now requests recovery email using the existing service, validates the entered email, disables duplicate submissions and displays a generic success message.
- Public /reset-password route checks session availability, handles expired/missing links, validates matching passwords of at least 12 characters, surfaces server policy errors and signs out after successful password update.
- Sales charts and team performance use explicit profile IDs, never display-name matching. Missing, malformed or duplicate IDs disable the chart with a setup message. Existing leads remain accessible. This configuration affects reporting only, not database permissions.
- Added four calculation/configuration tests and a browser recovery regression. Test requests are intercepted; no real recovery emails or password updates were sent.

## Verification
- Existing 55 database/calculation/provisioning tests: passed locally using fixtures and PGlite, including coordinator isolation, production-team boundaries, task archiving, notification recipient restrictions, admin-only announcements and sales write restrictions.
- Four new chart tests: passed (renaming, unrelated matching names, selected member/month, source totals, target arithmetic and missing/invalid configuration).
- TypeScript and production build: passed. Build retains a roughly 1 MB JavaScript chunk warning; code splitting is deferred.
- Targeted lint for all changed release files: passed. Full-repository lint is not clean; see test-artifacts/release-lint-final.txt. Pre-pass count was 44 errors and 1 warning, including a SalesCharts export warning fixed by moving identity logic into library modules.
- Browser suite results are recorded in the completion section below. Mocked tests do not establish real email delivery, realtime delivery or production RLS correctness.

## Required deployment configuration
1. Obtain verified public.profiles.id values for Harish and Abinaya from the administrator. Set VITE_SALES_HARISH_PROFILE_ID and VITE_SALES_ABINAYA_PROFILE_ID in the build environment; both must be distinct UUIDs. Verify against sales_people/account directory and access grants. These IDs are not secrets. Rebuild after setting them; never insert invented IDs.
2. In Supabase Authentication URL Configuration, set Site URL to the real HTTPS production origin and allow the exact https://YOUR-HOST/reset-password redirect. Add http://localhost:5173/reset-password and http://127.0.0.1:5173/reset-password only when development testing requires them. Production URL is still unknown.
3. Verify email provider/SMTP delivery, recovery template link, expiration and password policy. Test a recovery email with an authorised test account. Confirm updated password works and the old password fails. Never share keys or passwords in chat.
4. Configure hosting SPA rewrites to index.html for /reset-password and application routes; test opening an emailed link directly.

## Live database gate
Run supabase/inspect-current-schema.sql and supabase/check-feature-installation.sql as read-only SQL Editor checks. Supply the results before any migration is selected. Compare policy/function definitions, enums, foreign keys, triggers and grants with local migrations 001–006. Do not run the reference schema or rerun all migrations blindly. No corrective SQL is provided until the actual mismatch is known.

Verify auth.users.id → profiles.id → employees.profile_id, profiles/employee team mapping, active flags and sales grants. Use separate coordinator, associate-lead, employee, director and admin sessions for UI and direct authenticated API read/write tests. Include explicit denial tests, not only successful reads. Create clearly prefixed RELEASE-TEST records only after selecting authorised accounts; record their IDs for targeted cleanup. Do not delete business records or bulk truncate tables.

Check an assignment in two real sessions: correct recipient sees one notification, reassignment removes former access, refresh/reconnect preserves the record, and unrelated users cannot fetch it. Check hold/resume/archive, project sharing/revocation and admin-only announcement publishing against live policies.

## Backup and recovery
Before any live migration, verify a usable backup and test restoration into a separate database. Record migration order and deployed build version. Back up Storage objects separately if used. If a frontend release fails, restore the previous built artifact and its environment settings. For a database issue, stop further writes and use a reviewed forward fix or verified restore procedure; do not reverse migrations or restore over production blindly.

## Remaining blockers
Live schema/policy inventory, verified sales profile IDs, production URL/Auth redirects, email delivery, real role accounts, realtime checks and backup/restore evidence are not available in this session. Local tests cannot clear these gates. Account provisioning remains paused as requested earlier.

## Browser completion
All five browser scripts passed: auth-release-ui, sales-ui-smoke, admin-access-ui, ui-smoke (three role scenarios), and brand-ui-smoke. Coverage includes sales create/edit/conversion, activity and targets, viewer restrictions, project filters/details/CSV/revocation, admin access saves, recovery failures/success, theme switching and mobile layouts/navigation. Browser backend responses were mocked throughout.

Final full lint result: 43 errors and 1 warning remain in files outside this release fix set. Targeted release-file lint passed. These are documented maintenance debt, not a claimed clean repository lint run.
