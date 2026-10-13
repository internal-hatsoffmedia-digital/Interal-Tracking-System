# Dashboard overview and poll management

Updated dashboard layout: friendly greeting, image/banner hero with a built-in studio illustration when no images are published, compact task overview, and side-by-side birthday/poll cards. Yellow branding and moonlit dark mode remain. Birthday decorations include a cake, confetti and warm surfaces; upcoming names use the real saved employee directory.

Dashboard labels now use Work in progress, Team review, Client review, Overview and Work details. Task/Planner display labels also use Work in Progress; underlying statuses and task logic are unchanged.

Applied live migration 202610130008_poll_admin_controls.sql on 13 October 2026. Only active Admin may delete polls (including linked votes) or change an open poll’s closing time. Dates are entered/displayed in IST. Past deadlines are rejected, and closed polls cannot be reopened by rescheduling. Deletion requires confirmation in the UI. No existing polls or votes were changed during verification.

Validation: all 136 tests passed, including expanded poll-role/deletion/scheduling tests. TypeScript, changed-component lint and production build passed. Signed-in browser verified Dashboard, birthday calendar, poll creation end-time field, Admin delete button, Reports employee filter and Performance commitment table. Desktop/mobile layouts and light/dark mode inspected. Frontend remains local until GitHub push is requested.
