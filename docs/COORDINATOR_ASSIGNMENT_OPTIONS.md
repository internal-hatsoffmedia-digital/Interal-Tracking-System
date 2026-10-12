# Coordinator assignment options

Project creation loads `project_coordinator_options()` directly. It no longer intersects the general employee directory with `project_people()` or treats an RPC error as an empty directory.

Admin, Manager and Director receive active, employee-linked coordinators. Flow Force leadership receives coordinators in its own active team. Production leads receive none. Regular Project Coordinators receive only their own linked account and the create form explains that they own the project; it does not invite reassignment to another coordinator. All eligibility is role/profile based, with no hardcoded names.

The existing project insert/assignment workflow remains authoritative. The RPC exposes only assignment identifiers, names, employee codes and team IDs; no email, phone or employee-editing permission. Inactive accounts, inactive employee links and inactive teams are excluded. The setup warning remains for a supervisor with genuinely no eligible options. Lookup errors are displayed separately.

Migration: `202610120005_project_coordinator_options.sql`. Database test includes creating an assigned project as the coordinator lead and verifying coordinator membership, inside a rolled-back transaction.
