# Director company-sales strip

Director dashboards now use company sales instead of personal credits in the scrolling top strip. It shows today's completed project sales and eligible charges, current-month sales, monthly target, remaining target and the required daily sales over remaining calendar days (including today). Other roles retain the personal credit strip.

Applied read-only migration 202610130009_director_sales_target.sql live on 13 October 2026. Target lookup reads the current IST month from sales_targets, falling back to an opening-period target only if one exists. No target was recreated after the approved reset. Unset targets display Not set; zero remains a real configured zero.

Monthly totals reuse the existing finance ledger logic, counting completed project base rates once and excluding company expenses from sales. Daily charges are recognized on the latest of the current month start, project completion date and entry creation date. Historical opening totals without daily dates are included monthly, never invented as daily sales. No work or sales data was created.

Validation: two targeted tests passed (IST completion boundaries, remaining/daily target, unset/zero values and employee denial). Production build and TypeScript passed. Live Director permission check succeeded; current company work/sales ledger is empty and October target is unset. Browser currently signed in as Admin, so its personal strip remains unchanged. Frontend changes are local, not pushed.
