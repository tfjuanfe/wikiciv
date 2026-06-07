"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { logAudit } from "@/lib/audit";
import type { SessionUser } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function gateArchivist(): Promise<
  { ok: true; user: SessionUser } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!canReview(user) || !user)
    return { ok: false, error: "Archivists only." };
  return { ok: true, user };
}

export async function approveEntry(entryId: string): Promise<ActionResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    include: { author: { select: { username: true } } },
  });
  if (!entry) return { ok: false, error: "Entry not found." };

  await prisma.entry.update({
    where: { id: entryId },
    data: { status: "published", reviewFeedback: null, reviewFeedbackAt: null },
  });

  await logAudit({
    action: "approved",
    actorId: gate.user.id,
    actorName: gate.user.username,
    targetType: "entry",
    targetId: entry.id,
    targetName: entry.name,
    authorName: entry.author.username,
  });

  revalidatePath("/review");
  revalidatePath(`/entries/${entryId}`);
  revalidatePath("/me");
  revalidatePath("/");
  return { ok: true };
}

export async function requestChanges(
  entryId: string,
  reason: string,
): Promise<ActionResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    include: { author: { select: { username: true } } },
  });
  if (!entry) return { ok: false, error: "Entry not found." };

  const message = reason.trim();

  // Send it back to the author as a draft instead of deleting it, and attach
  // the reason so they know what to fix.
  await prisma.entry.update({
    where: { id: entryId },
    data: {
      status: "draft",
      reviewFeedback: message || "Changes requested (no reason given).",
      reviewFeedbackAt: new Date(),
    },
  });

  await logAudit({
    action: "requested_changes",
    actorId: gate.user.id,
    actorName: gate.user.username,
    targetType: "entry",
    targetId: entry.id,
    targetName: entry.name,
    authorName: entry.author.username,
    reason: message || null,
  });

  revalidatePath("/review");
  revalidatePath("/me");
  return { ok: true };
}

// Mark conflicting Record claims as "disputed" instead of rejecting either one.
export async function setDisputed(
  entryId: string,
  value: boolean,
): Promise<ActionResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    include: { author: { select: { username: true } } },
  });
  if (!entry) return { ok: false, error: "Entry not found." };

  await prisma.entry.update({
    where: { id: entryId },
    data: {
      disputed: value,
      status: value && entry.status !== "published" ? "published" : entry.status,
    },
  });

  await logAudit({
    action: value ? "disputed" : "undisputed",
    actorId: gate.user.id,
    actorName: gate.user.username,
    targetType: "entry",
    targetId: entry.id,
    targetName: entry.name,
    authorName: entry.author.username,
  });

  revalidatePath("/review");
  revalidatePath(`/entries/${entryId}`);
  revalidatePath("/me");
  return { ok: true };
}

export async function rollbackEntry(
  entryId: string,
  revisionId: string,
): Promise<ActionResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
  });
  if (!revision || revision.entryId !== entryId)
    return { ok: false, error: "Revision not found for this entry." };

  const entry = await prisma.entry.update({
    where: { id: entryId },
    data: {
      body: revision.body,
      infobox: revision.infobox,
      revisions: {
        create: {
          body: revision.body,
          infobox: revision.infobox,
          editorId: gate.user.id,
          note: `rolled back to revision from ${formatDate(revision.createdAt)}`,
        },
      },
    },
  });

  await logAudit({
    action: "rolled_back",
    actorId: gate.user.id,
    actorName: gate.user.username,
    targetType: "entry",
    targetId: entry.id,
    targetName: entry.name,
    reason: `to revision from ${formatDate(revision.createdAt)}`,
  });

  revalidatePath(`/entries/${entryId}`);
  revalidatePath(`/entries/${entryId}/history`);
  return { ok: true };
}

export async function toggleTrusted(userId: string): Promise<ActionResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "User not found." };

  await prisma.user.update({
    where: { id: userId },
    data: { trusted: !target.trusted },
  });
  revalidatePath("/review");
  return { ok: true };
}

// Hard-delete an entry (archivist moderation tool, e.g. spam/abuse).
// Cascades to its evidence and revisions; the audit log entry survives.
export async function deleteEntry(entryId: string): Promise<ActionResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    include: { author: { select: { username: true } } },
  });
  if (!entry) return { ok: false, error: "Entry not found." };

  await prisma.entry.delete({ where: { id: entryId } });

  await logAudit({
    action: "deleted_entry",
    actorId: gate.user.id,
    actorName: gate.user.username,
    targetType: "entry",
    targetId: entry.id,
    targetName: entry.name,
    authorName: entry.author.username,
  });

  revalidatePath("/review");
  revalidatePath(`/events/${entry.eventId}`);
  revalidatePath("/me");
  revalidatePath("/");
  return { ok: true };
}
