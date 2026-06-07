import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About | WikiCiv" };

export default function InfoPage() {
  return (
    <>
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> / About
      </nav>
      <h1 className="page-title">About WikiCiv</h1>
      <p className="lede">
        WikiCiv is a community wiki for the history of Minecraft civilization
        events: multiplayer roleplay worlds where players found nations, fight
        wars, and build a shared history together.
      </p>

      <h2 className="section-title">
        <span className="cube-bullet" aria-hidden /> What it is
      </h2>
      <div className="prose">
        <p>
          Civilization events create a lot of history that normally disappears
          into chat logs, Discord threads, and old screenshots. WikiCiv is a
          place to write that history down and keep it organized, with entries
          for civilizations, characters, wars, places, and artifacts.
        </p>
      </div>

      <h2 className="section-title">
        <span className="cube-bullet" aria-hidden /> Two layers per subject
      </h2>
      <div className="prose">
        <p>Every subject is documented in two layers:</p>
        <ul>
          <li>
            <strong>Record</strong>: the documented facts, such as dates,
            outcomes, and who was involved. Records need evidence like a
            screenshot or source link, and an archivist reviews them before they
            go public.
          </li>
          <li>
            <strong>Account</strong>: the in-character side. Motivations,
            rivalries, propaganda, and the way a player or faction remembers
            events. Each Account is credited to whoever wrote it.
          </li>
        </ul>
        <p>
          Keeping these separate lets the facts stay clean while still giving
          players room to tell their own side of the story.
        </p>
      </div>

      <h2 className="section-title">
        <span className="cube-bullet" aria-hidden /> Who runs it
      </h2>
      <div className="prose">
        <p>
          WikiCiv was founded by <strong>Danteware</strong> and is kept up by a
          small group of archivists who review submissions and keep the archive
          tidy. Anyone can read it, and anyone with an account can contribute.
        </p>
      </div>

      <h2 className="section-title">
        <span className="cube-bullet" aria-hidden /> Goals
      </h2>
      <div className="prose">
        <ul>
          <li>
            Give civilization events a lasting, searchable history instead of
            letting it fade over time.
          </li>
          <li>
            Separate documented facts from in-character storytelling so both
            have a clear place.
          </li>
          <li>
            Let players record their own faction&apos;s perspective and have it
            credited to them.
          </li>
          <li>Stay open and community-run: free to read, open to contributors.</li>
        </ul>
      </div>

      <p className="lede" style={{ marginTop: 24 }}>
        Want to help? <Link href="/register">Create an account</Link> and start
        adding to the archive, or read the <Link href="/faq">FAQ</Link>.
      </p>
    </>
  );
}
