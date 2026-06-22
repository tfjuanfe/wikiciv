"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  getCurrentUser,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { rateLimit, retryMessage } from "@/lib/ratelimit";

export type ProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(bio: string): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You must be logged in." };

  const clean = bio.trim();
  if (clean.length > 500)
    return { ok: false, error: "Bio is too long (500 characters max)." };

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { bio: clean },
    select: { username: true },
  });

  revalidatePath(`/users/${updated.username}`);
  return { ok: true };
}

// Change the signed-in user's password. Requires the current password so a
// hijacked-but-unlocked session can't silently lock the owner out.
export async function changePassword(
  current: string,
  next: string,
): Promise<ProfileResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: "You must be logged in." };

  const rl = await rateLimit(`pwchange:${session.id}`, 5, 600);
  if (!rl.ok) return { ok: false, error: retryMessage(rl.retryAfter) };

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { passwordHash: true },
  });
  if (!user) return { ok: false, error: "You must be logged in." };

  if (!(await verifyPassword(current, user.passwordHash)))
    return { ok: false, error: "Your current password is incorrect." };

  if (next.length < 8)
    return { ok: false, error: "New password must be at least 8 characters." };
  if (next.length > 200)
    return { ok: false, error: "New password is too long." };
  if (next === current)
    return {
      ok: false,
      error: "New password must be different from your current one.",
    };

  await prisma.user.update({
    where: { id: session.id },
    data: { passwordHash: await hashPassword(next) },
  });
  return { ok: true };
}

// Delete the signed-in user's account. Requires the password to confirm.
//
// Anonymize-and-keep: if the user has authored entries or revisions we keep
// the row (so "every telling has a home" still holds) but scrub all personal
// data and make the account unusable. Users who never contributed are removed
// outright — their stars/comments/ratings/tokens cascade away. Either way the
// session is destroyed.
export async function deleteAccount(password: string): Promise<ProfileResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: "You must be logged in." };

  const rl = await rateLimit(`pwdel:${session.id}`, 5, 600);
  if (!rl.ok) return { ok: false, error: retryMessage(rl.retryAfter) };

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { passwordHash: true },
  });
  if (!user) return { ok: false, error: "You must be logged in." };

  if (!(await verifyPassword(password, user.passwordHash)))
    return { ok: false, error: "Password is incorrect." };

  const [entries, revisions] = await Promise.all([
    prisma.entry.count({ where: { authorId: session.id } }),
    prisma.revision.count({ where: { editorId: session.id } }),
  ]);

  if (entries === 0 && revisions === 0) {
    await prisma.user.delete({ where: { id: session.id } });
  } else {
    // Keep authored content; strip everything that identifies the person and
    // set an unusable password so the account can never be logged into again.
    const handle = `deleted_${randomBytes(5).toString("hex")}`;
    const deadHash = await hashPassword(randomBytes(24).toString("hex"));
    await prisma.user.update({
      where: { id: session.id },
      data: {
        username: handle,
        email: null,
        emailVerified: false,
        passwordHash: deadHash,
        bio: "",
        trusted: false,
        eventHost: false,
        role: "contributor",
      },
    });
  }

  destroySession();
  revalidatePath("/", "layout");
  return { ok: true };
}
