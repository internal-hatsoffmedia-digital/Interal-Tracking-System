# Hsync identity and Dashboard title contrast

The approved black-and-gold Hsync image is used for the sidebar, sign-in/recovery pages, public landing page and browser icon. The original PNG pixels are retained; self-contained SVG viewports remove only its empty margin for the wordmark and compact icon.

The dark Dashboard project panel receives a narrowly scoped white heading colour override. The former global light-page heading colour had overridden its inherited white title. No project data, Dashboard layout, Team PC layout or permissions changed.

Browser verification used isolated Associate Lead fixture data. The approved logo loaded on sign-in and in the sidebar; compact navigation switched to the H icon. The Website Work project heading computed to rgb(248,250,252) against rgb(34,38,49), and remained the same white in dark mode. Proof: test-artifacts/hsync-logo-dashboard-fixed.png. No Supabase migration is required; deploy the new frontend build.

Release checks: all 204 tests passed and the exact staged TypeScript/Vite production build passed.
