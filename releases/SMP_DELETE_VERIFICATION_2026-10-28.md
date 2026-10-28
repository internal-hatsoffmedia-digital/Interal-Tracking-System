# SMP project deletion — 28 October 2026

The SMP & EXP Projects finance table previously continued to display deleted projects as ordinary rows, since finance data preserves historical records. It also lacked a direct delete action.

The table now hides deleted work by default. Admin and Manager get direct Delete project actions using the existing confirmation and recoverable database RPC. Show deleted projects exposes archived rows and Restore project. Other roles have no delete/restore controls. Successful deletion refreshes the finance view. Recorded financial history is preserved.

Verification: seven targeted UI/finance tests passed, covering the direct action, permission-controlled rendering, hiding deleted rows, restore labels and preserved revenue. The existing database permission checks remain unchanged.

At the user's request, HMOCT26808 and HMOCT26809 (Collabkit Studio / Actuals - Shoot) were checked live. HMOCT26808 was already inactive. HMOCT26809 was changed from active to inactive using the Admin recoverable-delete action. Both are now deleted/recoverable. Task and timer counts were checked before and after and are unchanged. No hard deletion was performed.
