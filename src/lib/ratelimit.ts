import "server-only";
import { headers } from "next/headers";
import { prisma } from "./db";

// Best-effort client IP from proxy headers (Vercel sets x-forwarded-for).
export function clientIp(): string {
  const h = headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export type RateResult = { ok: true } | { ok: false; retryAfter: number };

// Fixed-window limiter backed by the database, so the count is shared across
// serverless instances. Fails open: if the limiter itself errors, the request
// is allowed (availability over strictness for an internal hiccup).
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.resetAt.getTime() <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt: new Date(now + windowMs) },
        update: { count: 1, resetAt: new Date(now + windowMs) },
      });
      return { ok: true };
    }

    if (existing.count >= limit) {
      return {
        ok: false,
        retryAfter: Math.max(
          1,
          Math.ceil((existing.resetAt.getTime() - now) / 1000),
        ),
      };
    }

    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

// Friendly "try again in ..." text.
export function retryMessage(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.ceil(seconds / 60);
    return `Too many attempts. Try again in about ${m} minute${m === 1 ? "" : "s"}.`;
  }
  return `Too many attempts. Try again in ${seconds} second${seconds === 1 ? "" : "s"}.`;
}
