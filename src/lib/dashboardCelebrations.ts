export function studioDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export type BirthdayWish = {id:string;announcementId:string;day:string;author:string;text:string};
export function validBirthdayWish(value:unknown, announcementId:string, day:string): value is BirthdayWish {
  if(!value||typeof value!=='object')return false;
  const wish=value as BirthdayWish;
  return typeof wish.id==='string'&&wish.id.length<=80&&wish.announcementId===announcementId&&wish.day===day&&
    typeof wish.author==='string'&&wish.author.trim().length>0&&wish.author.length<=100&&
    typeof wish.text==='string'&&wish.text.trim().length>0&&wish.text.length<=280;
}
