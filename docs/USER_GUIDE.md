# Internal Force · User Guide

Use Internal Force to organize clients, projects, assignments and delivery. Your account role and team determine which records and actions are available. This guide explains the workflow; it does not grant access.

## 1. Sign in and find your workspace

Use your administrator-provided email and password on the login page. If you forget your password, use the password recovery option and follow the email link. Ask your administrator for help if your account is inactive or has no linked profile.

The Dashboard is your starting point. Today shows assigned work, announcements, production stages and tasks needing attention. Projects & people shows project activity and workload. Studio insights shows production and client summaries. Switch between Executive Cockpit and Operations Flow when those controls are available.

Use the sidebar to open a page. On small screens, open the navigation menu first. Use the header search or Ctrl K to find a workspace page. The bell shows accessible task and project notifications. Click a notification to open its workspace.

## 2. Understand roles and visibility

- Admin manages user access and can see all teams. Only an administrator should change account roles and team membership.
- Manager and Director oversee work across the scope granted to their accounts. Visibility does not automatically allow every administrative action.
- Associate Lead and Team Lead oversee accessible team work and use Team PC or My Team when available.
- Project Coordinator creates and assigns work within authorized projects. Coordinator assignment views are intended to show the coordinator's own work.
- Employee uses My Work to act on their own assignments and Timesheet to log work.

Flow Force is the project coordination team. Its Manager, Director and Associate Lead production-wide view excludes marketing. This access update is prepared but still awaits activation in the live database; until activated, existing access rules apply. After activation, coordinators are limited to work they create or assign. Ask Admin if the expected team or work is missing rather than changing another person's account.

Production categories include video editing (Cut Masters), graphic design (Creative Clan), web development (Web Crafters), and project coordination (Flow Force). Digital Ninjas is the separate digital marketing team. Team names and membership are managed in Teams and Employees.

## 3. Set up a client and project

- Open Clients and add the client's name and available contact information. Choose a coordinator when the form offers that field. Creator and creation time provide an audit trail.
- Open Projects and create the project with the correct client, team, status and delivery information.
- Use the project's available coordinator or sharing controls to give authorized people access. Check the selected account carefully before saving.
- Keep project details current so tasks, workload and reporting have the right context.

Clients and projects are added manually. Before removing a client or project, check its linked work and the confirmation message: deletion can affect related tasks and records. Do not remove records just to resolve a visibility problem.

## 4. Create and assign a task

- Open Tasks, add a task and link it to the correct project. Enter a clear title, priority and deadline where supported.
- Open Team Work to assign the task to the correct employee. Confirm the employee, deadline date and exact time before saving.
- Review the assignment details: who assigned it, who received it, assignment time, deadline and completion time.
- If the same task goes to several employees, track each assignment separately. One person's completion does not describe everyone else's work.

Tasks describe the deliverable. Assignments describe each person's responsibility and progress. Editing a task and completing an assignment are separate actions. Refresh the page after an assignment change if another open view has not updated yet.

## 5. Complete your assigned work

Open My Work and find your task. Use Accept to acknowledge it, Start when work begins, and Complete after submitting the finished work. Only use actions that appear for the current assignment state. Filter by status or overdue work to find your next item.

The recorded completion time is the employee's submission time. It is separate from internal review, client approval and final delivery. Use the task or project workflow to track those later stages where available. Do not mark unfinished work complete to improve timing figures.

## 6. Plan deadlines and log hours

Planner helps review upcoming work and delivery dates. Compare the plan with your assigned tasks before starting your day. Notify your coordinator if deadlines overlap or a delivery is at risk.

Timesheet records time spent working. Add the correct task, date and hours, then check the saved entry. Logged hours measure effort; monthly delivery timing measures whether a submission was early or late. These numbers answer different questions and should not be treated as interchangeable.

## 7. Team PC and monthly timing

Team PC shows accessible coordinator activity, including clients, projects, created tasks and assignments. Expand a coordinator's activity details to inspect individual items and timestamps.

In All teams · Monthly timing, select the deadline month in IST, then choose a team or employee to narrow the results. The table shows completed assignments, late minutes, early minutes, net timing, pending/overdue work and missing timestamps. Assignment detail cards show the assigner, employee, deadline and completion time.

Net timing = total minutes late minus total minutes early, calculated per employee for the selected month. A positive result means net delay; a negative result means ahead; zero means balanced.

Example: a 5:00 PM deadline completed at 6:30 PM is 90 minutes late. A 4:30 PM deadline completed at 3:30 PM is 60 minutes early. Together, the employee has 30 minutes net delay. Two assignments each 60 minutes late total 120 minutes delay.

Pending work is shown separately and earns no early offset. Missing timestamps cannot produce a reliable timing result. Deadline snapshots preserve historical timing when task details change later. The month follows the assignment deadline in IST; records without a deadline may use completion time, and records with neither appear as untracked.

## 8. Reports and performance

Reports summarizes accessible task completion, logged hours, project health and workload. Choose a date range or preset, refresh when needed, and use Print Report for the browser's print/save options. Check the selected range before sharing figures.

Performance provides employee and work summaries within your permitted scope. An empty report can mean there is no work in the selected period, the work is outside your scope, or required timestamps are missing. Check the underlying assignments and timesheets before interpreting a total.

## 9. People, accounts and teams

Employees contains workforce records. Team Members manages application accounts linked to authentication. A workforce entry alone does not prove that a person can log in. Ask Admin to check account status, linked employee, role and assigned team if someone is missing or duplicated.

Admin can use Settings → Access Management to review an account, select its role and team, inspect the effective access preview, and save. Name matching is not automatic: verify the correct account before editing. A role change does not reactivate an inactive account.

## 10. Profile and appearance

Open Settings → My Profile to edit your name, phone and job title. Email is managed by your authentication account. For a profile picture, upload a JPG, PNG or WebP under 5 MB, choose a female or male illustration, or use initials. Save Profile to persist changes; selecting a picture alone does not save it. Default illustrations are selected by the user, not inferred from their name.

Use the theme control to switch light/dark appearance. Sign out from the sidebar when finished on a shared device.

## 11. Troubleshooting and current availability

- Missing task or team: confirm your signed-in account, selected filters and team assignment with Admin. Do not create duplicate records.
- Empty Team PC: check the month, team filter, linked coordinators and assignment deadlines.
- Save fails: read the visible error, check required fields and retry after refreshing. If an account was already created, verify it before creating another.
- Slow or stale view: check your connection and use Refresh. Persistent errors should be reported with the page, action and time, without passwords or keys.
- Sales Tracker is temporarily disabled in the website and mobile navigation. Its records are preserved for future restoration.

The website and native mobile app use the same workspace data. Available screens may differ by platform. This guide describes the website; having a local build or a GitHub commit does not by itself deploy it or activate database changes.
