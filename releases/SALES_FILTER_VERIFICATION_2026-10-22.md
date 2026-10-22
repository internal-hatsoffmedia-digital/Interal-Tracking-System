# Sales results on request — 22 October 2026

Sales initially hides result values/tables. Company overview has its own Show company results button. Employee sales, Revenue by filter, Project rates, Client summary and Charges & expenses open independently using their filters and Show buttons. Changes to filters/reset close previous results. Long tabular/list sections initially render 25 rows and support Show 25 more. Employee credit allocation lists only the selected project's credits. Exports preserve the full filtered result, not just the displayed page.

Employee credit directory data is shared across sections instead of making duplicate component requests. Database records, permissions and sales calculations are unchanged. No Supabase migration is required.

Validation: 11 relevant automated tests passed (filter calculations and initial no-result rendering); production/TypeScript build passed. Local component UI preview using 70 in-memory projects: initial table count 0; employee results 25 data rows; Show 25 more gave 50; changing employee hid the table; project-rate results showed 25; reset hid them; employee revenue remained correct at 7000 for all 70 projects; other sections stayed hidden. No fixture data was written to Supabase. Live Sales-role browser verification was requested but the accessible app account remained Project Coordinator.

This ZIP supersedes earlier 22 October builds and includes the prior QC launch-date/focused-hours changes. Upload/extract contents into Hostinger public_html. Includes .htaccess; no SQL, secrets or test preview files.

SHA256: c109cd01209655a73d40c28b1947817eb889c004f88c7bd51a69a31a72bfebe0

## Signed-in Admin verification

Admin browser verification completed after sign-in. Initial table count: 0; one Employee sales section. Employee Show results displayed 25 data rows; Show 25 more displayed 50. Employee selection hid stale tables; Saraswathy selection showed only her credits; Reset hid results. Creative Clan project-rate filtering opened 25 rows independently. A global team change hid tables and retained exactly one instance of each section. Company results and Creative Clan revenue breakdown each showed INR 1200. Client summary displayed 25 rows; Charges & expenses opened as a separate table. Global client changes hid both. The page was left at All teams/All clients with every result table hidden. No credits or records were saved.

The live check exposed duplicate React sibling keys, which could duplicate or omit sections. Each independently keyed Sales section now has a unique prefix; reload and repeated filter changes verified a single instance. Production build passed after this correction.

Latest verified archive: hatsoff-internal-hostinger-2026-10-22-sales-filters-verified.zip. This supersedes the earlier sales-filters ZIP.
SHA256: 742d6e20cd53c69fdbbf36a6785f6075e3ac0ba87bf8989f134525b722ba9dc5
