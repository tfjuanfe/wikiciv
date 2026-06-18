"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canHostEvents, canReview } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { rateLimit, retryMessage } from "@/lib/ratelimit";
import { discordError, parseDate } from "@/lib/validation";
import type { SessionUser } from "@/lib/types";

export type RequestResult =
  | { ok: true; id: string }
  | { ok: false; error: string };
export type ReviewResult = { ok: true } | { ok: false; error: string };

const STATUSES = ["upcoming", "ongoing", "concluded"] as const;
type EventStatusValue = (typeof STATUSES)[number];

export interface ServerRequestInput {
  name: string;
  description: string;
  discordUrl: string;
}

export interface EventRequestInput {
  serverId: string; // "" when proposing a new server
  proposedServerName: string;
  name: string;
  theme: string;
  startDate: string;
  endDate: string;
  status: EventStatusValue;
  description: string;
  discordUrl: string;
}

async function gateHost(): Promise<
  { ok: true; user: SessionUser } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!canHostEvents(user) || !user)
    return { ok: false, error: "Only event hosts can submit servers or events." };
  return { ok: true, user };
}

async function gateArchivist(): Promise<
  { ok: true; user: SessionUser } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!canReview(user) || !user)
    return { ok: false, error: "Archivists only." };
  return { ok: true, user };
}

// ---------- Submissions (event hosts) ----------

export async function requestServer(
  input: ServerRequestInput,
): Promise<RequestResult> {
  const gate = await gateHost();
  if (!gate.ok) return gate;

  const rl = await rateLimit(`req-server:${gate.user.id}`, 10, 3600);
  if (!rl.ok) return { ok: false, error: retryMessage(rl.retryAfter) };

  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Server name is too short." };
  if (name.length > 200) return { ok: false, error: "Server name is too long." };
  if ((input.description ?? "").length > 5000)
    return { ok: false, error: "Description is too long (5000 characters max)." };
  const dErr = discordError(input.discordUrl, true);
  if (dErr) return { ok: false, error: dErr };

  const req = await prisma.serverRequest.create({
    data: {
      name,
      description: input.description.trim(),
      discordUrl: input.discordUrl.trim(),
      requesterId: gate.user.id,
    },
  });

  revalidatePath("/review");
  return { ok: true, id: req.id };
}

export async function requestEvent(
  input: EventRequestInput,
): Promise<RequestResult> {
  const gate = await gateHost();
  if (!gate.ok) return gate;

  const rl = await rateLimit(`req-event:${gate.user.id}`, 20, 3600);
  if (!rl.ok) return { ok: false, error: retryMessage(rl.retryAfter) };

  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Event name is too short." };
  if (name.length > 200) return { ok: false, error: "Event name is too long." };
  if ((input.theme ?? "").length > 200)
    return { ok: false, error: "Theme is too long." };
  if ((input.description ?? "").length > 5000)
    return { ok: false, error: "Description is too long (5000 characters max)." };
  if (!STATUSES.includes(input.status))
    return { ok: false, error: "Unknown status." };
  const dErr = discordError(input.discordUrl, true);
  if (dErr) return { ok: false, error: dErr };

  const start = parseDate(input.startDate);
  if (!start) return { ok: false, error: "A valid start date is required." };
  const end = parseDate(input.endDate);
  if (end && end < start)
    return { ok: false, error: "End date cannot be before the start date." };
  if (input.status === "concluded" && !end)
    return { ok: false, error: "A concluded event needs an end date." };

  // Resolve which server this attaches to: an existing one, or a proposed name.
  let serverId: string | null = null;
  let proposedServerName: string | null = null;
  if (input.serverId) {
    const server = await prisma.server.findUnique({
      where: { id: input.serverId },
      select: { id: true },
    });
    if (!server) return { ok: false, error: "That server no longer exists." };
    serverId = server.id;
  } else {
    proposedServerName = input.proposedServerName.trim();
    if (proposedServerName.length < 2)
      return {
        ok: false,
        error: "Pick an existing server or name the new one (2+ characters).",
      };
    if (proposedServerName.length > 200)
      return { ok: false, error: "Proposed server name is too long." };
  }

  const req = await prisma.eventRequest.create({
    data: {
      serverId,
      proposedServerName,
      name,
      theme: input.theme.trim(),
      startDate: start,
      endDate: end,
      eventStatus: input.status,
      description: input.description.trim(),
      discordUrl: input.discordUrl.trim(),
      requesterId: gate.user.id,
    },
  });

  revalidatePath("/review");
  return { ok: true, id: req.id };
}

// ---------- Review (archivists) ----------

export async function approveServerRequest(
  requestId: string,
): Promise<ReviewResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const req = await prisma.serverRequest.findUnique({
    where: { id: requestId },
    include: { requester: { select: { username: true } } },
  });
  if (!req) return { ok: false, error: "Request not found." };
  if (req.status !== "pending")
    return { ok: false, error: "This request was already handled." };

  const server = await prisma.server.create({
    data: {
      name: req.name,
      description: req.description,
      discordUrl: req.discordUrl,
    },
  });
  await prisma.serverRequest.update({
    where: { id: req.id },
    data: { status: "approved", createdServerId: server.id },
  });

  await logAudit({
    action: "approved_server",
    actorId: gate.user.id,
    actorName: gate.user.username,
    targetType: "server",
    targetId: server.id,
    targetName: server.name,
    authorName: req.requester.username,
  });

  revalidatePath("/review");
  revalidatePath("/");
  return { ok: true };
}

export async function rejectServerRequest(
  requestId: string,
  note: string,
): Promise<ReviewResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const req = await prisma.serverRequest.findUnique({
    where: { id: requestId },
    include: { requester: { select: { username: true } } },
  });
  if (!req) return { ok: false, error: "Request not found." };
  if (req.status !== "pending")
    return { ok: false, error: "This request was already handled." };

  await prisma.serverRequest.update({
    where: { id: req.id },
    data: { status: "rejected", reviewNote: note.trim() || null },
  });

  await logAudit({
    action: "rejected_server",
    actorId: gate.user.id,
    actorName: gate.user.username,
    targetType: "server_request",
    targetId: req.id,
    targetName: req.name,
    authorName: req.requester.username,
    reason: note.trim() || null,
  });

  revalidatePath("/review");
  return { ok: true };
}

export async function approveEventRequest(
  requestId: string,
): Promise<ReviewResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const req = await prisma.eventRequest.findUnique({
    where: { id: requestId },
    include: { requester: { select: { username: true } } },
  });
  if (!req) return { ok: false, error: "Request not found." };
  if (req.status !== "pending")
    return { ok: false, error: "This request was already handled." };

  // Resolve the target server: an existing one, or create from the proposed name.
  let serverId = req.serverId;
  if (!serverId) {
    const created = await prisma.server.create({
      data: {
        name: (req.proposedServerName ?? "Untitled server").trim(),
        discordUrl: req.discordUrl,
      },
    });
    serverId = created.id;
  } else {
    const exists = await prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true },
    });
    if (!exists)
      return {
        ok: false,
        error: "The server this event was filed under no longer exists.",
      };
  }

  const event = await prisma.event.create({
    data: {
      serverId,
      name: req.name,
      theme: req.theme,
      startDate: req.startDate,
      endDate: req.endDate,
      status: req.eventStatus,
      description: req.description,
      discordUrl: req.discordUrl,
    },
  });
  await prisma.eventRequest.update({
    where: { id: req.id },
    data: { status: "approved", createdEventId: event.id },
  });

  await logAudit({
    action: "approved_event",
    actorId: gate.user.id,
    actorName: gate.user.username,
    targetType: "event",
    targetId: event.id,
    targetName: event.name,
    authorName: req.requester.username,
  });

  revalidatePath("/review");
  revalidatePath("/");
  revalidatePath("/upcoming");
  revalidatePath(`/servers/${serverId}`);
  return { ok: true };
}

export async function rejectEventRequest(
  requestId: string,
  note: string,
): Promise<ReviewResult> {
  const gate = await gateArchivist();
  if (!gate.ok) return gate;

  const req = await prisma.eventRequest.findUnique({
    where: { id: requestId },
    include: { requester: { select: { username: true } } },
  });
  if (!req) return { ok: false, error: "Request not found." };
  if (req.status !== "pending")
    return { ok: false, error: "This request was already handled." };

  await prisma.eventRequest.update({
    where: { id: req.id },
    data: { status: "rejected", reviewNote: note.trim() || null },
  });

  await logAudit({
    action: "rejected_event",
    actorId: gate.user.id,
    actorName: gate.user.username,
    targetType: "event_request",
    targetId: req.id,
    targetName: req.name,
    authorName: req.requester.username,
    reason: note.trim() || null,
  });

  revalidatePath("/review");
  return { ok: true };
}
