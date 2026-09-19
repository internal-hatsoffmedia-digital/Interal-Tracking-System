# Project coordination and team setup

Reviewed 18 September 2026. Live repairs have not been applied.

## Confirmed cause

Esther and Lavanya have active Project Coordinator accounts in Flow Force, but no employee links. Project creation stores an employee ID, so neither account qualifies for the initial coordinator dropdown. Muskan is currently a Project Coordinator and also lacks an employee link.

## Requested access

- Admin: create projects and assign coordinators.
- Flow Force Associate Lead / Team Lead: create and assign projects in their coordinator team, oversee that team's projects.
- Esther: manage projects explicitly assigned to her, with San TV as the requested example.
- Lavanya: manage projects explicitly assigned to her, with SDC as the requested example.
- Other teams' leads: see their team's assigned work and worker records, without changing project coordinator ownership.
- Web Development: Vijay R as Associate Lead.
- Digital Marketing: Janani R as Associate Lead once her account exists and is verified.

The current database contains Website Work for Langhar Rice, not San TV or SDC projects. Do not create or reassign an unrelated project to implement those examples.

## Prepared changes

Migration `202609180007_coordinator_team_leads.sql` extends coordinator-team management to Team Leads, makes the coordinator directory available before the first assignment, and scopes other Team Leads to their own team tasks and worker records. It does not assign named accounts.

The project form excludes inactive employees and coordinator profiles without a team. The access preview reflects the new team-lead rules. Eight database permission tests passed, including coordinator reassignment revocation and cross-team isolation.

The local, untracked repair script `tmp/flow-force-repair.sql` links the three verified Flow Force employee records, promotes Muskan to Associate Lead, creates two Digital Ninjas teams, moves Vijay R into Web Development and prepares Janani's employee team. It checks expected state and rolls back on mismatches. It leaves other Digital Ninjas employees in place until their team allocation is specified.

## Pending decisions and activation

1. Confirm whether Manager means the existing Director role or a new role; no manager permissions have been added.
2. Approve the prepared live permission changes at execution time through the browser.
3. Provision and verify Janani's account, then assign her team lead role and link her employee record.
4. Verify login-based coordinator selection and project/task assignments after applying the changes. The local tests use a reconstructed schema and do not certify all existing production write policies.

The coordinator-team helper currently identifies coordinator teams by active coordinator membership, consistent with the existing system. Moving roles or teams therefore changes effective access and must remain administrator-controlled.
