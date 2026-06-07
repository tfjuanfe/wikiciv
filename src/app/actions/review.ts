"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { formatDate } from "@/lib/format";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function ensureArchivist(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!canReview(user)) return { ok: false, error: "Archivists only." };
  return { ok: true };
}

export async function approveEntry(entryId: string): Promise<ActionResult> {
  const gate = await ensureArchivist();
  if (!gate.ok) return gate;

  await prisma.entry.update({
    where: { id: entryId },
    data: { status: "published" },
  });
  revalidatePath("/review");
  revalidatePath(`/entries/${entryId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function requestChanges(entryId: string): Promise<ActionResult> {
  const gate = await ensureArchivist();
  if (!gate.ok) return gate;

  // Send it back to the author as a draft rather than deleting it —
  // every telling keeps its home.
  await prisma.entry.update({
    where: { id: entryId },
    data: { status: "draft" },
  });
  revalidatePath("/review");
  return { ok: true };
}

// Mark conflicting Record claims as "disputed" instead of rejecting either one.
// Both stay published and are shown side by side.
export async function setDisputed(
  entryId: string,
  value: boolean,
): Promise<ActionResult> {
  const gate = await ensureArchivist();
  if (!gate.ok) return gate;

  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry) return { ok: false, error: "Entry not found." };

  await prisma.entry.update({
    where: { id: entryId },
    data: {
      disputed: value,
      // Disputing publishes the claim so both versions coexist.
      status: value && entry.status !== "published" ? "published" : entry.status,
    },
  });
  revalidatePath("/review");
  revalidatePath(`/entries/${entryId}`);
  return { ok: true };
}

export async function rollbackEntry(
  entryId: string,
  revisionId: string,
): Promise<ActionResult> {
  const gate = await ensureArchivist();
  if (!gate.ok) return gate;

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not logged in." };

  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
  });
  if (!revision || revision.entryId !== entryId)
    return { ok: false, error: "Revision not found for this entry." };

  // Non-destructive: restoring an old version creates a NEW revision.
  await prisma.entry.update({
    where: { id: entryId },
    data: {
      body: revision.body,
      infobox: revision.infobox,
      revisions: {
        create: {
          body: revision.body,
          infobox: revision.infobox,
          editorId: user.id,
          note: `rolled back to revision from ${formatDate(revision.createdAt)}`,
        },
      },
    },
  });

  revalidatePath(`/entries/${entryId}`);
  revalidatePath(`/entries/${entryId}/history`);
  return { ok: true };
}

export async function toggleTrusted(userId: string): Promise<ActionResult> {
  const gate = await ensureArchivist();
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
