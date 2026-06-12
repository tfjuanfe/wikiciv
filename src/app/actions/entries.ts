"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  canContribute,
  canContributeNow,
  canEditEntry,
  resolveSubmissionStatus,
  VERIFY_EMAIL_MESSAGE,
} from "@/lib/permissions";
import { INFOBOX_FIELDS, isEntryType } from "@/lib/templates";
import { rateLimit, retryMessage } from "@/lib/ratelimit";
import { subjectKey } from "@/lib/subjects";
import type { EntryType, Layer } from "@/lib/types";

// Field length caps to keep payloads sane and block abuse.
const LIMITS = {
  name: 200,
  attributedTo: 200,
  body: 20000,
  infoboxValue: 500,
  evidenceItems: 20,
  evidenceUrl: 2000,
  evidenceCaption: 300,
};

export interface EvidenceInput {
  url: string;
  caption?: string;
}

export interface EntryInput {
  eventId: string;
  type: EntryType;
  layer: Layer;
  name: string;
  attributedTo?: string;
  body: string;
  infobox: Record<string, string>;
  evidence: EvidenceInput[];
  asDraft?: boolean;
}

export type EntryResult =
  | { ok: true; id: string; status: string }
  | { ok: false; error: string };

// Keep only the infobox keys defined for this type, trimmed.
function cleanInfobox(type: EntryType, raw: Record<string, string>): string {
  const out: Record<string, string> = {};
  for (const field of INFOBOX_FIELDS[type]) {
    const v = (raw?.[field.key] ?? "").trim();
    if (v) out[field.key] = v;
  }
  return JSON.stringify(out);
}

function cleanEvidence(evidence: EvidenceInput[]): EvidenceInput[] {
  return (evidence ?? [])
    .map((e) => ({ url: (e.url ?? "").trim(), caption: (e.caption ?? "").trim() }))
    .filter((e) => e.url.length > 0);
}

function validate(input: EntryInput, evidence: EvidenceInput[]): string | null {
  if (!isEntryType(input.type)) return "Unknown entry type.";
  if (input.layer !== "record" && input.layer !== "account")
    return "Unknown layer.";
  if (!input.name || input.name.trim().length < 2)
    return "Please give the entry a name.";
  if (input.name.trim().length > LIMITS.name)
    return `Name is too long (${LIMITS.name} characters max).`;
  if ((input.attributedTo ?? "").length > LIMITS.attributedTo)
    return "Attribution is too long.";
  if (input.layer === "account" && !(input.attributedTo ?? "").trim())
    return "Accounts must be attributed to a player or faction.";
  if ((input.body ?? "").length > LIMITS.body)
    return `Body is too long (${LIMITS.body.toLocaleString()} characters max).`;
  for (const v of Object.values(input.infobox ?? {})) {
    if (typeof v === "string" && v.length > LIMITS.infoboxValue)
      return `An infobox field is too long (${LIMITS.infoboxValue} characters max).`;
  }
  if (evidence.length > LIMITS.evidenceItems)
    return `Too many evidence items (${LIMITS.evidenceItems} max).`;
  for (const e of evidence) {
    if (e.url.length > LIMITS.evidenceUrl) return "An evidence URL is too long.";
    // Only allow http(s) links. Blocks javascript:/data: URLs that would
    // otherwise render as a clickable <a href> on the entry page (stored XSS).
    if (!/^https?:\/\//i.test(e.url))
      return "Evidence links must start with http:// or https://.";
    if ((e.caption ?? "").length > LIMITS.evidenceCaption)
      return "An evidence caption is too long.";
  }
  if (input.layer === "record" && !input.asDraft && evidence.length === 0)
    return "Record entries require at least one piece of evidence (an image or source URL).";
  return null;
}

export async function createEntry(input: EntryInput): Promise<EntryResult> {
  const user = await getCurrentUser();
  if (!canContribute(user) || !user)
    return { ok: false, error: "You must be a contributor to add entries." };
  if (!canContributeNow(user))
    return { ok: false, error: VERIFY_EMAIL_MESSAGE };

  const rl = await rateLimit(`entry:${user.id}`, 20, 600);
  if (!rl.ok) return { ok: false, error: retryMessage(rl.retryAfter) };

  const evidence = cleanEvidence(input.evidence);
  const problem = validate(input, evidence);
  if (problem) return { ok: false, error: problem };

  const event = await prisma.event.findUnique({ where: { id: input.eventId } });
  if (!event) return { ok: false, error: "That event no longer exists." };

  const status = resolveSubmissionStatus(user, input.layer, !!input.asDraft);
  const infobox = cleanInfobox(input.type, input.infobox);
  const body = input.body ?? "";

  const entry = await prisma.entry.create({
    data: {
      eventId: input.eventId,
      type: input.type,
      layer: input.layer,
      name: input.name.trim(),
      attributedTo:
        input.layer === "account" ? (input.attributedTo ?? "").trim() : null,
      body,
      infobox,
      status,
      authorId: user.id,
      evidence: { create: evidence },
      revisions: {
        create: { body, infobox, editorId: user.id, note: "created" },
      },
    },
  });

  revalidatePath(`/events/${input.eventId}`);
  revalidatePath("/review");
  revalidatePath("/");
  return { ok: true, id: entry.id, status };
}

export async function updateEntry(
  entryId: string,
  input: Omit<EntryInput, "eventId">,
): Promise<EntryResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You must be logged in to edit." };
  if (!canContributeNow(user))
    return { ok: false, error: VERIFY_EMAIL_MESSAGE };

  const existing = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!existing) return { ok: false, error: "Entry not found." };
  if (!canEditEntry(user, existing))
    return { ok: false, error: "You can only edit your own entries." };

  // Type and layer are fixed once created; trust the stored values.
  const type = existing.type as EntryType;
  const layer = existing.layer as Layer;
  const fullInput: EntryInput = { ...input, eventId: existing.eventId, type, layer };

  const evidence = cleanEvidence(input.evidence);
  const problem = validate(fullInput, evidence);
  if (problem) return { ok: false, error: problem };

  const status = resolveSubmissionStatus(user, layer, !!input.asDraft);
  const infobox = cleanInfobox(type, input.infobox);
  const body = input.body ?? "";

  await prisma.$transaction([
    prisma.evidence.deleteMany({ where: { entryId } }),
    prisma.entry.update({
      where: { id: entryId },
      data: {
        name: input.name.trim(),
        attributedTo:
          layer === "account" ? (input.attributedTo ?? "").trim() : null,
        body,
        infobox,
        status,
        // Resubmitting clears any prior "changes requested" feedback.
        reviewFeedback: null,
        reviewFeedbackAt: null,
        evidence: { create: evidence },
        revisions: {
          create: { body, infobox, editorId: user.id, note: "edited" },
        },
      },
    }),
  ]);

  // Stars/comments hang off the subjectKey (eventId::type::name). If this edit
  // renamed the subject, those rows would be orphaned. When no other entry
  // remains under the old name, move them to the new subject so they follow the
  // rename. Best-effort: a rare unique collision must not fail the edit itself.
  const newName = input.name.trim();
  const oldKey = subjectKey(existing.eventId, type, existing.name);
  const newKey = subjectKey(existing.eventId, type, newName);
  if (oldKey !== newKey) {
    try {
      const remaining = await prisma.entry.count({
        where: {
          id: { not: entryId },
          eventId: existing.eventId,
          type,
          name: { equals: existing.name, mode: "insensitive" },
        },
      });
      if (remaining === 0) {
        await prisma.$transaction([
          prisma.star.updateMany({
            where: { subjectKey: oldKey },
            data: { subjectKey: newKey },
          }),
          prisma.comment.updateMany({
            where: { subjectKey: oldKey },
            data: { subjectKey: newKey },
          }),
        ]);
      }
    } catch {
      // Leave the social rows under the old key rather than break the edit.
    }
  }

  revalidatePath(`/entries/${entryId}`);
  revalidatePath(`/events/${existing.eventId}`);
  revalidatePath("/review");
  return { ok: true, id: entryId, status };
}
