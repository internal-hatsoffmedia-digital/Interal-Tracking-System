# Projects, sales booking, client links and work timers

Apply migrations 202611060001 through 202611060003 in order before releasing this frontend. They add the Rejected status and client links, preserve the original sales completion timestamp, and align the timer with owned open task assignments. Rejected projects have no rate and are omitted from sales totals. Project dates and assignment visibility still follow existing role permissions.

Rework should stay under the original project ID. A sale already booked in October remains in October if work resumes in November. The migration retains existing booking dates; it cannot reconstruct a date that was cleared or overwritten before this change. Review those older records against the original sales report before correcting them.

Projects opens on All dates; narrower dates are optional. Planner is hidden from workspace access and dashboard shortcuts. Client links accept up to 20 HTTP(S) URLs, one per line.

## Late first completion (7 November 2026)

Migration 202611070001_project_month_sales.sql is applied to production. When a coordinator first completes an older project, sales use its Project month for monthly projects, otherwise Start date, otherwise its creation date in IST. Current or future project dates book today. Rework preserves an existing sales booking; this migration does not rewrite previously booked records.

Regression coverage: late completion, monthly billing precedence, creation date fallback at an IST month boundary, current/future dates, booking tamper protection, rework and rejection. Three live checks used only temporary records and rolled back, without modifying production projects. No frontend JavaScript changed in this release.
