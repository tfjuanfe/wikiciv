import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { EventStatusBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Upcoming events | WikiCiv" };

export default async function UpcomingPage() {
  const events = await prisma.event.findMany({
    where: { status: "upcoming" },
    include: { server: { select: { id: true, name: true } } },
    orderBy: { startDate: "asc" },
  });

  return (
    <>
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> / Upcoming
      </nav>
      <h1 className="page-title">Upcoming events</h1>
      <p className="lede">
        Events that are planned but have not started yet. Join the Discord for an
        event to take part.
      </p>

      {events.length === 0 ? (
        <div className="empty-state">
          No upcoming events announced right now. Check back soon.
        </div>
      ) : (
        <div className="list-stack">
          {events.map((e) => (
            <article key={e.id} className="card">
              <div className="tag-row" style={{ marginBottom: 6 }}>
                <EventStatusBadge status={e.status} />
                {e.theme && <span className="badge badge-type">{e.theme}</span>}
                <span className="muted">Planned for {formatDate(e.startDate)}</span>
              </div>
              <h3 style={{ margin: "2px 0" }}>
                <Link href={`/events/${e.id}`}>{e.name}</Link>
              </h3>
              <div className="meta muted">
                on <Link href={`/servers/${e.server.id}`}>{e.server.name}</Link>
              </div>
              {e.description && (
                <p className="muted" style={{ margin: "8px 0 0" }}>
                  {e.description}
                </p>
              )}
              {e.discordUrl && (
                <p style={{ margin: "10px 0 0" }}>
                  <a
                    href={e.discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm discord-btn"
                  >
                    💬 Join on Discord
                  </a>
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
