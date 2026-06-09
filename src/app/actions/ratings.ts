"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canContributeNow, VERIFY_EMAIL_MESSAGE } from "@/lib/permissions";
import { isValidRating } from "@/lib/ratings";
import { rateLimit, retryMessage } from "@/lib/ratelimit";

export type RateResult =
  | { ok: true; average: number | null; count: number; userValue: number }
  | { ok: false; error: string };

// Set, change, or clear the current user's rating of an event. Passing the same
// value they already gave clears it (toggle off), mirroring the star button.
// Upcoming events can't be rated — there's nothing to judge yet.
export async function rateEvent(
  eventId: string,
  value: number,
): Promise<RateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in to rate events." };
  if (!canContributeNow(user))
    return { ok: false, error: VERIFY_EMAIL_MESSAGE };
  if (!isValidRating(value))
    return { ok: false, error: "Invalid rating." };

  const rl = await rateLimit(`rateevent:${user.id}`, 40, 60);
  if (!rl.ok) return { ok: false, error: retryMessage(rl.retryAfter) };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true },
  });
  if (!event) return { ok: false, error: "That event no longer exists." };
  if (event.status === "upcoming")
    return {
      ok: false,
      error: "You can only rate events that have started.",
    };

  const existing = await prisma.eventRating.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });

  let userValue = value;
  if (existing && existing.value === value) {
    await prisma.eventRating.delete({ where: { id: existing.id } });
    userValue = 0;
  } else {
    await prisma.eventRating.upsert({
      where: { eventId_userId: { eventId, userId: user.id } },
      create: { eventId, userId: user.id, value },
      update: { value },
    });
  }

  const agg = await prisma.eventRating.aggregate({
    where: { eventId },
    _avg: { value: true },
    _count: { value: true },
  });

  revalidatePath("/ratings");
  revalidatePath(`/events/${eventId}`);
  return {
    ok: true,
    average: agg._avg.value,
    count: agg._count.value,
    userValue,
  };
}
