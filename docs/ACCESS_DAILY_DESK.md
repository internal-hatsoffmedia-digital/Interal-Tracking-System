# Access and Daily Desk update

Migration: `202610130005_page_access_daily_desk.sql`. Applied live on 13 October 2026 after explicit approval.

Leadership (Admin, Manager, Director) can manage navigation rules for verified profiles through an authenticated, role-gated RPC. Others can read only their own page rules and receive no management roster. Existing data/role policies remain authoritative: showing a page does not expand its records or mutation privileges. Hidden pages are removed from navigation and blocked by the application route guard. Access administration cannot be disabled through its own controls.

Private dated Daily Desk entries use owner RLS for select/insert/update/delete. Administrators do not receive another person's notes. New reference-inspired lavender, peach and neutral surfaces are applied to the workspace shell, dashboard cards and new pages, with responsive forms and dark-theme contrast.

Prepared separate one-time work reset deletes tasks/projects and linked assignments, timesheets, task performance records, work timers and project activity; clients, accounts and teams remain. Executed after explicit permanent-deletion confirmation. Verified zero projects, tasks, assignments, linked timesheets and project activity; retained 21 clients and 25 profiles.

Validation: new database test passes (leadership write gate, staff denial, own-rule isolation, malformed-rule validation, private notes/checklist ownership and cross-user read/write denial). TypeScript and production build pass. All 132 tests passed with two test processes. New-page lint and TypeScript passed; production build passed. The initial unconstrained run hit a Node memory limit and was rerun with bounded concurrency.


Live UI verification: Admin Access page lists all 25 members and opens Snega’s full page-rule editor. Daily Desk loads private dated entries with no API error. Screenshots saved in test-artifacts/access-live.png and daily-desk-live.png. No member rules changed during browser inspection. Frontend changes remain local, not pushed to GitHub.
