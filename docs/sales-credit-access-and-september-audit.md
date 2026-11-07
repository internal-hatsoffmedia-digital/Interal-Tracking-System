# Sales credit access and correction

Admin, Manager and the Associate Lead of the active Flow Force / Project Coordinators team retain authority through the existing server-side team_sales_access() function. Existing Director access is retained. Ordinary project coordinators, employees and unrelated team leads are not granted financial authority. UI page overrides cannot hide Sales from eligible leadership; backend APIs continue to enforce the coordination-team condition. Finance access cache is keyed by account, role, team and mode.

A fully allocated project cannot receive another employee share above its rate. The form shows the available amount, disables duplicate over-allocation, and offers Edit share and an explicit Reassign full credit action. Reassignment needs confirmation and the expected current shares. The server locks the project, rejects stale allocations, zeroes previous share rows, allocates the existing project rate to the chosen verified employee, and writes project audit history. Company revenue and the project rate do not increase.

**Database migration pending:** 202611070003_sales_credit_reassignment.sql was prepared and tested, but was not executed in production because the Supabase browser session stopped responding before the editor input action. Existing production credit allocations are unchanged. Apply this migration before deploying the reassignment UI. No role/permission database functions are replaced.

September 2026 read-only audit: 3 projects; INR 2400 across their rates and September booked sales; 3 linked sales credit rows; 0 linked tasks, assignments or timer sessions; 0 opening sales entries. No September records were deleted. The user was asked to choose between sales-only deletion and deletion of projects plus linked records. An exact permanent-deletion confirmation is still required after the scope is chosen.

Validation: all 208 tests passed, including access-role, stale-allocation, audit-history, duplicate-credit and confirmation-cancel tests. The exact staged TypeScript/Vite production build passed. Browser verification/install remained blocked by an unresponsive database browser session.
