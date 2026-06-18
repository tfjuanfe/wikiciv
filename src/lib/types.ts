export type Role = "reader" | "contributor" | "archivist";
export type EntryType =
  | "civilization"
  | "character"
  | "war"
  | "place"
  | "artifact";
export type Layer = "record" | "account";
export type EntryStatus = "draft" | "pending" | "published";
export type EventStatus = "upcoming" | "ongoing" | "concluded";

export interface SessionUser {
  id: string;
  username: string;
  role: Role;
  trusted: boolean;
  eventHost: boolean;
  email: string | null;
  emailVerified: boolean;
}

export type RequestStatus = "pending" | "approved" | "rejected";

export type Infobox = Record<string, string>;

export function parseInfobox(raw: string | null | undefined): Infobox {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Infobox;
    }
  } catch {
    // fall through to empty infobox
  }
  return {};
}
