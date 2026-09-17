# Sales Tracker integration

Implemented from the supplied PDF: separate Sales & Marketing sidebar section; Control Center, Lead Master, Prospects, Follow-ups, Conversions and Team Performance; Outbound, Field and Campaigns views. Example data was not imported.

Lead creation/editing, assignment, activities, follow-up completion/rescheduling, conversions, monthly targets and CSV export now use Supabase persistence with server-enforced permissions and assignment notifications.

Activate with supabase/migrations/202609050003_sales_tracker.sql. It uses the supplied profiles/projects/notifications structure and works independently of the project migrations. No production SQL has been executed by this task.

Administrators initially have access and explicitly grant member (own leads), viewer (read all) or manager (manage all leads and targets) permissions to verified accounts. Project roles do not automatically grant Sales access.

Revenue means won deal value, not collected payments. Pipeline counts use creation month/current stage; revenue and wins use conversion month; source conversion uses the creation-month cohort. Follow-up queues cover all open leads. System history does not count as manual activity. Conversion does not automatically create a project.

Validation: 35 database/metrics tests, TypeScript and production build passed. Isolated browser tests cover admin legacy projects, lead creation/editing/conversion, activities, targets, access grants and viewer controls. Browser requests are mocked. Local PostgreSQL tests reconstruct the supplied DDL; full live policies/functions/enum labels were not supplied, so these checks do not certify the production configuration.
