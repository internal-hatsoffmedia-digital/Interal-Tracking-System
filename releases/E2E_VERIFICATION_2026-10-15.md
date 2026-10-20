# End-to-end verification — 15 October 2026

Result: all executed checks passed. Production build passed; 150 automated tests passed, zero failed.

## Live workflow test

Ran against live Supabase using existing mapped accounts with authenticated database roles. All synthetic data was inside one transaction ending in ROLLBACK. No test account was created and no production record was edited.

- Admin creates isolated projects with coordinator and production-team mapping.
- Coordinator creates tasks and assigns an Employee and a Manager.
- Missing confirmed commitment is rejected.
- Manager can read their assigned task.
- Employee accepts, starts work, starts/pauses/resumes/finishes timer and submits to Internal Review.
- Internal Review automatically creates a QC item.
- An unrelated employee cannot claim QC or start the other employee's timer.
- Reviewer claims QC, sends targeted corrections; employee receives notification and resubmits; reviewer approves.
- Coordinator receives QC notifications, moves task through client review/delivery and completes project.
- Completion records its booking date and sole contributor credit once.
- Personal sales, Associate Lead team sales, Manager QC Activity and work insights return expected records.
- Admin publishes/closes a poll; Employee votes/changes vote; closed poll rejects new votes.

## Browser checks

Signed-in Admin session: Dashboard, Projects, Tasks, My Work, Planner, QC, QC Activity, Team PC, Team Work, Employees, Team Members, Teams, Sales, Performance, Reports, Settings, Access, Daily Desk, Timesheet and User Guide loaded. Clients also loaded with 36 records. Project and Task creation forms opened and blank submissions remained in the form without creating records. Coordinator choices and Manager assignee options loaded. No browser console errors observed.

Browser authentication was tested with the existing Admin session. Other roles were exercised through authenticated live database checks and the automated role tests, not separate browser sign-ins during this run. No password changes, real email notifications or account provisioning were exercised.

Narrow browser pane layouts showed no page overflow. The browser viewport override did not report the requested 390px/1440px widths; observed document widths remained approximately 574–580px, so exact breakpoint coverage is not claimed.

## Cleanup verified after rollback

| Record | Remaining |
|---|---:|
| Imported projects | 121 |
| Tasks | 0 |
| Work timers | 0 |
| QC reviews from corrected sheet | 2 |
| QC notes | 0 |
| QC events from import | 2 |
| E2E dummy projects | 0 |
| E2E dummy polls | 0 |

Next project ID remains **HMOCT26691**. The two QC reviews and two import events are real imported work, not dummy inputs. Accounts, clients, teams, birthdays, access settings and imported project records were preserved.

Evidence: test-artifacts/e2e-20261015-live-results.json, e2e-20261015-cleanup.json, e2e-20261015-ui.json, e2e-20261015-tests.txt and e2e-20261015-build.txt.
