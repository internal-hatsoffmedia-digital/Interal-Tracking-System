# Job titles and team assignment

Admin can set a job title in Settings → Access Management. Suggestions include Graphic Designer, Video Editor, Web Developer and Digital Marketer; other titles can be typed. The title is stored on the account and linked employee records. It does not change the account's permission role. Saving checks for concurrent title/access changes and records title changes in the Admin access history.

Project coordinators can select multiple active Production teams when creating or editing a project. The project keeps its coordinator ownership separately. Selected teams' leads can see that project's sales, even before an employee task is assigned. Shared project amounts are whole-project amounts, not a split of revenue.

To assign work: open Team Work → Assign Task, select the task, choose a team, then choose an available employee. Employee options include their job title. Changing the team clears the employee choice. Existing permission checks and the confirmed committed deadline remain required. Team selection does not create a task or start an employee's timer automatically.

Migration `202610120002_job_titles_and_project_teams.sql` must be applied before using these controls. The separate maintenance script `scripts/reset-project-sales.sql` permanently deletes project work and sales records while preserving clients, accounts, teams and Sales permissions. It must never be included in deployment migrations.
