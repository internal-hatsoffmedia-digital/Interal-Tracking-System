# Hat Panel tracker alignment

The Projects page uses the Main Tracker columns. Tasks use a single table with one row per task and artist; the Board/List switch is removed. Project ID, rate and client context come from the selected project, coordinators come from project membership, and artists come from task assignments.

## Fixed project IDs and shared rates

Apply `202610100021_fixed_project_ids.sql` after the tracker migration. Supabase generates IDs such as `HMSEP0001` (Hatsoff Media, September, serial number). The month uses the creation time in IST. Counters continue across years to keep the requested format unique. Existing issued codes are preserved; projects without codes receive IDs based on their original creation month. IDs cannot be edited, including through direct database writes.

When work continues the next day, create or reassign a task under the existing project instead of making another project. The task selector shows the ID and title. All linked tasks show the current project rate; it is a single project amount, not an additional fee per task. Update the rate through Edit project, including after completion. Task deadlines and daily timesheets remain independent of the project ID and rate.

## Deployment

Apply `supabase/migrations/202610100020_hat_panel_tracker.sql` before deploying the frontend. This adds optional project code, category, actual production timestamps, final link, remarks and rate. Existing project records remain valid; their new fields display as missing until entered. Project codes are unique without regard to case. Rates use INR, cannot be negative, and are nullable. Final links accept HTTP or HTTPS. An end timestamp requires a start timestamp and cannot precede it. Existing project row permissions continue to apply.

## Time definitions

Delivery Date is the project client deadline. Project Start/End Time & Date are separately entered actual production timestamps, displayed in IST. Task Committed Time uses the assignment deadline snapshot, falling back to the task deadline, with estimated hours shown underneath. Start/End Time and Total Hours come from the artist's timesheets, filtered by the selected work date. Clearing the date shows all records. First start and last end describe the work span; total hours sum recorded sessions rather than elapsed wall-clock time.

## Verification

Latest local run: 103 tests passed, zero failures; TypeScript and Vite production build passed. Auth regression tests cover synchronous session callbacks, stale initial sessions, sign-out during profile loading, and missing profiles. Profile requests now run outside the Supabase auth callback to prevent a session-loading deadlock.

Browser checks used an isolated in-memory Supabase fixture, not production credentials or records. Verified sign-in, session restoration after reload, sign-out, invalid credentials, project editing/persistence, task artist/time totals and work-date filtering. Loaded Dashboard, Projects, Tasks, My Work, Team Work, Team PC, Planner, Timesheet, Clients, Teams, Employees, Team Members, Performance, Reports and Settings. These are smoke checks, not exhaustive role-specific workflow certification. Mobile navigation and project table containment passed at 390px; the wide tracker scrolls inside its container. Project tracker contrast now follows the shared light/dark text colours.

A read-only live REST query for all tracker project columns returned HTTP 200 on 10 October 2026. Earlier it returned 42703 for missing project_code; the shared workspace database audit records the tracker migration being applied. This run did not apply migrations or verify fixed-ID triggers through an authenticated database connection. See test-report-20261010.md for the separate production schema/data audit, pending permission migration and repository lint failures. Frontend changes require deployment; a real-account production sign-in remains unverified.