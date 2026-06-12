import type { EntryType } from "@/lib/types";

// One icon system for the whole app. Convention: nouns/categories are solid
// silhouettes, actions/verbs are 2px line icons — a recognized pairing that
// reads as intentional. Everything uses currentColor and sizes to 1em, so an
// icon inherits the color and font-size of its surrounding text.
export type IconName =
  // categories (filled)
  | EntryType
  | "record"
  | "account"
  | "discussion"
  | "discord"
  | "sparkle"
  | "star"
  // actions (line)
  | "download"
  | "link"
  | "check"
  | "close"
  | "undo"
  | "reply"
  | "sun"
  | "moon"
  | "clipboard"
  | "warning"
  | "trash"
  | "external";

// Action icons render as strokes rather than fills.
const STROKE = new Set<IconName>([
  "download",
  "link",
  "check",
  "close",
  "undo",
  "reply",
  "sun",
  "moon",
  "clipboard",
  "warning",
  "trash",
  "external",
]);

const PATHS: Record<IconName, React.ReactNode> = {
  // ---- categories (filled) ----
  civilization: (
    <path d="M4 21V9h2V7h2v2h2V7h2v2h2V7h2v2h2v12h-5v-5a3 3 0 0 0-6 0v5H4z" />
  ),
  character: (
    <>
      <circle cx="12" cy="8" r="4.2" />
      <path d="M3.5 21a8.5 8.5 0 0 1 17 0z" />
    </>
  ),
  war: (
    <g>
      <path d="M11 3h2v12h2v2h-2v4h-2v-4H9v-2h2z" transform="rotate(45 12 12)" />
      <path d="M11 3h2v12h2v2h-2v4h-2v-4H9v-2h2z" transform="rotate(-45 12 12)" />
    </g>
  ),
  place: (
    <>
      <path d="M6.4 3h1.8v18H6.4z" />
      <path d="M8.2 4h9.4l-3 3 3 3H8.2z" />
    </>
  ),
  artifact: <path d="M7 3h10l4 5-9 13L3 8z" />,
  record: <path d="M6 2h8l4 4v16H6z" />,
  account: (
    <path d="M5 7h5v6c0 2.6-1.8 4.6-4.5 5l-.5-1.8c1.4-.3 2-1 2-2.2H5V7zm9 0h5v6c0 2.6-1.8 4.6-4.5 5l-.5-1.8c1.4-.3 2-1 2-2.2h-2V7z" />
  ),
  discussion: (
    <path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-7l-5 4v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
  ),
  discord: (
    <path
      fillRule="evenodd"
      d="M20 4.6A17 17 0 0 0 15.7 3.3l-.25.5a13 13 0 0 1 3.7 1.45 13 13 0 0 0-10.9 0A13 13 0 0 1 12 3.8l-.25-.5A17 17 0 0 0 4 4.6 18.5 18.5 0 0 0 1 18.2a16.6 16.6 0 0 0 5 2.5l.6-1.4a11 11 0 0 1-1.7-.8l.4-.3a12 12 0 0 0 11.4 0l.4.3a11 11 0 0 1-1.7.8l.6 1.4a16.6 16.6 0 0 0 5-2.5A18.5 18.5 0 0 0 20 4.6zM9 15a1.6 1.6 0 1 1 0-3.2A1.6 1.6 0 0 1 9 15zm6 0a1.6 1.6 0 1 1 0-3.2A1.6 1.6 0 0 1 15 15z"
    />
  ),
  sparkle: <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />,
  star: (
    <path d="M12 17.3 6 21l1.6-7L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.6 4.8L18 21z" />
  ),
  // ---- actions (line) ----
  download: <path d="M12 4v10M8 11l4 3 4-3M5 19h14" />,
  link: (
    <path d="M10 13a3 3 0 0 0 4 0l3-3a3 3 0 0 0-4-4l-1 1M14 11a3 3 0 0 0-4 0l-3 3a3 3 0 0 0 4 4l1-1" />
  ),
  check: <path d="M5 12l4 4 10-10" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  undo: <path d="M8 8l-4 4 4 4M4 12h11a4 4 0 0 1 0 8h-2" />,
  reply: <path d="M9 7L4 12l5 5M4 12h10a5 5 0 0 1 5 5v1" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />,
  clipboard: (
    <>
      <path d="M9 4h6v2H9z" />
      <path d="M8 5H6v15h12V5h-2M8 11h8M8 15h5" />
    </>
  ),
  warning: <path d="M12 4l9 16H3zM12 10v4M12 17.2h.01" />,
  trash: <path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  external: (
    <path d="M14 5h5v5M19 5l-8 8M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
  ),
};

export default function Icon({
  name,
  className,
  outline,
}: {
  name: IconName;
  className?: string;
  /** Force a line/outline rendering (used for the empty star). */
  outline?: boolean;
}) {
  const stroke = outline || STROKE.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill={stroke ? "none" : "currentColor"}
      stroke={stroke ? "currentColor" : "none"}
      strokeWidth={stroke ? 2 : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
