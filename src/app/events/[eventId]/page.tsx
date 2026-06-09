import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canContribute, canReview } from "@/lib/permissions";
import { formatDate, formatDateTime } from "@/lib/format";
import { eventSubjectKey } from "@/lib/ratings";
import { ENTRY_TYPES, TYPE_ICONS, TYPE_LABELS } from "@/lib/templates";
import {
  TypeBadge,
  LayerBadge,
  DisputedTag,
  EventStatusBadge,
  HostBadge,
} from "@/components/Badges";
import DeleteButton from "@/components/DeleteButton";
import ActionButton from "@/components/ActionButton";
import RatingControl from "@/components/RatingControl";
import CommentForm from "@/components/CommentForm";
import { deleteEvent } from "@/app/actions/admin";
import { deleteComment } from "@/app/actions/social";
import type { EntryType } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SubjectSummary {
  anchorId: string;
  type: EntryType;
  name: string;
  hasRecord: boolean;
  recordCount: number;
  accountCount: number;
  disputed: boolean;
}

export default async function EventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const [event, user] = await Promise.all([
    prisma.event.findUnique({
      where: { id: params.eventId },
      include: {
        server: true,
        entries: {
          where: { status: "published" },
          include: { author: { select: { username: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!event) notFound();

  // Ratings + discussion live on the event itself. Upcoming events can't be
  // rated yet (nothing to judge), but everyone can still discuss them.
  const sk = eventSubjectKey(event.id);
  const canRate = event.status !== "upcoming";
  const isArchivist = canReview(user);
  const [ratingAgg, userRating, comments] = await Promise.all([
    prisma.eventRating.aggregate({
      where: { eventId: event.id },
      _avg: { value: true },
      _count: { value: true },
    }),
    user
      ? prisma.eventRating.findUnique({
          where: { eventId_userId: { eventId: event.id, userId: user.id } },
        })
      : Promise.resolve(null),
    prisma.comment.findMany({
      where: { subjectKey: sk },
      include: { author: { select: { username: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Group published entries into subjects (event already fixed, so key on type+name).
  const map = new Map<string, SubjectSummary>();
  for (const e of event.entries) {
    const key = `${e.type}::${e.name.trim().toLowerCase()}`;
    const existing =
      map.get(key) ??
      ({
        anchorId: e.id,
        type: e.type as EntryType,
        name: e.name,
        hasRecord: false,
        recordCount: 0,
        accountCount: 0,
        disputed: false,
      } satisfies SubjectSummary);
    if (e.layer === "record") {
      existing.hasRecord = true;
      existing.recordCount += 1;
      if (e.disputed) existing.disputed = true;
      // Prefer the record entry as the anchor link.
      existing.anchorId = e.id;
    } else {
      existing.accountCount += 1;
    }
    map.set(key, existing);
  }
  const subjects = [...map.values()];
  const byType = ENTRY_TYPES.map((t) => ({
    type: t,
    items: subjects.filter((s) => s.type === t),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> /{" "}
        <Link href={`/servers/${event.serverId}`}>{event.server.name}</Link> /{" "}
        {event.name}
      </nav>

      <div className="tag-row" style={{ marginBottom: 8 }}>
        <EventStatusBadge status={event.status} />
        <HostBadge server={event.server} />
        {event.theme && <span className="badge badge-type">{event.theme}</span>}
        <span className="muted">
          {event.status === "upcoming"
            ? `Planned for ${formatDate(event.startDate)}`
            : `${formatDate(event.startDate)} – ${
                event.endDate ? formatDate(event.endDate) : "present"
              }`}
        </span>
      </div>

      <div className="entry-header">
        <h1 className="page-title" style={{ margin: 0 }}>
          {event.name}
        </h1>
        {canReview(user) && (
          <span className="inline-actions">
            <Link
              href={`/events/${event.id}/edit`}
              className="btn btn-sm btn-secondary"
            >
              Edit event
            </Link>
            <DeleteButton
              action={deleteEvent.bind(null, event.id)}
              redirectTo={`/servers/${event.serverId}`}
              confirm={`Permanently delete the event "${event.name}" and ALL entries filed under it? This cannot be undone.`}
            >
              🗑 Delete event
            </DeleteButton>
          </span>
        )}
      </div>
      <p className="lede">{event.description}</p>

      {event.discordUrl && (
        <p style={{ margin: "8px 0 14px" }}>
          <a
            href={event.discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm discord-btn"
          >
            💬 Join on Discord
          </a>
        </p>
      )}

      {canRate && (
        <div className="card rating-card">
          <strong>Rate this event</strong>
          <RatingControl
            eventId={event.id}
            initialAverage={ratingAgg._avg.value}
            initialCount={ratingAgg._count.value}
            initialUserValue={userRating?.value ?? 0}
            isLoggedIn={!!user}
          />
        </div>
      )}

      {canContribute(user) && (
        <div style={{ margin: "14px 0" }}>
          <Link href={`/entries/new?eventId=${event.id}`} className="btn">
            + Add lore to this event
          </Link>
        </div>
      )}

      <div className="subject-layout" style={{ gridTemplateColumns: "1fr 280px" }}>
        <div>
          <h2 className="section-title">
            <span className="cube-bullet" aria-hidden /> Entries
          </h2>
          {byType.length === 0 ? (
            <div className="empty-state">
              No published entries yet for this event.
            </div>
          ) : (
            byType.map((group) => (
              <section key={group.type} style={{ marginBottom: 22 }}>
                <h3 style={{ marginBottom: 10 }}>
                  {TYPE_ICONS[group.type]} {TYPE_LABELS[group.type]}
                </h3>
                <div className="list-stack">
                  {group.items.map((s) => (
                    <Link
                      key={s.anchorId}
                      href={`/entries/${s.anchorId}`}
                      className="card entry-card"
                    >
                      <div className="entry-card-head">
                        <TypeBadge type={s.type} />
                        {s.hasRecord && <LayerBadge layer="record" />}
                        {s.accountCount > 0 && <LayerBadge layer="account" />}
                        {s.disputed && <DisputedTag />}
                      </div>
                      <h3 style={{ margin: "2px 0" }}>{s.name}</h3>
                      <div className="entry-card-foot">
                        {s.hasRecord ? (
                          <span>
                            {s.recordCount > 1
                              ? `${s.recordCount} record claims`
                              : "1 record"}
                          </span>
                        ) : (
                          <span>no record yet</span>
                        )}
                        <span>
                          {s.accountCount} account
                          {s.accountCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <aside>
          <h2 className="section-title">
            <span className="cube-bullet" aria-hidden /> Timeline
          </h2>
          {event.entries.length === 0 ? (
            <p className="muted">No events on the timeline yet.</p>
          ) : (
            <ul className="timeline">
              {event.entries.map((e) => (
                <li key={e.id}>
                  <div className="t-date">{formatDate(e.createdAt)}</div>
                  <div className="t-title">
                    <Link href={`/entries/${e.id}`}>{e.name}</Link>
                  </div>
                  <div className="muted" style={{ fontSize: "0.78rem" }}>
                    {e.layer === "record" ? "Record" : "Account"} ·{" "}
                    {TYPE_LABELS[e.type as EntryType]}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <section className="discussion">
        <h2 className="section-title">💬 Discussion ({comments.length})</h2>
        {comments.length === 0 ? (
          <p className="muted">
            No comments yet. Share your thoughts on this event.
          </p>
        ) : (
          <ul className="comment-list">
            {comments.map((c) => (
              <li key={c.id} className="comment">
                <div className="comment-head">
                  <Link href={`/users/${c.author.username}`}>
                    <strong>{c.author.username}</strong>
                  </Link>
                  <span className="muted">{formatDateTime(c.createdAt)}</span>
                </div>
                <p className="comment-body">{c.body}</p>
                {(user?.id === c.authorId || isArchivist) && (
                  <div className="comment-actions">
                    <ActionButton
                      action={deleteComment.bind(null, c.id)}
                      className="link-button"
                      confirm="Delete this comment?"
                    >
                      Delete
                    </ActionButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {user ? (
          <CommentForm subjectKey={sk} />
        ) : (
          <p className="muted">
            <Link href="/login">Log in</Link> to join the discussion.
          </p>
        )}
      </section>
    </>
  );
}
