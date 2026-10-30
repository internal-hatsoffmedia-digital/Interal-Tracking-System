# Coordinator Associate Lead task creation — 30 October 2026

The live tasks_insert and task_assignments_insert policies permitted only is_admin_or_coordinator(). Muskan's existing project access to HMOCT26874 was true, while this legacy insert gate was false. Earlier test fixtures used permissive legacy write policies and did not reproduce that restriction.

Migration 202610300001 adds a narrow INSERT path for active Flow Force / Project Coordination Associate Leads and Team Leads. The project must already be within full_project_access and active. Task creation must use the caller as creator; assignments must use the caller as assigning person and a permitted active artist from task_artist_options. Existing restrictive policies, commitment checks and audit triggers remain. No project deletion, finance, account or HR permissions are added.

Parent/artist checks run in scoped security-definer helpers to avoid a circular tasks/task_assignments policy expansion. The legacy global role helper remains unchanged.

Verification: 22 team-access database tests passed, including reproduction of the exact legacy insert gate, create-and-return, artist assignment visible to the assignee, ordinary employee/production-lead denial, archived-project denial and assigning-person spoof denial. The fixture also includes the legacy task-assignee SELECT rule.

Live authenticated rollback test passed as Muskan on HMOCT26874: create task → assign a permitted Creative Clan artist with a confirmed future deadline → read assignment → confirm Team PC Activity actor and assignment. The transaction was rolled back; no dummy tasks, assignments or notifications remain. The first test exposed policy recursion; the corrected helper was applied and the complete live test then passed.

This is a database-only update, already applied to Supabase. Existing deployed frontend code can retry the same form without a new Hostinger upload.

Final full regression run: 177 tests passed, zero failures.
