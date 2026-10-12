# Office polls

Implemented for Hatsoff Drive and other Admin questions. Admin creates 2–10 distinct topic choices with an event label, question and optional IST deadline. Single-choice votes are unique per authenticated profile; changing a choice replaces the same vote. Admin closing and employee voting lock the same poll row to prevent close/vote races. Expired polls reject votes at the server. Results show only aggregate counts and the caller's own choice. No voter directory is exposed. Polls and votes persist independently of ephemeral birthday wishes.

The dashboard polls every 15 seconds, supports adding/removing topics and provides an unpublished preview. Its active-account count is dynamic; it does not assume 23 staff members. The latest 12 polls are shown. No YouTube upload or video recording is included in this feature.

Migration `202610110001_workspace_polls.sql` was approved and applied to live Supabase cdgavcikyyxaydroihwp on 11 October 2026 IST. Direct table access is revoked, RLS is enabled, and RPCs require an active profile; publishing/closing require Admin. Anonymous access is denied.

Verification: local database tests cover Admin-only creation/closing, input validation, duplicate-choice rejection, one vote per profile, changing votes, aggregation, inactive users, deadlines, closed polls and denying direct access to others' votes. Live transactional lifecycle checks passed and were rolled back: no test poll or vote retained. Browser verified six-topic editor, add/remove controls and unpublished preview. No live poll was published to colleagues. TypeScript, targeted lint and production build passed.
