"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export type AuthResult = { ok: true } | { ok: false; error: string };

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export async function register(
  username: string,
  password: string,
): Promise<AuthResult> {
  username = username.trim();
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: "Username must be 3–20 letters, numbers, or underscores.",
    };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { ok: false, error: "That username is already taken." };
  }

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      role: "contributor",
      trusted: false,
    },
  });

  await createSession(user.id);
  return { ok: true };
}

export async function login(
  username: string,
  password: string,
): Promise<AuthResult> {
  username = username.trim();
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: "Invalid username or password." };
  }

  await createSession(user.id);
  return { ok: true };
}

export async function logout(): Promise<void> {
  destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
