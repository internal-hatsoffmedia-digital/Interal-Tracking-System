# October cleanup and compact Sales — 7 November 2026

The user confirmed permanent removal of the audited October 2026 project scope from production Supabase. October is determined by Project month for monthly projects, otherwise Start date, otherwise creation date in IST.

The transaction removed 355 projects and cascading dependent records. The pre-deletion audit counted 307 tasks, 303 assignments, 138 sales credits and 311 timer sessions. Project rates across all statuses totaled INR 659090.34; this differs from completed-sales revenue shown in the UI. No linked sales leads or task performance records were present.

Post-commit live verification: October booked project rates INR 0; October opening sales INR 0; orphan tasks 0; orphan assignments 0; project deletion guard enabled. The guard was restored within the same transaction. No reusable destructive migration is included.

Sales now opens on Overview, with three compact totals. Separate views hold Employee sales, Projects, and Charges & expenses. Charts, detailed revenue breakdown and credit allocations are collapsed until requested. Existing project cost editing remains available.

Validation: 192 automated tests passed, including three tests for report isolation and cost-view preservation. Browser checks with an isolated fixture verified all four views, reporting month selection, no warning/error logs, and page containment at a 390px viewport. Production cleanup was verified directly in the SQL editor. The frontend requires deployment of this release.
