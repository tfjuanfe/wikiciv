"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isValidEmail, normalizeEmail, sendVerificationEmail } from "@/lib/email";
import { issueVerificationToken, consumeVerificationToken } from "@/lib/verification";
import { rateLimit, retryMessage } from "@/lib/ratelimit";

export type VerifyResult = { ok: true } | { ok: false; error: string };

// Set (or change) the current user's email and send a verification link.
// The email is stored unverified until the link is clicked.
export async function setEmailAndSendVerification(
  rawEmail: string,
): Promise<VerifyResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You must be logged in." };

  const rl = await rateLimit(`verify:${user.id}`, 5, 600);
  if (!rl.ok) return { ok: false, error: retryMessage(rl.retryAfter) };

  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email))
    return { ok: false, error: "Please enter a valid email address." };

  if (user.email === email && user.emailVerified)
    return { ok: false, error: "That email is already verified." };

  // Block taking an address already VERIFIED by someone else. An address only
  // held unverified by another account (a squatter) is released here, so it
  // can't be used to permanently lock out the real owner.
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken && taken.id !== user.id) {
    if (taken.emailVerified)
      return { ok: false, error: "That email is already in use by another account." };
    await prisma.user.update({ where: { id: taken.id }, data: { email: null } });
  }

  // Store the (unverified) email so the account reflects the pending address.
  await prisma.user.update({
    where: { id: user.id },
    data: { email, emailVerified: false },
  });

  const link = await issueVerificationToken(user.id, email);
  const sent = await sendVerificationEmail(email, link);
  if (!sent.ok) return { ok: false, error: sent.error ?? "Could not send email." };

  revalidatePath("/me");
  return { ok: true };
}

// Resend a verification link to the user's current (unverified) email.
export async function resendVerification(): Promise<VerifyResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You must be logged in." };
  if (!user.email)
    return { ok: false, error: "Add an email address first." };
  if (user.emailVerified)
    return { ok: false, error: "Your email is already verified." };

  const rl = await rateLimit(`verify:${user.id}`, 5, 600);
  if (!rl.ok) return { ok: false, error: retryMessage(rl.retryAfter) };

  const link = await issueVerificationToken(user.id, user.email);
  const sent = await sendVerificationEmail(user.email, link);
  if (!sent.ok) return { ok: false, error: sent.error ?? "Could not send email." };

  return { ok: true };
}

// Consume a token from the confirm page. Revalidates so the freshly-verified
// state shows everywhere.
export async function confirmEmail(token: string): Promise<VerifyResult> {
  const result = await consumeVerificationToken(token);
  if (!result.ok) return result;

  revalidatePath("/", "layout");
  revalidatePath("/me");
  return { ok: true };
}
