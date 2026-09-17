# Project Coordinator ownership correction

The new migration is supabase/migrations/202609080005_coordinator_project_access.sql. Apply it once after project migrations 001 and 002; do not rerun 002 on an existing installation. This task has not executed production SQL or changed live account mappings.

- Project assignment and explicit sharing accept only active Project Coordinators in the mapped project team. The database and UI both enforce this.
- Muskan uses associate_lead and the Project Coordination team. Her project visibility and management are limited to that team. Legacy explicit membership cannot grant cross-team oversight.
- Lavanya and Esther use project_coordinator and the same Project Coordination team. Each sees their own assignments and explicit shares.
- Administrators and Directors retain all-project oversight. Kamalesh retains the earlier Lead rules; his team mapping must match the projects he oversees.
- Production employees remain task assignees. Their current task assignments retain the parent project access needed for production work; employee accounts cannot become project owners through the project-assignment controls.

Run supabase/check-coordinator-mapping.sql to inspect real accounts and legacy mismatches. If only Admin and Vijay appear, the coordinator login accounts are absent from the returned account list or not mapped correctly. Employee directory names alone do not establish authenticated login accounts. Select verified account UUIDs in Administrator: account roles & teams; map Muskan and the coordinators to the same coordinator team. Map existing projects to that team using Map project team.

No roles are changed by matching names, and no legacy membership rows are silently deleted. Existing invalid assignees are labeled Legacy access in the UI so an administrator can remove them and select the correct coordinator. New projects with an initial coordinator derive their team from that coordinator, rather than the administrator's production team.

Styling changes include project summary cards, contained filter/table layouts, coordinator selection cards, a fixed dialog header with internal scrolling, keyboard focus containment and light/dark colours. Content and historical project records are preserved.

Validation: 43 local database/metrics tests passed, including the new coordinator restrictions and preservation of employee task access. TypeScript, targeted lint and production build passed. Mocked browser checks cover coordinator choices, light/dark desktop dialogs, filtering, sharing, reports and role controls. These tests do not certify uninspected live policies or account configuration.
