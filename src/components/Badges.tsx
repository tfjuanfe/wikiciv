import Link from "next/link";
import type { EntryStatus, EntryType, Layer } from "@/lib/types";
import { TYPE_ICONS, TYPE_LABELS } from "@/lib/templates";

// The server that hosts an event acts as its "host". Servers are archivist-
// created, so this is already a deduped, canonical name — clicking it opens the
// host's catalog of events.
export function HostBadge({
  server,
}: {
  server: { id: string; name: string };
}) {
  return (
    <Link href={`/servers/${server.id}`} className="badge badge-host">
      Host: {server.name}
    </Link>
  );
}

export function TypeBadge({ type }: { type: EntryType }) {
  return (
    <span className={`badge badge-type type-${type}`}>
      <span aria-hidden>{TYPE_ICONS[type]}</span> {TYPE_LABELS[type]}
    </span>
  );
}

export function LayerBadge({ layer }: { layer: Layer }) {
  return (
    <span className={`badge badge-layer layer-${layer}`}>
      {layer === "record" ? "📜 Record" : "💬 Account"}
    </span>
  );
}

export function StatusBadge({ status }: { status: EntryStatus }) {
  const label =
    status === "published"
      ? "Published"
      : status === "pending"
        ? "Pending review"
        : "Draft";
  return <span className={`badge badge-status status-${status}`}>{label}</span>;
}

export function DisputedBanner() {
  return (
    <div className="disputed-banner" role="note">
      <strong>⚠ Disputed record.</strong> More than one Record has been filed
      for this subject and an archivist flagged them as conflicting. Both are
      kept and shown below.
    </div>
  );
}

export function DisputedTag() {
  return <span className="badge badge-disputed">⚠ Disputed</span>;
}

export function EventStatusBadge({ status }: { status: string }) {
  const label =
    status === "upcoming"
      ? "Upcoming"
      : status === "concluded"
        ? "Concluded"
        : "Ongoing";
  const cls =
    status === "upcoming"
      ? "event-upcoming"
      : status === "concluded"
        ? "event-concluded"
        : "event-ongoing";
  return <span className={`badge ${cls}`}>{label}</span>;
}
