# QC launch cutoff — 22 October 2026

Live migration 202610220006_qc_launch_window.sql excludes pre-launch confirmations from active QC. Earlier release timestamps are retained in prelaunch_released_at; review records, notes, tasks, projects and sales are not deleted. QC Activity excludes pre-launch dates and reviews outside the active queue. Future confirmed employee submissions and coordinator submissions continue to release work normally.

Live verification: 83 earlier released reviews removed from the active queue; 5 launch-day reviews remain released globally. Coordinator UI shows only qualifying work in its existing scope. 91 review records remain stored, including three entries that had never been released.

Boundary/idempotency test passed, including 21 October 23:59:59 IST exclusion and 22 October 00:00 IST inclusion for employee/coordinator confirmations. Production build passed. ZIP includes prior QC, credits, delete controls and focused-hours updates and supersedes earlier builds on this date. Database cutoff is already live.
