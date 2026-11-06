# Projects, sales booking, client links and work timers

Apply migrations 202611060001 through 202611060003 in order before releasing this frontend. They add the Rejected status and client links, preserve the original sales completion timestamp, and align the timer with owned open task assignments. Rejected projects have no rate and are omitted from sales totals. Project dates and assignment visibility still follow existing role permissions.

Rework should stay under the original project ID. A sale already booked in October remains in October if work resumes in November. The migration retains existing booking dates; it cannot reconstruct a date that was cleared or overwritten before this change. Review those older records against the original sales report before correcting them.

Projects opens on All dates; narrower dates are optional. Planner is hidden from workspace access and dashboard shortcuts. Client links accept up to 20 HTTP(S) URLs, one per line.
