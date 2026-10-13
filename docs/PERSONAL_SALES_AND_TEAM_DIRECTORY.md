# Team directory and personal sales

Team Members uses `workspace_team_directory()`. Active staff see active colleagues with the same profile team ID, including Flow Force, Cut Masters, Creative Clan, Digital Marketing and Web Development. An unassigned staff account sees an empty directory. Admin, Manager and Director retain their organization directory. Admin alone can edit, activate or provision accounts. Non-admin directory rows exclude email addresses.

The dashboard ticker moves left to right and shows only the signed-in account's explicitly credited completed-project base rates: current IST month, all-time total and credited project count. It has Pause/Resume, pauses on hover/focus, and disables automatic motion for reduced-motion users. Historical unattributed opening totals never become individual sales credits. Completed projects with one verified contributor now auto-credit that person; shared projects still require leadership allocation. See SOLO_SALES_AND_TEAM_DAILY.md.

For shared projects or allocation changes, authorized Sales leadership (Admin, Manager, Director, Flow Force Associate Lead) can use **Sales → Credit employee sales** to allocate the agreed amount from a completed project's base rate. Credits are not added to Sales revenue again. Each project/account pair has one replaceable amount. Entering zero revokes that share. The sum across employees cannot exceed the project base rate; project-row locking serializes concurrent credit changes. Reopening a project removes its credits from employee totals until it is completed again, when its completion month controls the month total.

Employees cannot read the credit table, leadership directory or another user's totals. `employee_sales_summary()` accepts no account ID. The full Sales route remains restricted. Additional service charges, company expenses and historical sales-lead ownership are not attributed by this initial feature.

Migration: `202610130003_team_directory_personal_sales.sql`. Tests cover own-team scope, own totals, no inferred credit, direct table denial, unauthorized editing, completed-only recognition, over-allocation and invalid amounts. Applied to live Supabase on 13 October 2026. Verified with Lavanya: exactly four Flow Force members, no management actions, a personal ₹0 sales ticker, and Sales-page denial. No historical totals were credited to individuals. The allocation editor was covered by database tests; it was not submitted under a leadership browser login.


## Director employee/date report

Sales now includes an **Employee sales** report above the separate company-revenue summary. Choose Employee, Completed from and Completed through. Dates include both endpoints and use the project's completion date in IST. The current reporting month supplies default date bounds. Team, client and project filters also restrict the available projects. Employee amounts come only from explicit sales-credit shares; shared project base rates, opening totals, additional charges and expenses are never copied into employee totals.

The report shows credited sales, credited employee count, distinct completed project count and detailed employee/client/project rows. **Export employee report** exports only the filtered rows, with escaped CSV fields. Company charts and totals remain labeled separately and use their reporting-month filters. Editing sales credits refreshes the report automatically.

No database migration or access expansion is needed for this report; it uses the already approved leadership-only credit directory. Tests cover employee scoping, IST date boundaries, shared-project counting, uncredited/unfinished work and composition with existing project filters.
