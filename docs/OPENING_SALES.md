# October 2026 opening sales

Confirmed aggregate balances are stored in `sales_opening_entries`, separate from projects and costs. The import creates five category entries totalling INR 362,300, with company target INR 1,000,000 and individual tracking start 14 October 2026. Salesperson is Unattributed; no client or daily record is inferred.

Use migration `202610120003_opening_sales.sql` before operational script `scripts/import-october-opening-sales.sql`. Re-running the import is safe: matching entries are skipped, conflicting entries or ambiguous teams abort the transaction. Do not run the project/sales reset to import these balances.

The opening-sales RPC follows existing Sales access: Admin, Director, Manager and Flow Force Associate Lead see the full ledger and company target. The latest leadership-only Sales migration denies production Associate Leads, team leads, employees and regular coordinators access to this ledger. Authorized Sales viewers can use the team filter to inspect individual team balances. Tables deny direct client access.

October totals, trend charts, revenue mix and CSV include the opening balance once. Client/project filters exclude it because attribution is unknown. When exact details arrive, reconcile or replace these opening balances rather than adding the same revenue again as new projects. Opening totals are historical reported sales, not proof of collection.

Verification: `node --test tests/openingSales.test.mjs tests/projectFinance.test.mjs tests/teamAccessDatabase.test.mjs`, TypeScript build and Vite production build.
