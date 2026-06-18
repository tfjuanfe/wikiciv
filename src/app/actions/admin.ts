"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { discordError, parseDate } from "@/lib/validation";
import type { SessionUser } from "@/lib/types";

export type AdminResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type DeleteResult = { ok: true } | { ok: false; error: string };

// Single archivist gate used by every action here. Returns the user on success
// so callers that need it (e.g. for audit logging) have it.
async function gateArchivist(): Promise<
  { ok: true; user: SessionUser } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!canReview(user) || !user)
    return { ok: false, error: "Archivists only." };
  return { ok: true, user };
}

export interface ServerInput {
  name: string;
  description: string;
  discordUrl: string;
}

export async function createServer(input: ServerInput): Promise<AdminResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return { ok: false, error: gate.error };
  if (input.name.trim().length < 2)
    return { ok: false, error: "Server name is too short." };
  if (input.name.trim().length > 200)
    return { ok: false, error: "Server name is too long." };
  if ((input.description ?? "").length > 5000)
    return { ok: false, error: "Description is too long (5000 characters max)." };
  const dErr = discordError(input.discordUrl, false);
  if (dErr) return { ok: false, error: dErr };

  const server = await prisma.server.create({
    data: {
      name: input.name.trim(),
      description: input.description.trim(),
      discordUrl: input.discordUrl.trim(),
    },
  });
  revalidatePath("/");
  return { ok: true, id: server.id };
}

export async function updateServer(
  id: string,
  input: ServerInput,
): Promise<AdminResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return { ok: false, error: gate.error };
  if (input.name.trim().length < 2)
    return { ok: false, error: "Server name is too short." };
  if (input.name.trim().length > 200)
    return { ok: false, error: "Server name is too long." };
  if ((input.description ?? "").length > 5000)
    return { ok: false, error: "Description is too long (5000 characters max)." };
  const dErr = discordError(input.discordUrl, false);
  if (dErr) return { ok: false, error: dErr };

  await prisma.server.update({
    where: { id },
    data: {
      name: input.name.trim(),
      description: input.description.trim(),
      discordUrl: input.discordUrl.trim(),
    },
  });
  revalidatePath("/");
  revalidatePath(`/servers/${id}`);
  return { ok: true, id };
}

export interface EventInput {
  serverId: string;
  name: string;
  theme: string;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd or ""
  status: "upcoming" | "ongoing" | "concluded";
  description: string;
  discordUrl: string;
}

function validateEvent(input: EventInput): string | null {
  if (input.name.trim().length < 2) return "Event name is too short.";
  if (input.name.trim().length > 200) return "Event name is too long.";
  if ((input.theme ?? "").length > 200) return "Theme is too long.";
  if ((input.description ?? "").length > 5000)
    return "Description is too long (5000 characters max).";
  if (
    input.status !== "upcoming" &&
    input.status !== "ongoing" &&
    input.status !== "concluded"
  )
    return "Unknown status.";
  const discord = (input.discordUrl ?? "").trim();
  if (discord) {
    if (discord.length > 500) return "Discord link is too long.";
    if (!/^https?:\/\//i.test(discord))
      return "Discord link must start with http:// or https://.";
  }
  const start = parseDate(input.startDate);
  if (!start) return "A valid start date is required.";
  const end = parseDate(input.endDate);
  if (end && end < start) return "End date cannot be before the start date.";
  if (input.status === "concluded" && !end)
    return "A concluded event needs an end date.";
  return null;
}

export async function createEvent(input: EventInput): Promise<AdminResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return { ok: false, error: gate.error };

  const problem = validateEvent(input);
  if (problem) return { ok: false, error: problem };

  const server = await prisma.server.findUnique({
    where: { id: input.serverId },
  });
  if (!server) return { ok: false, error: "That server no longer exists." };

  const event = await prisma.event.create({
    data: {
      serverId: input.serverId,
      name: input.name.trim(),
      theme: input.theme.trim(),
      startDate: parseDate(input.startDate)!,
      endDate: parseDate(input.endDate),
      status: input.status,
      description: input.description.trim(),
      discordUrl: input.discordUrl.trim(),
    },
  });
  revalidatePath("/");
  revalidatePath("/upcoming");
  revalidatePath(`/servers/${input.serverId}`);
  return { ok: true, id: event.id };
}

export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<AdminResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return { ok: false, error: gate.error };

  const problem = validateEvent(input);
  if (problem) return { ok: false, error: problem };

  const event = await prisma.event.update({
    where: { id },
    data: {
      name: input.name.trim(),
      theme: input.theme.trim(),
      startDate: parseDate(input.startDate)!,
      endDate: parseDate(input.endDate),
      status: input.status,
      description: input.description.trim(),
      discordUrl: input.discordUrl.trim(),
    },
  });
  revalidatePath("/");
  revalidatePath("/upcoming");
  revalidatePath(`/servers/${event.serverId}`);
  revalidatePath(`/events/${id}`);
  return { ok: true, id };
}

// Hard-delete an event and everything filed under it (cascades to entries,
// evidence, revisions). Archivist only. The audit log entry survives.
export async function deleteEvent(eventId: string): Promise<DeleteResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { ok: false, error: "Event not found." };

  await prisma.event.delete({ where: { id: eventId } });

  await logAudit({
    action: "deleted_event",
    actorId: gate.user.id,
    actorName: gate.user.username,
    targetType: "event",
    targetId: event.id,
    targetName: event.name,
  });

  revalidatePath("/");
  revalidatePath(`/servers/${event.serverId}`);
  return { ok: true };
}

// Hard-delete a server and all its events/entries (cascade). Archivist only.
export async function deleteServer(serverId: string): Promise<DeleteResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) return { ok: false, error: "Server not found." };

  await prisma.server.delete({ where: { id: serverId } });

  await logAudit({
    action: "deleted_server",
    actorId: gate.user.id,
    actorName: gate.user.username,
    targetType: "server",
    targetId: server.id,
    targetName: server.name,
  });

  revalidatePath("/");
  return { ok: true };
}
