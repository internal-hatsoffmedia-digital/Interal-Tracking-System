# Coordinator project creation and teammate visibility

Tested 22 September 2026 using the current website, synthetic accounts and an isolated PostgreSQL database. **Partially working; the production associate-lead workflow fails.** No production records or application source were changed.

## What you can see

Coordinator A created **Demo — Coordinator team project** through Projects → New project, selected themselves as Initial Project Coordinator, and saved it. The browser's real insert payload was executed against the repository's SQL policies/triggers under Coordinator A's synthetic authenticated identity. This was not a canned success response.

| Check | Observed result |
|---|---|
| Coordinator creates project with themselves as coordinator | **Pass.** Database creates project, records creator/assigner and links project membership. |
| Project reflects the creator's team | **Pass.** Team is Coordination, taken from creator's profile. |
| Coordination associate lead sees new project | **Pass.** Project and its task visible. |
| Another coordinator in the same team sees project | **Yes.** Current policies allow this without explicit sharing; whether that is desired needs to match your role requirements. |
| Coordinator selects production associate lead as Initial Project Coordinator | **Fail.** UI offers the option; database rejects it because the selected profile is not a coordinator in the mapped team. Form clears the entered values after failure. |
| Coordinator assigns a task in the new project to Production A worker | **Pass in isolated SQL.** Worker can read task and project context. |
| Production A associate lead sees that assigned task/project | **Fail.** Lead reads zero copies while their worker reads one. |
| Production A associate lead sees teammates | **Yes, but too broadly for team-only visibility.** All nine synthetic employees across three teams are returned, rather than only Production A's three members. |
| Production A employee sees teammates | **Pass.** Sees own associate lead, team lead and self; no other-team employee records. |
| Unrelated Production B employee sees project/task | **Correctly denied.** No project/task returned. Sees only own team's employee record. |

## Screenshots from the actual local website

These are synthetic demonstration users and records, not real staff accounts.

### Created project — coordinator session

![Coordinator-created project](../test-artifacts/coordinator-created-projects.png)

### New project visible to coordination associate lead

![Coordination associate lead projects](../test-artifacts/coordination-lead-projects.png)

### Production associate lead — teammate directory is too broad

![Production associate lead employee directory](../test-artifacts/production-associate-lead-teammates.png)

### Production employee — own team members are visible

![Production employee teammates](../test-artifacts/production-worker-teammates.png)

### Production associate lead — team list

![Production associate lead Teams page](../test-artifacts/production-associate-lead-teams.png)

### Cross-team lead option rejected during creation

![Rejected initial coordinator](../test-artifacts/coordinator-cross-team-rejected.png)

## Why the failures happen

1. **Project creation and routing are different concepts.** `src/services/projects/projects.service.ts` explicitly supplies `team_id` from the creator's profile. Choosing a lead does not route the project to the lead's team. The membership trigger requires an active project coordinator in the mapped project team. The initial-coordinator dropdown in `src/pages/projects/Projects.tsx` includes associate leads, team leads and name/team-based fallbacks, so it offers choices the database rejects.
2. **Production leads are classified as coordination leads.** Migration 009's `private.coordinator_lead` returns true for all active associate leads/team leads with a team. The employee-directory policy then permits broad visibility, while the task-access helper's production-lead branch requires this same flag to be false. That combination explains both “sees everybody” and “cannot see my worker's task”.
3. **Failed save resets the form.** `ProjectForm.tsx` initializes state when option-array props change. The parent creates new arrays on rerender, including loading/error changes, so a backend rejection leaves the form cleared. Several form sections are also duplicated in the current markup.

The workflow to verify after correction is: **coordinator creates project → task allocated to production team/employee → that team's associate lead sees the assigned work → employees see their own teammates and permitted work**. Project ownership and production task allocation should have separate, explicit permission rules.

## Exact test limits

- Real React UI and services were used for project creation and directory screenshots; Supabase HTTP was intercepted and bridged to serialized SQL queries in PGlite. Synthetic JWTs were used only in the local browser fixture. No real login occurred.
- Current migrations were loaded except destructive reset migration 012. Migration 010's known invalid `ascending` keyword was replaced with `asc` **only in the in-memory SQL string**. Migration 013 was applied to the synthetic data.
- Employee RLS was explicitly enabled, with a fixture permissive SELECT/write policy plus the current restrictive team policies. This tests the new team boundaries but does not certify an unknown live baseline. Team-table rows use the reference fixture's visibility; production team-table policies were not inspected.
- The task/employee assignment was inserted under the coordinator's identity through SQL; task-form creation was not part of this focused run. Browser project POST and subsequent role-specific reads were exercised.
- This confirms local behavior under the documented fixture. It does not establish which migrations or policies currently exist on your live site.
- No JavaScript page errors occurred in the completed run.

Reproduction: `test-artifacts/coordinator-team-test.mjs`. Structured results: `test-artifacts/coordinator-team-results.json`. Browser writes/errors: `test-artifacts/coordinator-browser-requests.json`. All screenshots are in `test-artifacts/` (ignored by Git).
