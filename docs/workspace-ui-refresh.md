# Scoped workspace UI refresh — 7 November 2026

This is a presentation-only release. Reports and Performance have clearer header hierarchy, grouped filters, compact metric cards, section tabs, softer table headers and accessible status colours. Other operational pages share the updated card, control and table styling.

The refresh is gated by a route content attribute. Dashboard and Team PC, including nested routes, never receive that attribute. The sidebar and topbar are outside the scoped stylesheet. No business data, report content, filters, calculations, permissions or database schema changed.

Validation includes tests for excluded routes and every new CSS selector being route-scoped. Browser checks with isolated fixture data confirmed Dashboard and Team PC have no refresh marker; Reports filtering reduces three task rows to the selected employee; light and dark Reports layouts remain readable; the page stays within a 390px viewport. Performance, Tasks, Team Work, Projects, Clients, Employees, Teams, Team Members, Timesheet, Settings and My Work loaded with the refreshed marker. Checked pages emitted no page alerts or console errors/warnings in the fixture environment.

Screenshots are saved under ignored test-artifacts: reports-modern-desktop.png, reports-modern-dark.png, reports-modern-mobile.png and clients-modern-desktop.png. The new frontend requires hosting deployment. No Supabase migration is needed.

Final verification: all 204 workspace tests passed. The exact staged release passed both scope checks and the TypeScript/Vite production build.
