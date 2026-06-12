import { prisma } from "./db";
import type { EntryType } from "./types";

// A "subject" (one civilization, character, war, place, or artifact) is the set
// of entries that share the same event, type, and name. The Record layer and
// every Account about that subject live under the same key. There is no
// subjectId column by design — grouping by (eventId, type, name) keeps the data
// model exactly as specified while still letting record + accounts share a home.
export function subjectKey(eventId: string, type: string, name: string): string {
  return `${eventId}::${type}::${name.trim().toLowerCase()}`;
}

export function nameMatches(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// Whether a subjectKey corresponds to a real, PUBLISHED subject. Stars and
// comments are keyed by this string and come straight from the client, so we
// verify the subject exists before writing — otherwise anyone could fabricate
// stars/comments on arbitrary keys and inflate the "popular" list.
export async function subjectExists(key: string): Promise<boolean> {
  // Key shape is `eventId::type::name`. Names may contain "::", so keep the
  // first two segments fixed and treat the remainder as the (lowercased) name.
  const parts = key.split("::");
  if (parts.length < 3) return false;
  const [eventId, type] = parts;
  if (!eventId || !type) return false;

  const candidates = await prisma.entry.findMany({
    where: { eventId, type, status: "published" },
    select: { name: true },
  });
  return candidates.some((c) => subjectKey(eventId, type, c.name) === key);
}

export interface SubjectEntries {
  records: EntryWithRelations[];
  accounts: EntryWithRelations[];
  anyDisputed: boolean;
}

export type EntryWithRelations = Awaited<
  ReturnType<typeof prisma.entry.findFirstOrThrow>
> & {
  author: { id: string; username: string; trusted: boolean };
  evidence: { id: string; url: string; caption: string | null }[];
};

// Load all PUBLISHED entries belonging to the same subject as `anchor`,
// split into the record and account layers.
export async function loadSubject(anchor: {
  eventId: string;
  type: string;
  name: string;
}): Promise<SubjectEntries> {
  const candidates = await prisma.entry.findMany({
    where: {
      eventId: anchor.eventId,
      type: anchor.type,
      status: "published",
    },
    include: {
      author: { select: { id: true, username: true, trusted: true } },
      evidence: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const same = candidates.filter((e) => nameMatches(e.name, anchor.name));
  const records = same.filter((e) => e.layer === "record");
  const accounts = same.filter((e) => e.layer === "account");
  const anyDisputed = records.some((e) => e.disputed);

  return { records, accounts, anyDisputed } as SubjectEntries;
}

export const TYPE_FROM_STRING = (t: string): EntryType => t as EntryType;
