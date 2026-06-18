// Shared, framework-agnostic validators. Plain module (no "use server") so it
// can be imported by both server actions and other code.

// Validate a Discord (or other) invite URL. Required for event-host
// submissions, optional when an archivist creates directly.
export function discordError(url: string, required: boolean): string | null {
  const d = (url ?? "").trim();
  if (!d) return required ? "A Discord link is required." : null;
  if (d.length > 500) return "Discord link is too long.";
  if (!/^https?:\/\//i.test(d))
    return "Discord link must start with http:// or https://.";
  return null;
}

// Parse a yyyy-mm-dd value into a Date at local midnight, or null if invalid.
export function parseDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}
