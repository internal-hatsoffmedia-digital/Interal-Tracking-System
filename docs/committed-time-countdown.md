# Committed-time countdown release

My Work (desktop and mobile), the task tracker and task commitment reports show time remaining until the assignment's committed deadline. Estimated/actual hour fields and task hour summary cards are hidden; existing recorded values are preserved.

The signed-in user's open assignments produce in-app reminders at one hour, ten minutes and the deadline. Only the most urgent threshold appears on first load. Reminders are deduplicated per user, assignment and deadline in browser storage, so rescheduling creates a fresh reminder schedule. Completed/rejected work does not notify. The reminders need the app open; they are not background push notifications.

Validation: 196 workspace tests passed in the previous run. Four focused tests cover countdown boundaries, threshold deduplication, completion and rescheduling, and popup escalation. Browser verification remains incomplete because Computer Use stopped when it could not determine the current URL. This is a frontend-only update; no Supabase migration is required.
