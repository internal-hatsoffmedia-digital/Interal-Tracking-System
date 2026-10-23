# SMP & EXP Projects — 23 October 2026

Implemented the renamed Projects finance tab, full-calendar-month project creation for Digital Ninjas - M / W, and same-page project details. Monthly completion selects one production team for the full rate after Internal QC approval. Personal employee credit allocation is blocked for these projects; regular projects retain their employee-completion workflow. Existing projects are not converted.

Verification:
- All 169 automated tests passed, including full-month boundaries, QC prerequisite, invalid-team rejection, personal-credit protection and selected-team-only revenue.
- Production TypeScript/Vite build passed; git diff whitespace check passed.
- Migration 202610220007 applied successfully to live Supabase cdgavcikyyxaydroihwp.
- Live read checks passed for project finance, sales metadata and scoped team overview. The verification transaction rolled back and created no rows.
- Signed-in Admin UI checked: renamed tab, M/W-only production selection, November 1–30 date boundaries, completing-team dropdown, and same-page existing-project form. Unsaved UI tests were discarded. No dummy projects/tasks/credits saved.

Deploy the ZIP contents directly into Hostinger public_html, including .htaccess. The ZIP contains production dist files only. The database migration is already applied.
