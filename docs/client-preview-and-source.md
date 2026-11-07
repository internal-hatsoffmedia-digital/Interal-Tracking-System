# Client source, social links and Preview — 7 November 2026

Each client has an optional lead source: Field visit, Campaign, Cold call or Message. The client list has one editable Lead source column and a Preview action on desktop and mobile. Facebook, Instagram and YouTube links are edited in the form and shown in the Preview popup, without adding social-link columns to the list.

Clients is always visible for active Admin, Associate Lead, Manager and Director accounts. Those leadership roles can edit source and links using a narrow server function; core client fields retain existing Admin/Project Coordinator permissions. Existing general client links remain supported.

Team Work now resolves display identities through a minimal assignment-scoped lookup when HR employee rows are hidden. It returns names and employee codes, without email, phone or other HR fields. A production read-only check with Vijay's Associate Lead permissions found 51 visible clients and no visible assignments without a resolvable employee name.

Migration 202611070002_client_social_preview.sql was applied in production. Catalog checks confirmed the four new client columns, URL and source constraints, limited editing function and display-name lookup. No production client values were changed for testing.

202 workspace tests passed. New tests cover URL/source validation, clearing fields, restricted editing, employee/anonymous denial, display-name fallback and client Preview/list rendering. Interactive visual verification remains incomplete: fresh browser tabs could not attach, and automatic approval review rejected navigating the existing production SQL editor to localhost. The authenticated editor was preserved. The packaged frontend requires deployment.
