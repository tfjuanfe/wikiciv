import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About | CivCentral" };

export default function InfoPage() {
  return (
    <>
      <nav className="breadcrumbs">
        <Link href="/">Home</Link> / About
      </nav>
      <h1 className="page-title">About CivCentral</h1>
      <p className="lede">
        CivCentral is the home for Minecraft civilization events — multiplayer
        roleplay worlds where players found nations, fight wars, and build a
        shared history. It&apos;s where players find the events worth their time,
        and where the stories from those events are kept once they end.
      </p>

      <h2 className="section-title">
        <span className="cube-bullet" aria-hidden /> What it is
      </h2>
      <div className="prose">
        <p>
          CivCentral helps you find Minecraft civilization events and decide
          which ones are worth joining — with honest ratings and clear,
          trustworthy info instead of hype and hearsay. It&apos;s built to be
          easy to use and to stay free of toxicity and misinformation, so the
          info you read is info you can actually rely on.
        </p>
      </div>

      <h2 className="section-title">
        <span className="cube-bullet" aria-hidden /> For hosts
      </h2>
      <div className="prose">
        <p>
          Hosts get real control and visibility over how their event is
          presented — its details, its description, and how it&apos;s rated. You
          decide how your event shows up to players, instead of leaving it to
          rumor and scattered Discord posts.
        </p>
      </div>

      <h2 className="section-title">
        <span className="cube-bullet" aria-hidden /> Honest ratings, no drama
      </h2>
      <div className="prose">
        <p>
          Ratings come from real players, and the platform is moderated to stay
          free of toxicity and misinformation. The goal is simple: a place
          people actually trust when they&apos;re deciding where to play next.
        </p>
      </div>

      <h2 className="section-title">
        <span className="cube-bullet" aria-hidden /> When an event ends
      </h2>
      <div className="prose">
        <p>
          Civilization events create a lot of history that normally disappears
          into chat logs, Discord threads, and old screenshots. When an event
          ends, its story shouldn&apos;t disappear with it. CivCentral lets hosts
          and players document the civilizations, characters, wars, places, and
          artifacts that made an event worth remembering — kept organized and
          searchable for good.
        </p>
      </div>

      <h2 className="section-title">
        <span className="cube-bullet" aria-hidden /> Two layers per subject
      </h2>
      <div className="prose">
        <p>When a story gets written down, it&apos;s documented in two layers:</p>
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
          CivCentral was founded by <strong>Danteware</strong> and is kept up by
          a small group of archivists who review submissions, keep ratings and
          info honest, and handle moderation. Anyone can read it, and anyone with
          an account can contribute.
        </p>
      </div>

      <h2 className="section-title">
        <span className="cube-bullet" aria-hidden /> Goals
      </h2>
      <div className="prose">
        <ul>
          <li>Help players find the civilization events worth their time.</li>
          <li>
            Give hosts real control and visibility over how their events are
            presented.
          </li>
          <li>
            Keep ratings honest and the platform free of toxicity and
            misinformation.
          </li>
          <li>
            Make sure an event&apos;s story doesn&apos;t disappear once it ends.
          </li>
          <li>Stay open and community-run: free to read, open to contributors.</li>
        </ul>
      </div>

      <p className="lede" style={{ marginTop: 24 }}>
        Want in? <Link href="/register">Create an account</Link> to start rating
        and documenting events, or read the <Link href="/faq">FAQ</Link>.
      </p>
    </>
  );
}
