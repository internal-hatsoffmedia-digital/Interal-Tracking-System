# Hostinger build — 15 October 2026

Package: hatsoff-internal-hostinger-2026-10-15.zip
Size: 663,753 bytes; 99 files.
SHA-256: ca9813c00fa64f1fbb3a1a5b9c8fccd18c04dc4231c87762ea7e7ba21479eca6

Fresh TypeScript/Vite production build passed. The preceding end-to-end verification passed all 150 automated tests and live rollback-only workflow tests. Entry asset references, ZIP root structure and privileged-secret/source-file scans passed. No source environment files, SQL, workbooks or test fixtures are included. Public Supabase client configuration is compiled into the frontend as intended; database role policies enforce data access.

Includes current Employee/Lead dashboards, QC, leadership QC Activity, corrected team names, sales filters and Hostinger SPA routing. The corrected October data and QC migrations have already been applied to Supabase and are not part of the ZIP.

Upload the ZIP to the site's public_html and extract its contents directly there. index.html, assets/ and .htaccess must be at the public_html root rather than inside a dist or release subfolder. Ensure .htaccess is included. Open /login and /qc-activity after deployment to check direct-route reloads. Use the same configured Supabase project. No deployment or GitHub push was performed by this build step.
