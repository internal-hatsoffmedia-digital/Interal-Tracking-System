export function isClientLink(value: string): boolean {
  if (value.length > 2048 || !/^https?:\/\/[^\s]+$/i.test(value)) return false;
  try {
    const url = new URL(value);
    return !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const clientSocialFields = [
  ['facebook_link','FB Link'], ['instagram_link','Insta Link'], ['youtube_link','YouTube Link'],
] as const;
export function clientSocialPatch(input: Partial<Record<(typeof clientSocialFields)[number][0],string|null>>) {
  const patch: Record<string,string|null> = {};
  for (const [field,label] of clientSocialFields) {
    if (input[field] === undefined) continue;
    const value = input[field]?.trim() || null;
    if (value && !isClientLink(value)) throw new Error(label+': enter a valid HTTP or HTTPS link.');
    patch[field] = value;
  }
  return patch;
}

export const clientLeadSources=[['field','Field visit'],['campaign','Campaign'],['cold_call','Cold call'],['message','Message']] as const;
export function validLeadSource(value:string|null|undefined){return value==null||clientLeadSources.some(([key])=>key===value);}
