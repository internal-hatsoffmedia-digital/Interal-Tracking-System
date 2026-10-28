# Task editing and project access — 28 October 2026

## Changes
- Recoverable project delete/restore is restricted to Admin and Manager in the UI and database. Project Coordinators and Associate Leads cannot delete projects.
- Flow Force leads, including Muskan, can be selected as the initial coordinator. The coordinator cover role remains within existing project scope.
- Active artist options are available to permitted task forms, Team PC and the Flow Force lead dashboard. Dashboard sales remain scoped separately.
- Existing task details and assignment edits save atomically. Authorized coordinators can change the artist and agreed deadline, including correcting a previous-day deadline after confirmation.
- Assignment revisions retain old/new artist and commitment timestamps internally. Team PC Activity records the actor and changed fields. Reassignment closes a running timer and resets the assignment to Assigned; recorded sessions remain owned by the original worker.
- Tasks resolves artist names and team names using the minimal work directory when employee-directory rows are unavailable. An existing assignment with an unavailable name is no longer labelled Unassigned. Employee IDs appear below names.

## Verification
- Production TypeScript/Vite build checked.
- Automated database tests cover project delete/restore boundaries, Muskan coordinator cover, scoped artist directories, previous-day rescheduling, employee denial, transaction rollback and timer-history ownership.
- Service tests cover artist-name resolution without HR rows and the employee self-view fallback.
- Live Supabase migrations applied: 202610270001, 202610280001 and 202610280002.
- Live rollback checks passed for Admin/Manager archive/restore and other roles being denied, Muskan coordinator/artist options, coordinator reassignment, previous-day deadlines and Team PC Activity. No live tasks or projects were permanently changed by these checks.
- Supabase inspection confirmed artists on the screenshot rows: Carousel-2 and Highlights rework → Lalith Balakumar; ALL CTA change → Vijay Raja; Before and After Reels → Saraswathyofficial18.
- Muskan project coordinator selector, dashboard artist filter and Team PC employee filter were checked in the browser. The local Tasks tab later became unresponsive to browser automation; the final form interaction was not verified in that session.

## Deployment
Upload the contents of the matching Hostinger ZIP into the site's public_html, including .htaccess. The ZIP contains only the production static site. Database migrations are already applied; do not upload SQL files, .env files or source code to public_html. Hostinger deployment itself is not performed by this change.

Final result: 173 automated tests passed; production build passed; deployment ZIP integrity checked (106 files, including index.html and .htaccess). No test inputs remain from the rollback-only live checks.
