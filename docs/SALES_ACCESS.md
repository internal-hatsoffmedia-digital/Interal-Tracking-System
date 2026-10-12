# Sales visibility

Sales is available only to active Admin, Director, Manager and the Flow Force / Project Coordinators Associate Lead. Employees, regular project coordinators, production Associate Leads and team leads cannot open Sales or read either Sales RPC, including the historical opening ledger. Legacy CRM grants do not override this rule.

Regular coordinators retain their scoped project charge/cost entry tools. Production leadership cannot use that finance endpoint to bypass the Sales restriction. Existing work oversight remains available.

My Team gives Associate Leads and team leads their own verified team members, assignments, saved project activity and monthly delivery timing. Employee and project dropdowns narrow that view; team membership comes from configured accounts, never names in an illustration. The hierarchy reference separates Flow Force, Cut Masters, Creative Clan, Digital Marketing and Web Development. No account roles or team memberships are automatically changed.

Sales filters include reporting month, team, client and project. Team filters match a project's primary team or selected production teams. Shared projects show their whole amount; team totals must not be summed together as allocations. Opening entries filter by their recorded team and stay excluded from client/project filters until attribution is confirmed. The company target appears only in the all-team, unfiltered view.

Latest migration: `202610120004_sales_leadership_only.sql`, following migrations 001–003. This changes access rules without deleting projects, clients or historical sales.
