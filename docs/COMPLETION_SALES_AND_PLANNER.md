# Project completion and Planner carry-forward

Coordinators enter the service rate when creating a project. Sales recognizes the base rate once, only while the project is marked Completed, in its completion month (IST). Task completion alone does not book the project rate. Supabase sets the completion timestamp; users cannot backdate it through the form. Reopening a project withdraws its current booking; completing it again books it in the new completion month. Existing completed projects without a recorded completion timestamp are not assigned a guessed historical date.

Additional one-time client charges wait until both the project completion month and their booking month have been reached. Monthly charges begin no earlier than completion and respect their configured end month. Company expenses retain their entered periods. The confirmed October opening-sales ledger is unchanged. Recorded sales do not prove that payment has been collected.

Planner carries unfinished planned tasks forward to the current IST day. It keeps the original planned date and committed deadline unchanged and displays the original date beside a carried task. It uses the existing task, never a duplicate or a new project/rate. Finished tasks and work on completed projects stop carrying forward. Future planned tasks remain on their future date. The day updates while the page is open.

Coordinators mark project status through Projects → Edit → Status → Completed. Planner continues to use the existing task workflow for task status.

Migration: `202610120006_completed_project_sales.sql`. No projects/tasks are deleted or automatically marked complete.
