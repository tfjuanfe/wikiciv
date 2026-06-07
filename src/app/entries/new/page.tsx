import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canContribute } from "@/lib/permissions";
import EntryForm from "@/components/EntryForm";
import { ENTRY_TYPES } from "@/lib/templates";
import type { EntryType, Layer } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: { eventId?: string; type?: string; layer?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/entries/new");
  if (!canContribute(user)) redirect("/");

  const events = await prisma.event.findMany({
    include: { server: { select: { name: true } } },
    orderBy: { startDate: "desc" },
  });

  if (events.length === 0) {
    return (
      <div className="empty-state">
        There are no events to add lore to yet. <Link href="/">Go home</Link>.
      </div>
    );
  }

  const defaultEventId =
    searchParams.eventId && events.some((e) => e.id === searchParams.eventId)
      ? searchParams.eventId
      : events[0].id;
  const defaultType: EntryType = ENTRY_TYPES.includes(
    searchParams.type as EntryType,
  )
    ? (searchParams.type as EntryType)
    : "civilization";
  const defaultLayer: Layer =
    searchParams.layer === "account" ? "account" : "record";

  return (
    <>
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> / New entry
      </nav>
      <h1 className="page-title">Add lore</h1>
      <p className="lede">
        Pick a layer: a <strong>Record</strong> of verifiable facts (needs
        evidence, reviewed before publishing) or an <strong>Account</strong> —
        an in-character telling attributed to a player or faction.
      </p>

      <EntryForm
        mode="create"
        events={events.map((e) => ({
          id: e.id,
          name: e.name,
          serverName: e.server.name,
        }))}
        initial={{
          eventId: defaultEventId,
          type: defaultType,
          layer: defaultLayer,
          name: "",
          attributedTo: "",
          body: "",
          infobox: {},
          evidence: [],
        }}
      />
    </>
  );
}
