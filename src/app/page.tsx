import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import EntryCard from "@/components/EntryCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [servers, recent] = await Promise.all([
    prisma.server.findMany({
      include: {
        _count: { select: { events: true } },
        events: { select: { _count: { select: { entries: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.entry.findMany({
      where: { status: "published" },
      include: { author: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <>
      <section className="hero">
        <h1>WikiCiv</h1>
        <p>
          A community archive for Minecraft civilization events. Each subject
          has two layers: a <strong>Record</strong> for the documented facts, and{" "}
          <strong>Accounts</strong> for the stories players and factions tell
          about it.
        </p>
      </section>

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
        <div className="card-grid">
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
        </div>
      )}

      <h2 className="section-title">
        <span className="cube-bullet" aria-hidden /> Recently published
      </h2>
      {recent.length === 0 ? (
        <div className="empty-state">
          Nothing published yet. Logged-in contributors can add the first entry.
        </div>
      ) : (
        <div className="card-grid">
          {recent.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </>
  );
}
