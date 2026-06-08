import "server-only";
import { randomBytes, createHash } from "crypto";
import { prisma } from "./db";
import { getBaseUrl } from "./email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Create a fresh single-use token for verifying `email` on behalf of `userId`,
// replacing any previous outstanding tokens for that user. Returns the absolute
// link to email. Only the hash is persisted.
export async function issueVerificationToken(
  userId: string,
  email: string,
): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: { userId, email, tokenHash, expiresAt },
    }),
  ]);

  return `${getBaseUrl()}/verify-email?token=${raw}`;
}

export type ConsumeResult =
  | { ok: true; username: string }
  | { ok: false; error: string };

// Validate a raw token, and if good mark the user's email verified and delete
// the token (single use). Idempotent-ish: a consumed token simply reads as
// invalid on a second click.
export async function consumeVerificationToken(
  raw: string,
): Promise<ConsumeResult> {
  if (!raw || raw.length < 16)
    return { ok: false, error: "Invalid verification link." };

  const tokenHash = hashToken(raw);
  const token = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });

  if (!token)
    return {
      ok: false,
      error: "This verification link is invalid or has already been used.",
    };

  if (token.expiresAt.getTime() <= Date.now()) {
    await prisma.emailVerificationToken.delete({ where: { id: token.id } });
    return {
      ok: false,
      error: "This verification link has expired. Request a new one.",
    };
  }

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { email: token.email, emailVerified: true },
      select: { username: true },
    }),
    prisma.emailVerificationToken.delete({ where: { id: token.id } }),
  ]);

  return { ok: true, username: user.username };
}
