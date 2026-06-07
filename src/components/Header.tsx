import Link from "next/link";
import type { SessionUser } from "@/lib/types";
import { logout } from "@/app/actions/auth";
import ThemeToggle from "./ThemeToggle";

export default function Header({ user }: { user: SessionUser | null }) {
  return (
    <header className="site-header">
      {/* Row 1: brand · search · account */}
      <div className="header-top">
        <Link href="/" className="brand" aria-label="WikiCiv home">
          <span className="brand-cube" aria-hidden />
          <span className="brand-text">
            Wiki<span className="brand-accent">Civ</span>
          </span>
          <span className="brand-tag">lore archive</span>
        </Link>

        <form
          className="header-search"
          action="/search"
          method="get"
          role="search"
        >
          <span className="search-icon" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            name="q"
            placeholder="Search civilizations, characters, wars, places…"
            aria-label="Search the archive"
          />
        </form>

        <div className="header-account">
          {user ? (
            <>
              <Link href="/entries/new" className="nav-cta">
                + Add lore
              </Link>
              <span className="nav-user" title={`role: ${user.role}`}>
                <Link href={`/users/${user.username}`}>{user.username}</Link>
                {user.trusted && (
                  <span className="trusted-dot" title="trusted">
                    ✦
                  </span>
                )}
              </span>
              <form action={logout} className="logout-form">
                <button type="submit" className="link-button">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="nav-cta">
                Sign up
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Row 2: page tabs */}
      <nav className="header-tabs">
        <Link href="/">Home</Link>
        <Link href="/upcoming">Upcoming</Link>
        <Link href="/popular">Popular</Link>
        {user && <Link href="/me">My contributions</Link>}
        {user?.role === "archivist" && (
          <Link href="/review" className="nav-review">
            Review
          </Link>
        )}
        <Link href="/info">About</Link>
        <Link href="/faq">FAQ</Link>
      </nav>
    </header>
  );
}
