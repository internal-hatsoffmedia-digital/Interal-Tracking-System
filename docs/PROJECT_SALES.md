# Project sales and costs

Projects have one fixed ID and one base rate in INR. A project rate contributes to Sales only after the coordinator marks the project Completed; no lead conversion or duplicate sales entry is needed. Tasks that continue the next day remain under that project and do not add another base rate.

## Add charges and expenses

Open Projects → Project charges & costs. Select an authorized project, enter a service name and amount, then choose:

- **Client charge:** adds to completed-project sales, in addition to the project's base rate.
- **Company expense:** subtracts from the expected net amount.

Choose One time and its booking month, or Monthly with a starting month and optional ending month. Both ends are inclusive. An open-ended monthly entry continues until you set an end month. For example, Shoot Actuals ₹7,000 can be a company expense; Social Media ₹10,000/month can be a client charge. Classify each according to the agreement.

Enter only additional amounts here. If ₹10,000 is already the base project rate, adding it again as a client charge would double count it. Add notes where useful. Entries record the creator and creation time; editing checks for conflicting changes. Sales viewers cannot edit project finance entries.

## Sales dashboard

Filter by reporting month, team, client or project. The page shows completed sales, entered company expenses and net after those expenses. It includes client revenue bars, a six-month revenue/expense chart, client totals, project rates and itemized entries. Click a client bar to filter that client. CSV export uses the selected filters and fetches current authorized data first.

The base rate counts once in the project's completion month, using IST. Additional client charges wait until project completion; one-time charges use the later of booking and completion month, while monthly charges start no earlier than completion and respect their end month. Expenses use their entered periods. A project's task count, repeated assignment or missed deadline never multiplies revenue. Missing rates are flagged, rather than presented as confirmed zero-rate projects. Amounts are expected/entered values, not payment receipts, tax totals or audited profit.

## Access and deployment

Apply the finance migrations through `202610120006_completed_project_sales.sql`. See `SALES_ACCESS.md` for the latest leadership-only access policy and `COMPLETION_SALES_AND_PLANNER.md` for the recognition and carry-forward rules. Original migration background: The finance read RPC exposes financial summaries to active accounts with existing Sales access and Admin/Manager/Director. Coordinators and leads see the projects already authorized to them by existing project rules. Only existing authorized project editors can add or edit charges/expenses. General employees without Sales access cannot open finance data. No person is granted a new Sales role by this migration. The new table has RLS enabled and no direct anonymous/authenticated read/write grants; access is through checked RPCs.

Timesheet is removed from the sidebar; its underlying route and timing records remain available to existing authorized workflows.

`scripts/reset-project-work.sql` is a destructive maintenance script, not an automatic migration. The user approved a live work reset on 10 October 2026: projects, tasks, linked assignments, timesheets, task-linked performance records and project history were removed. Clients and user accounts were preserved. Existing CRM leads were preserved and disconnected from deleted projects. Project ID counters were preserved to prevent reusing issued IDs.

## Verified live on 10 October 2026

The user approved the finance access change, and `202610100022_project_finance.sql` was applied successfully to Supabase project `cdgavcikyyxaydroihwp`.

A live transaction running as the authenticated Admin role created a temporary project with a ₹5,000 base rate, a ₹10,000 monthly client charge and a ₹7,000 one-time expense. The finance RPC returned the generated project ID and ₹8,000 net. The entire transaction was rolled back, including project notifications and the ID counter increment; no test work was retained.

Browser verification used the existing Admin session: Sales loads without errors; Projects → Project charges & costs loads; the reporting month changes; Sales appears and Timesheet is absent in desktop sidebar navigation. Light and dark themes and the narrow layout were inspected. Since the workspace is intentionally empty, populated chart interaction and coordinator form entry were covered by database/automated tests rather than retained live sample projects.

Validation: 106 tests passed; TypeScript and production build passed; new finance files passed ESLint. Evidence is saved under ignored `test-artifacts/project-sales-light.png`, `project-sales-dark.png` and `project-finance-live-check.png`. This does not certify the repository-wide lint backlog or the earlier outstanding Flow Force production-scope migration.

Sales client/chart update: client filters now include all client names visible under existing client RLS, independently of project creation. Finance-visible project clients remain available as a fallback; directory names take precedence by client ID. Added interactive six-month revenue/expense trend, revenue mix donut, and client ranking/filter cards using the black, #FFCC00 and light-yellow palette. Verified 21 real client names, Applebox zero-project filtering, May/October chart selection, current INR 5,000 project revenue, and desktop/mobile contrast and overflow in the local app connected to Supabase. Finance tests (3), TypeScript, targeted lint and production build passed. No database records or permissions changed for this update.
