import Link from "next/link";
import type { SessionUser } from "@/lib/types";
import { logout } from "@/app/actions/auth";
import ThemeToggle from "./ThemeToggle";

export default function Header({ user }: { user: SessionUser | null }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="WikiCiv home">
          <span className="brand-cube" aria-hidden />
          <span className="brand-text">
            Wiki<span className="brand-accent">Civ</span>
          </span>
          <span className="brand-tag">lore archive</span>
        </Link>

        <form className="header-search" action="/search" method="get" role="search">
          <input
            type="search"
            name="q"
            placeholder="Search entries & events…"
            aria-label="Search"
          />
        </form>

        <nav className="header-nav">
          <Link href="/">Home</Link>
          <Link href="/search">Search</Link>
          <Link href="/info">About</Link>
          <Link href="/faq">FAQ</Link>
          {user ? (
            <>
              <Link href="/entries/new" className="nav-cta">
                + Add lore
              </Link>
              <Link href="/me">Mine</Link>
              {user.role === "archivist" && (
                <Link href="/review" className="nav-review">
                  Review
                </Link>
              )}
              <span className="nav-user" title={`role: ${user.role}`}>
                {user.username}
                {user.trusted && <span className="trusted-dot" title="trusted">✦</span>}
                <span className="nav-role">{user.role}</span>
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
        </nav>
      </div>
    </header>
  );
}
