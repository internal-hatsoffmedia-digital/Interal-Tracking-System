# Internal Force — production build verification

Prepared: 14 October 2026, 15:12 IST

## Deliverable

- Hosting ZIP: `hatsoff-internal-hostinger-2026-10-14.zip`
- Files: 96; ZIP size: 0.62 MiB.
- SHA-256: `780de0d97b38b6f4978a670c8bb51c21e738d4924cbd0f91d769f63cd974f303`
- ZIP contains compiled frontend files at its root, including `index.html`, `assets/` and `.htaccess`.
- Built from the current working tree, including the latest uncommitted project/team/Sales changes. No GitHub push or production deployment was performed for this build.

## Checks completed

| Check | Result |
|---|---|
| Full automated suite | 146 passed, 0 failed |
| TypeScript and Vite production build | Passed (`npm run build`) |
| Authenticated browser page rendering | 20 routes rendered in the existing Admin session, with no visible alert errors at observation time |
| Project creation form | Rate, production teams and eligible coordinator choices present; cancelled without saving |
| Task creation form | Manager assignees, project-rate fields and committed-time fields present; cancelled without saving |
| Sales calculations and filters | Client/team/employee breakdown, credited shares, shared-project handling, completion periods and pending-rate cases covered by tests and prior browser checks |
| Compiled build smoke test | `/login` loads in production preview; no browser error logs observed |
| Entry asset references | All referenced local assets exist |
| Package integrity | ZIP verified; `index.html` and `.htaccess` present at root |
| Bundle audit | No service-role JWT, privileged Supabase secret-key pattern, private-key marker, source `.env`, SQL or spreadsheet files found |

## Lint limitation

The full repository lint command remains **not clean**: 149 errors and 12 warnings. The application `src` comparison against Git HEAD is unchanged at 80 errors and 4 warnings; all six newly added application files have zero lint findings. Existing repository lint findings are not represented as passing. This does not prevent the TypeScript/Vite production build.

## Scope and known data conditions

- Browser verification used Admin. Other-role data protections are covered by automated policy tests, not fresh interactive logins for every role.
- No live projects, tasks, assignments, timer sessions or sales amounts were created/deleted during this release check. Form checks were read-only apart from local navigation/form opening.
- Creative Clan has completed historical projects with `Prospect` rather than numeric rates. Its zero booked revenue/pending-rate display reflects missing monetary data; this build does not invent rates or credits.
- Email notifications remain disabled; no project-email sending integration is configured.
- Supabase remains the backend. This ZIP does not contain database migrations or a database backup.
- The Apache route fallback is included for Hostinger; the destination hosting configuration has not yet been tested by deployment.

## Upload to Hostinger

1. Keep a copy of the currently hosted frontend for rollback.
2. Upload this ZIP to the chosen domain's `public_html` and extract **its contents directly there**, not inside another `dist` folder.
3. Check that `.htaccess` is present (enable hidden-file display if needed).
4. Use HTTPS and verify Supabase Authentication's Site URL / allowed redirect URLs for the actual domain.
5. Test login, refreshing `/dashboard` and `/sales`, project visibility and the new Sales filters after upload.

The package targets the domain root. Hosting under a subfolder needs adjusted Vite base and route configuration.
