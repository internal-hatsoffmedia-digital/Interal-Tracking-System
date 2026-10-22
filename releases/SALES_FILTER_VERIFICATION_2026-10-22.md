# Sales results on request — 22 October 2026

Sales initially hides result values/tables. Company overview has its own Show company results button. Employee sales, Revenue by filter, Project rates, Client summary and Charges & expenses open independently using their filters and Show buttons. Changes to filters/reset close previous results. Long tabular/list sections initially render 25 rows and support Show 25 more. Employee credit allocation lists only the selected project's credits. Exports preserve the full filtered result, not just the displayed page.

Employee credit directory data is shared across sections instead of making duplicate component requests. Database records, permissions and sales calculations are unchanged. No Supabase migration is required.

Validation: 11 relevant automated tests passed (filter calculations and initial no-result rendering); production/TypeScript build passed. Local component UI preview using 70 in-memory projects: initial table count 0; employee results 25 data rows; Show 25 more gave 50; changing employee hid the table; project-rate results showed 25; reset hid them; employee revenue remained correct at 7000 for all 70 projects; other sections stayed hidden. No fixture data was written to Supabase. Live Sales-role browser verification was requested but the accessible app account remained Project Coordinator.

This ZIP supersedes earlier 22 October builds and includes the prior QC launch-date/focused-hours changes. Upload/extract contents into Hostinger public_html. Includes .htaccess; no SQL, secrets or test preview files.

SHA256: c109cd01209655a73d40c28b1947817eb889c004f88c7bd51a69a31a72bfebe0
