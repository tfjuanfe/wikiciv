"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";

// Shown to logged-in users who haven't verified an email. Dismissible for the
// current tab session (reappears next visit) so it nudges without nagging.
export default function VerifyEmailBanner({ hasEmail }: { hasEmail: boolean }) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(sessionStorage.getItem("wikiciv-hide-verify-banner") === "1");
  }, []);

  if (hidden) return null;

  function dismiss() {
    try {
      sessionStorage.setItem("wikiciv-hide-verify-banner", "1");
    } catch {
      /* ignore storage errors */
    }
    setHidden(true);
  }

  return (
    <div className="verify-banner">
      <span>
        {hasEmail
          ? "Check your inbox to verify your email. It's required before you can contribute."
          : "Add and verify an email to start contributing records and accounts."}{" "}
        <Link href="/me">
          {hasEmail ? "Resend or change it" : "Add your email"}
        </Link>
        .
      </span>
      <button
        type="button"
        className="verify-banner-close"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <Icon name="close" />
      </button>
    </div>
  );
}
