/** Presentation-only routing. Dashboard and Team PC intentionally keep their existing UI. */
export function isRefreshedWorkspacePage(pathname:string):boolean {
 const page=pathname.split('/').filter(Boolean)[0];
 return ['reports','performance','my-work','tasks','task-assignments','projects','clients','employees','teams','team-members','my-team','timesheet','sales','settings','access','daily-desk'].includes(page);
}
