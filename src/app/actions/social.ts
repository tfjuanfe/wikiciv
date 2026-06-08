"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canReview, canContributeNow, VERIFY_EMAIL_MESSAGE } from "@/lib/permissions";
import { rateLimit, retryMessage } from "@/lib/ratelimit";

export type StarResult =
  | { ok: true; starred: boolean; count: number }
  | { ok: false; error: string };

export type CommentResult = { ok: true } | { ok: false; error: string };

const COMMENT_MAX = 2000;

// Toggle the current user's star on a subject. Returns the new state + count.
export async function toggleStar(subjectKey: string): Promise<StarResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in to star articles." };
  if (!canContributeNow(user))
    return { ok: false, error: VERIFY_EMAIL_MESSAGE };

  const rl = await rateLimit(`star:${user.id}`, 40, 60);
  if (!rl.ok) return { ok: false, error: retryMessage(rl.retryAfter) };

  const existing = await prisma.star.findUnique({
    where: { subjectKey_userId: { subjectKey, userId: user.id } },
  });

  let starred: boolean;
  if (existing) {
    await prisma.star.delete({ where: { id: existing.id } });
    starred = false;
  } else {
    await prisma.star.create({ data: { subjectKey, userId: user.id } });
    starred = true;
  }

  const count = await prisma.star.count({ where: { subjectKey } });
  revalidatePath("/popular");
  return { ok: true, starred, count };
}

export async function addComment(
  subjectKey: string,
  body: string,
): Promise<CommentResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in to comment." };
  if (!canContributeNow(user))
    return { ok: false, error: VERIFY_EMAIL_MESSAGE };

  const rl = await rateLimit(`comment:${user.id}`, 10, 300);
  if (!rl.ok) return { ok: false, error: retryMessage(rl.retryAfter) };

  const clean = body.trim();
  if (clean.length === 0)
    return { ok: false, error: "Comment can't be empty." };
  if (clean.length > COMMENT_MAX)
    return {
      ok: false,
      error: `Comment is too long (${COMMENT_MAX} characters max).`,
    };

  await prisma.comment.create({
    data: { subjectKey, authorId: user.id, body: clean },
  });
  return { ok: true };
}

// Delete a comment. Allowed for its author or any archivist.
export async function deleteComment(commentId: string): Promise<CommentResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You must be logged in." };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });
  if (!comment) return { ok: false, error: "Comment not found." };

  if (comment.authorId !== user.id && !canReview(user))
    return { ok: false, error: "You can only delete your own comments." };

  await prisma.comment.delete({ where: { id: commentId } });
  return { ok: true };
}
