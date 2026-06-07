import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ | WikiCiv" };

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is WikiCiv?",
    a: "A community wiki for documenting Minecraft civilization events: the nations, characters, wars, places, and artifacts that players create during multiplayer roleplay.",
  },
  {
    q: "What is the difference between a Record and an Account?",
    a: "A Record holds the documented facts and needs evidence; it is reviewed before publishing. An Account is the in-character side, written from a player or faction's point of view, and is credited to its author.",
  },
  {
    q: "Who can contribute?",
    a: "Anyone can read WikiCiv without an account. To add or edit entries, create an account. New contributors' submissions are reviewed by an archivist before they go public.",
  },
  {
    q: "What is an archivist?",
    a: "Archivists are staff who review submissions, keep entries organized, and handle conflicts and cleanup. They can publish, request changes, mark records as disputed, roll back edits, and remove content.",
  },
  {
    q: "What does 'disputed' mean on a Record?",
    a: "When more than one Record is filed for the same subject and they conflict, an archivist can flag them as disputed. Both Records are kept and shown side by side instead of one being deleted.",
  },
  {
    q: "Can I edit or delete my entry?",
    a: "You can edit your own entries at any time, and every save is kept as a revision. Removing entries is handled by archivists.",
  },
  {
    q: "How do I add evidence?",
    a: "Record entries need at least one image URL or source link. Paste it into the evidence field when you create or edit the Record.",
  },
  {
    q: "If my submission is sent back, do I lose it?",
    a: "No. It becomes a draft on your My Contributions page, along with the archivist's note on what to change. Edit it and submit again.",
  },
  {
    q: "How does my Account get published faster?",
    a: "Trusted contributors' Account entries publish immediately, while Records always go through review. Archivists grant the trusted role to reliable contributors over time.",
  },
];

export default function FaqPage() {
  return (
    <>
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> / FAQ
      </nav>
      <h1 className="page-title">FAQ</h1>
      <p className="lede">
        Common questions about how WikiCiv works. Want more background? Read the{" "}
        <Link href="/info">About page</Link>.
      </p>

      <div className="list-stack">
        {FAQS.map((f) => (
          <article className="card" key={f.q}>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>{f.q}</h3>
            <p className="muted" style={{ margin: 0 }}>
              {f.a}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
