/** Supabase/PostgREST errors can be plain objects rather than Error instances. */
export function errorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) return fallback;
  const value = error as { message?: unknown; code?: unknown };
  if (typeof value.message !== "string" || !value.message.trim()) return fallback;
  const code = typeof value.code === "string" && value.code.trim() ? ` (${value.code})` : "";
  return `${value.message}${code}`;
}
