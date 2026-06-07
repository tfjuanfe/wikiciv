import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ServerPage({
  params,
}: {
  params: { serverId: string };
}) {
  const [server, user] = await Promise.all([
    prisma.server.findUnique({
      where: { id: params.serverId },
      include: {
        events: {
          include: { _count: { select: { entries: true } } },
          orderBy: { startDate: "desc" },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!server) notFound();
  const isArchivist = canReview(user);

  return (
    <>
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> / {server.name}
      </nav>

      <div className="entry-header">
        <h1 className="page-title" style={{ margin: 0 }}>
          {server.name}
        </h1>
        {isArchivist && (
          <Link href={`/servers/${server.id}/edit`} className="btn btn-sm btn-secondary">
            Edit server
          </Link>
        )}
      </div>
      <p className="lede">{server.description}</p>

      <h2 className="section-title" style={{ justifyContent: "space-between" }}>
        <span>
          <span className="cube-bullet" aria-hidden /> Events
        </span>
        {isArchivist && (
          <Link href={`/events/new?serverId=${server.id}`} className="btn btn-sm">
            + New event
          </Link>
        )}
      </h2>
      {server.events.length === 0 ? (
        <div className="empty-state">No events recorded for this server yet.</div>
      ) : (
        <div className="list-stack">
          {server.events.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`} className="card">
              <div className="tag-row" style={{ marginBottom: 6 }}>
                <span className={`badge badge-status status-${e.status === "concluded" ? "published" : "pending"}`}>
                  {e.status}
                </span>
                {e.theme && <span className="badge badge-type">{e.theme}</span>}
              </div>
              <h3 style={{ margin: "2px 0" }}>{e.name}</h3>
              <div className="meta muted">
                {formatDate(e.startDate)} – {formatDate(e.endDate)} ·{" "}
                {e._count.entries} entr{e._count.entries === 1 ? "y" : "ies"}
              </div>
              {e.description && (
                <p className="muted" style={{ marginBottom: 0 }}>
                  {e.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
