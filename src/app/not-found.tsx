import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state" style={{ marginTop: 40 }}>
      <h1 style={{ marginTop: 0 }}>404 — lost in the wilds</h1>
      <p>This page, civilization, or telling could not be found.</p>
      <Link href="/" className="btn">
        Return home
      </Link>
    </div>
  );
}
