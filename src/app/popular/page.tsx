import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import EntryCard from "@/components/EntryCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Popular | WikiCiv" };

// subjectKey is `${eventId}::${type}::${nameLowercased}`; eventId and type never
// contain "::", so the first two segments are safe and the rest is the name.
function parseKey(
  key: string,
): { eventId: string; type: string; name: string } | null {
  const parts = key.split("::");
  if (parts.length < 3) return null;
  const [eventId, type, ...rest] = parts;
  return { eventId, type, name: rest.join("::") };
}

export default async function PopularPage() {
  const top = await prisma.star.groupBy({
    by: ["subjectKey"],
    _count: { subjectKey: true },
    orderBy: { _count: { subjectKey: "desc" } },
    take: 24,
  });

  const resolved = await Promise.all(
    top.map(async (row) => {
      const parsed = parseKey(row.subjectKey);
      if (!parsed) return null;
      const entry = await prisma.entry.findFirst({
        where: {
          eventId: parsed.eventId,
          type: parsed.type,
          name: { equals: parsed.name, mode: "insensitive" },
          status: "published",
        },
        include: {
          author: { select: { username: true } },
          event: { select: { server: { select: { id: true, name: true } } } },
        },
        orderBy: [{ layer: "desc" }, { createdAt: "asc" }],
      });
      if (!entry) return null;
      return { entry, stars: row._count.subjectKey };
    }),
  );

  const items = resolved.filter(
    (x): x is NonNullable<typeof x> => x !== null,
  );

  return (
    <>
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> / Popular
      </nav>
      <h1 className="page-title">Popular articles</h1>
      <p className="lede">
        The most-starred articles in the archive. Star an article to help it
        climb.
      </p>

      {items.length === 0 ? (
        <div className="empty-state">
          No starred articles yet. Open any article and hit ★ to be the first.
        </div>
      ) : (
        <div className="card-grid">
          {items.map(({ entry, stars }) => (
            <EntryCard key={entry.id} entry={{ ...entry, stars }} />
          ))}
        </div>
      )}
    </>
  );
}
