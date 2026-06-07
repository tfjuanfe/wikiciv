"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
