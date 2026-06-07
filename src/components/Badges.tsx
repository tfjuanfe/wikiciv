import type { EntryStatus, EntryType, Layer } from "@/lib/types";
import { TYPE_ICONS, TYPE_LABELS } from "@/lib/templates";

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
      <strong>⚠ Disputed record.</strong> Two or more Record claims conflict.
      Both are preserved below — WikiCiv documents the disagreement rather than
      ruling on which version is true.
    </div>
  );
}

export function DisputedTag() {
  return <span className="badge badge-disputed">⚠ Disputed</span>;
}
