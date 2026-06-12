"use client";

import { useState } from "react";
import Icon from "./Icon";

// Copies the current page URL to the clipboard so readers can quickly paste a
// link to a subject into Discord. Falls back to a prompt when the Clipboard API
// is unavailable (e.g. non-HTTPS contexts or older browsers).
export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-sm btn-secondary"
      title="Copy a link to this subject"
    >
      {copied ? (
        <>
          <Icon name="check" /> Link copied
        </>
      ) : (
        <>
          <Icon name="link" /> Share
        </>
      )}
    </button>
  );
}
