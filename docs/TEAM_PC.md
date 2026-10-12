# Team PC: work and activity

Team PC uses the existing supervisor permissions and verified active accounts. People and coordinator names come from Supabase roles/team membership, not a fixed name list. The organization reference does not automatically move users between teams or change anyone's access.

Use Coordinator, Team, Employee and Project dropdowns to narrow the visible records. Clear filters restores the full permitted view. Coordinator overview counts are filtered by coordinator/project; employee/team filters apply to the work views below it.

- **Assignments:** task, project, employee/team, assigning person, assignment time, commitment/deadline, completion time and status. Use the status dropdown to show open or completed work.
- **People:** each visible verified member's workload, including zero-work members.
- **Activity:** saved client/project/task creation, assignment and submission events, with person and exact IST time. Filter by activity type. This is derived from saved records, not an audit of every edit.
- **Monthly timing:** select the assignment deadline month. Late minutes minus early minutes are netted per employee; pending tasks cannot earn an early offset.

Tables scroll horizontally inside the card on smaller screens. Refresh fetches current records. The page is read-only and does not change assignments or employee accounts.
