# Activate projects and Sales Tracker

The supplied schema contains projects, employees and task_assignments, but no project_members. This explains the relationship error. The updated admin Projects page reads existing projects using the legacy structure and current database permissions. Enhanced assignment/sharing requires the migrations below.

No live database changes or hosted frontend deployment were performed.

1. Review the complete result from supabase/inspect-current-schema.sql. The screenshot only shows a truncated cell. Table DDL does not include full policies, functions or enum labels needed to check existing project security.
2. For project access, execute supabase/migrations/202609050001_roles_and_statuses.sql separately and commit, then execute 202609050002_project_access.sql after reviewing current policies and docs/project-access-deployment.md. Do not rerun tracked migrations already applied.
3. For Sales, execute supabase/migrations/202609050003_sales_tracker.sql. This can run independently before the project migrations to activate Sales while project policy review continues.
4. Refresh the updated application. Map verified project accounts and teams: Muskan Associate Lead; Kamalesh Lead; Lavanya and Esther Project Coordinators; Veena and Sabari Directors. Review historical assignments rather than guessing them.
5. In Sales Tracker, an administrator grants Sales access to verified accounts and sets monthly targets. Check each intended role with its own account.

Use the migration files, not supabase/reference/20260905-user-schema.sql, which is reference DDL only. Validate security changes on staging before production. Migrations request an API schema-cache refresh.
