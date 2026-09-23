# Deploy the employee and team administration update

Vercel deploys the frontend only. It does not run Supabase SQL or deploy Edge Functions.

In the existing Supabase project, apply these incremental migrations in order if not already installed:

1. `supabase/migrations/202609220014_fix_task_visibility_and_lead_scoping.sql`
2. `supabase/migrations/202609230015_admin_team_membership.sql`
3. `supabase/migrations/202609230016_admin_auth_employee.sql`

Do not replay reset/seed migration 012 on existing production data.

For creating new Authentication accounts from Team Members, also deploy `create-team-member` and `manage-team-member` from `supabase/functions`. These require Supabase server-side environment configuration. Never put a service-role key in Vercel VITE_* variables.

After SQL setup: Employees > Add Employee > Refresh Authentication users > select email > enter name > Save employee. Then Teams > Add Team, followed by Assign existing user > Save team.

Existing Authentication accounts should be selected, not recreated through Add Team Member.

After deployment, test a coordinator assignment from both the coordinator and recipient accounts. Local test success does not prove that the live database has the migrations installed.
