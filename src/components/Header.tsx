import Link from "next/link";
import Image from "next/image";
import type { SessionUser } from "@/lib/types";
import { prisma } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import ThemeToggle from "./ThemeToggle";
import Icon from "./Icon";

export default async function Header({ user }: { user: SessionUser | null }) {
  const upcomingCount = await prisma.event.count({
    where: { status: "upcoming" },
  });

  return (
    <header className="site-header">
      {/* Row 1: brand · search · account */}
      <div className="header-top">
        <Link href="/" className="brand" aria-label="WikiCiv home">
          <Image
            src="/logo.png"
            alt="WikiCiv"
            width={760}
            height={252}
            priority
            className="brand-logo brand-logo-light"
          />
          <Image
            src="/logo-dark.png"
            alt="WikiCiv"
            width={760}
            height={252}
            priority
            className="brand-logo brand-logo-dark"
          />
        </Link>

        <form
          className="header-search"
          action="/search"
          method="get"
          role="search"
        >
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
                    <Icon name="sparkle" />
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
        <Link href="/upcoming" className="tab-with-badge">
          Upcoming
          {upcomingCount > 0 && (
            <span className="tab-badge">{upcomingCount}</span>
          )}
        </Link>
        <Link href="/ratings">Ratings</Link>
        <Link href="/popular">Popular</Link>
        {user && <Link href="/me">My contributions</Link>}
        {user?.eventHost && user.role !== "archivist" && (
          <>
            <Link href="/events/new">Suggest event</Link>
            <Link href="/servers/new">Suggest server</Link>
          </>
        )}
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
