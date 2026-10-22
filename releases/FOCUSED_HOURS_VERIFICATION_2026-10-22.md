# Focused hours on Tasks — 22 October 2026

Includes the confirmed-completion QC, correction-routing, recoverable-delete and verified historical-credit updates described in CONFIRMED_QC_VERIFICATION_2026-10-22.md.

Tasks now reads both task-linked and project-only timer sessions within the existing work-insights person/project scope. No timer rows are altered. Task rows display focused task hours and the project/employee total. A project/employee summary shows project IDs, employee IDs, task-linked hours, project-only hours and focused total. Date filtering uses IST; pauses are excluded and open timers stop at IST midnight. Project-only time is not assigned to an arbitrary task or duplicated across tasks in totals. Timer selection now makes Project only versus Task explicit.

Applied live migration: 202610220005_project_focus_reporting.sql. Verified in the signed-in coordinator Tasks UI: HMOCT26737 / Video 2 / Saraswathyofficial18 / EMP-017 shows 1.03h project-only and 1.03h focused total, matching the supplied Timer Log screenshot. The task row explicitly distinguishes 0.00h task-linked from the 1.03h project total.

Validation: 165 automated tests passed, 0 failed; TypeScript/production build passed. Database tests cover person scope and project-only sessions; aggregation tests cover pauses, IST day boundaries, multiple tasks and employees without double counting. No dummy work or test corrections were committed to Supabase.

ZIP contains dist files at root with .htaccess. Database updates are already applied. Upload/extract to Hostinger public_html. This ZIP supersedes the earlier 22 October builds.

SHA256: 0e3732f14ebb473f7c095dc22068bcf3afd2dd3714cfee3f90e410827ec4ad01
