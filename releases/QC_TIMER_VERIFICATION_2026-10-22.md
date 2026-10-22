# QC and timer update — 22 October 2026

- QC requires an explicit coordinator Internal QC save. Employee project submission waits for the coordinator. Old QC records remain preserved; no implicit historical release was performed.
- Live rollback verification passed for employee submission, coordinator release and saved changes attributed to the signed-in profile. All test edits rolled back.
- Timer reporting uses the same existing per-person/task scope as work insights; direct timer table access remains revoked.
- Task rows use first timer start, employee assignment completion and total focused timer duration (pauses excluded, IST midnight capped).
- Performance includes employee display IDs in summary, task, timer views and CSV.
- Dark table row hover uses a dark surface with readable text.
- Automated suite: 163 passed, 0 failed. TypeScript/production build passed.
- Browser visual verification remains incomplete: localhost and 127.0.0.1 connections timed out from the in-app browser despite the development server starting. No full UI end-to-end claim is made.
- Deployment ZIP contains dist contents at its root, including .htaccess. Upload/extract into Hostinger public_html. Database migrations are already applied; SQL is not in the ZIP.
