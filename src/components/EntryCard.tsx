import Link from "next/link";
import type { EntryType, Layer } from "@/lib/types";
import { TypeBadge, LayerBadge, DisputedTag } from "./Badges";
import { formatDate } from "@/lib/format";

export interface EntryCardData {
  id: string;
  name: string;
  type: string;
  layer: string;
  attributedTo: string | null;
  body: string;
  disputed: boolean;
  createdAt: Date | string;
  author?: { username: string } | null;
  stars?: number;
  event?: { server: { id: string; name: string } } | null;
}

function snippet(body: string, max = 160): string {
  const plain = body
    .replace(/[#>*_`~\-]/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? plain.slice(0, max) + "…" : plain;
}

export default function EntryCard({ entry }: { entry: EntryCardData }) {
  return (
    <article className="card entry-card">
      <div className="entry-card-head">
        <TypeBadge type={entry.type as EntryType} />
        <LayerBadge layer={entry.layer as Layer} />
        {entry.disputed && <DisputedTag />}
      </div>
      <h3>
        <Link href={`/entries/${entry.id}`}>{entry.name}</Link>
      </h3>
      {entry.layer === "account" && entry.attributedTo && (
        <div className="attributed">
          as told by <strong>{entry.attributedTo}</strong>
        </div>
      )}
      {snippet(entry.body) && <p className="snippet">{snippet(entry.body)}</p>}
      <div className="entry-card-foot">
        {typeof entry.stars === "number" && entry.stars > 0 && (
          <span className="star-count">★ {entry.stars}</span>
        )}
        {entry.event?.server && (
          <span>
            on{" "}
            <Link href={`/servers/${entry.event.server.id}`}>
              {entry.event.server.name}
            </Link>
          </span>
        )}
        {entry.author && (
          <span>
            by{" "}
            <Link href={`/users/${entry.author.username}`}>
              {entry.author.username}
            </Link>
          </span>
        )}
        <span>{formatDate(entry.createdAt)}</span>
      </div>
    </article>
  );
}
