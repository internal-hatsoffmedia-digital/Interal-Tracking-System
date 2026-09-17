# Improvements — 10 September 2026

Implemented locally:
- Route-level lazy loading with an accessible loading state. Main JavaScript output reduced from approximately 1,024 KB to 259 KB; other pages and Supabase load as separate chunks. This is a bundle-size improvement, not a measured real-user speed claim.
- Page error boundary provides reload/dashboard recovery for rendering or lazy-import failures.
- Missing-profile and inactive-account screens now offer Retry profile and Sign out, with disabled buttons during requests and readable error feedback.

Verification: TypeScript and targeted ESLint passed. Browser and final build results are recorded below. No database schema, permissions, employee records or credentials changed.

Still required before daily office release: live Supabase schema and role verification, verified Harish/Abinaya profile IDs, production recovery URL/email delivery and backup evidence. See daily-office-release.md. Existing unrelated lint debt remains.
Final verification: production build passed without the previous large-chunk warning. Auth recovery, Sales Tracker and brand/dashboard browser regression scripts all passed with mocked backend data. Live backend tests remain pending.
