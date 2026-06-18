import type { EntryStatus, Layer, SessionUser } from "./types";

// Decide the publish status of a submission, encoding the review rules:
//
//   - archivists publish directly
//   - RECORD-layer entries ALWAYS go through review (status "pending")
//   - trusted contributors auto-publish ACCOUNT-layer entries
//   - everyone else lands in the review queue
//
// `asDraft` lets an author deliberately park work as a draft.
export function resolveSubmissionStatus(
  user: SessionUser,
  layer: Layer,
  asDraft: boolean,
): EntryStatus {
  if (asDraft) return "draft";
  if (user.role === "archivist") return "published";
  if (layer === "record") return "pending";
  if (layer === "account" && user.trusted) return "published";
  return "pending";
}

export function canEditEntry(
  user: SessionUser | null,
  entry: { authorId: string },
): boolean {
  if (!user) return false;
  if (user.role === "archivist") return true;
  return entry.authorId === user.id;
}

export function canReview(user: SessionUser | null): boolean {
  return user?.role === "archivist";
}

// Whether a user may submit servers/events for review. Archivists can always do
// this (they also create directly); event hosts submit requests.
export function canHostEvents(user: SessionUser | null): boolean {
  return !!user && (user.eventHost || user.role === "archivist");
}

export function canContribute(user: SessionUser | null): boolean {
  return user?.role === "contributor" || user?.role === "archivist";
}

// Whether a user may take a contributing action RIGHT NOW. Contributing
// (creating/editing entries, commenting, starring) requires a verified email.
// Readers and unverified users can still browse.
export function canContributeNow(user: SessionUser | null): boolean {
  return canContribute(user) && !!user?.emailVerified;
}

export const VERIFY_EMAIL_MESSAGE =
  "Verify your email before contributing. Add or confirm your email on your My Contributions page.";
