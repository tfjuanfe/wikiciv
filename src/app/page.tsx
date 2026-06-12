import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { EventStatusBadge } from "@/components/Badges";
import EntryCard from "@/components/EntryCard";
import Icon from "@/components/Icon";
import Reveal from "@/components/Reveal";
import ShowMore from "@/components/ShowMore";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [servers, recent, upcoming, entryCount, eventCount] = await Promise.all([
    prisma.server.findMany({
      include: {
        _count: { select: { events: true } },
        events: { select: { _count: { select: { entries: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.entry.findMany({
      where: { status: "published" },
      include: {
        author: { select: { username: true } },
        event: { select: { server: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.event.findMany({
      where: { status: "upcoming" },
      include: { server: { select: { id: true, name: true } } },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    prisma.entry.count({ where: { status: "published" } }),
    prisma.event.count(),
  ]);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">The civilization archive</p>
          <h1>Every telling has a home.</h1>
          <p className="hero-lede">
            Players build nations, wage wars, and remember them differently.
            WikiCiv keeps both sides — the documented <strong>Record</strong> and
            the <strong>Accounts</strong> each faction tells. When versions
            conflict, they stand side by side. Nothing overwritten, nothing
            erased.
          </p>
          <div className="hero-cta">
            <Link href="/search" className="btn btn-lg">
              Explore the archive
            </Link>
            <Link href="/info" className="btn btn-lg btn-ghost">
              How it works
            </Link>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>{entryCount}</dt>
              <dd>entries</dd>
            </div>
            <div>
              <dt>{eventCount}</dt>
              <dd>events</dd>
            </div>
            <div>
              <dt>{servers.length}</dt>
              <dd>hosts</dd>
            </div>
          </dl>
        </div>

        <div className="hero-visual" aria-hidden>
          <article className="concept-card concept-record">
            <header>
              <Icon name="record" /> Record
              <span className="concept-chip">Verified</span>
            </header>
            <p>
              Founded Day 3 · Capital sacked in the Ashen War. Drawn from server
              logs and screenshots, reviewed before publishing.
            </p>
          </article>
          <article className="concept-card concept-account">
            <header>
              <Icon name="account" /> Account
            </header>
            <p className="concept-quote">
              “We did not start the fire. We only refused to kneel before it.”
            </p>
            <footer>— as told by The Ardenfall Court</footer>
          </article>
          <span className="concept-tie">one subject, every telling</span>
        </div>
      </section>

      {upcoming.length > 0 && (
        <Reveal>
          <h2
            className="section-title"
            style={{ justifyContent: "space-between" }}
          >
            <span>
              <span className="cube-bullet" aria-hidden /> Upcoming events
            </span>
            <Link href="/upcoming" className="btn btn-sm btn-secondary">
              See all
            </Link>
          </h2>
          <div className="card-grid">
            {upcoming.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="card">
                <div className="tag-row" style={{ marginBottom: 6 }}>
                  <EventStatusBadge status={e.status} />
                  {e.theme && (
                    <span className="badge badge-type">{e.theme}</span>
                  )}
                </div>
                <h3 style={{ margin: "2px 0" }}>{e.name}</h3>
                <div className="meta muted">
                  Planned for {formatDate(e.startDate)} · {e.server.name}
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal>
        <h2 className="section-title" style={{ justifyContent: "space-between" }}>
          <span>
            <span className="cube-bullet" aria-hidden /> Servers
          </span>
        {canReview(user) && (
          <Link href="/servers/new" className="btn btn-sm">
            + New server
          </Link>
        )}
      </h2>
      {servers.length === 0 ? (
        <div className="empty-state">No servers yet.</div>
      ) : (
        <ShowMore limit={6} noun="more hosts">
          {servers.map((s) => {
            const entryCount = s.events.reduce(
              (n, e) => n + e._count.entries,
              0,
            );
            return (
              <Link
                key={s.id}
                href={`/servers/${s.id}`}
                className="card server-card"
              >
                <h3>{s.name}</h3>
                <p className="muted">{s.description}</p>
                <div className="meta">
                  {s._count.events} event{s._count.events === 1 ? "" : "s"} ·{" "}
                  {entryCount} entr{entryCount === 1 ? "y" : "ies"}
                </div>
              </Link>
            );
          })}
        </ShowMore>
      )}
      </Reveal>

      <Reveal>
        <h2 className="section-title">
          <span className="cube-bullet" aria-hidden /> Latest entries
        </h2>
      {recent.length === 0 ? (
        <div className="empty-state">
          The archive is empty for now. Verified contributors can write the first
          entry.
        </div>
      ) : (
        <div className="card-grid">
          {recent.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </div>
      )}
      </Reveal>
    </>
  );
}
