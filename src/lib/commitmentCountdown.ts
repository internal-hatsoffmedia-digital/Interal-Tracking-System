export type DeadlineStage = 'hour' | 'ten_minutes' | 'ended';
export const deadlineStageRank: Record<DeadlineStage,number> = {hour:1,ten_minutes:2,ended:3};
export function deadlineStage(deadline: string | null | undefined, now: number): DeadlineStage | null {
  const end = deadline ? Date.parse(deadline) : NaN;
  if (!Number.isFinite(end)) return null;
  const remaining = end - now;
  return remaining <= 0 ? 'ended' : remaining <= 600000 ? 'ten_minutes' : remaining <= 3600000 ? 'hour' : null;
}
export function commitmentClosed(status: string | null | undefined, completedAt?: string | null) {
  return !!completedAt || ['completed','rejected','cancelled','approved'].includes((status ?? '').toLowerCase());
}
export function commitmentCountdown(deadline: string | null | undefined, now: number, status?: string, completedAt?: string | null): string {
  if (commitmentClosed(status,completedAt)) return status?.toLowerCase()==='rejected'?'Rejected':'Completed';
  const end = deadline ? Date.parse(deadline) : NaN;
  if (!Number.isFinite(end)) return 'No committed time';
  if (end <= now) return 'Time ended';
  const seconds = Math.ceil((end - now) / 1000);
  const days = Math.floor(seconds / 86400);
  const clock = [Math.floor(seconds % 86400 / 3600),Math.floor(seconds % 3600 / 60),seconds % 60].map(n=>String(n).padStart(2,'0')).join(':');
  return (days ? days+'d ' : '') + clock;
}
export function reminderKey(profileId:string, assignmentId:string, deadline:string) {
  return 'commitment-reminder:'+profileId+':'+assignmentId+':'+deadline;
}
export function nextReminder(deadline:string,now:number,seenRank:number):DeadlineStage|null {
  const stage=deadlineStage(deadline,now);
  return stage && deadlineStageRank[stage]>seenRank ? stage : null;
}
