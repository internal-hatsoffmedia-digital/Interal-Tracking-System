# Central Admin Access Management and team oversight

Apply supabase/migrations/202609080006_team_access_admin.sql once after migrations 001–005, then refresh the application. The panel appears in Settings → Admin Panel → Access Management. No production SQL or account mapping has been performed by this task.

The panel centralizes role/team settings, Sales permission settings and the effective visibility preview. It provides account search, role/team filters, optimistic concurrency checks and a database audit record for each changed save. Visibility follows roles and team assignments; the panel intentionally does not provide an unrestricted “all teams” override for Associate Leads. Existing editing restrictions still apply. Reports reflect the rows the user can access; reports/export are not separate independent permissions in this version.

Select verified accounts and assign:

| Account | Role | Team |
|---|---|---|
| Muskan | Associate Lead | Project Coordinators |
| Ganesh | Associate Lead | Creative Clan |
| Sudeesh | Associate Lead | Cut Masters |
| Vijay | Associate Lead | Web Runners |
| Janani | Associate Lead | Digital Ninjas |
| Lavanya and Esther | Project Coordinator | Project Coordinators |

Create missing teams through Teams first. Login accounts must already exist in profiles; no accounts are matched or created by name. Saving aligns linked employee team IDs, which determine production task scope. Existing project teams and task assignments remain unchanged.

An Associate Lead whose team contains active Project Coordinators is the coordination lead. Other Associate Leads have production oversight derived from current, non-rejected assignments to active employees in their own team. They see relevant parent project context but cannot create projects, assign project owners, view coordinator history or see other teams’ assignment/timesheet records on shared tasks. Employees see their own assigned tasks. Admin/Director visibility and Kamalesh’s earlier Lead rules are preserved.

The migration tightens task-related table RLS rather than simply filtering the sidebar. Moving tasks between projects requires project editing authority. Only admins can change employee teams. The admin panel cannot demote its own active administrator account. Announcements remain admin-managed, and Sales access remains explicitly granted separately from project roles.

Validation: 49 local database/metrics tests passed, including all five lead scopes, shared-task worker privacy, denial of cross-team writes, admin-only mutations, stale-save rejection, auditing and immediate database revocation after a team change. The panel has mocked browser checks for role/team filtering, save payloads, Sales settings, light/dark styling, mobile layout and non-admin exclusion. Live policies, functions and views outside the supplied schema remain unverified; inspect those in staging before production release.
