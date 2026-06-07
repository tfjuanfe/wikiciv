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

export function canContribute(user: SessionUser | null): boolean {
  return user?.role === "contributor" || user?.role === "archivist";
}
