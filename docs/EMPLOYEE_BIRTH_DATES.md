# Employee date of birth

Applied migration 202610130006_employee_birth_dates.sql to live Supabase on 13 October 2026. Full birth dates are stored separately from the shared employee directory with Admin-only select RLS and an active-Admin-only edit RPC. The Edit Employee form loads, saves and clears an optional date. Database constraints reject future dates and dates before 1900.

Imported 16 uniquely matched employees from the supplied list, including the clarified Lavanya date. No duplicate accounts were created. Pending identity clarification: Vijay R versus the Web Crafters account named Vijay; no linked employee accounts found for Manoj or Abinaya. Avoid assigning their dates to guessed identities.

Verified Kailash’s saved date in the browser. Birth-date privacy and employee-directory tests passed; TypeScript and production build passed. Screenshot: test-artifacts/employee-birth-date.png. Frontend changes remain local until GitHub push is requested.
