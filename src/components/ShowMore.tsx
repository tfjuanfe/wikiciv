"use client";

import { Children, useState } from "react";

// Renders the first `limit` children in a grid, with a "Show more" button that
// reveals the rest. Keeps long lists (e.g. servers) from running on forever.
export default function ShowMore({
  children,
  limit,
  className = "card-grid",
  noun = "more",
}: {
  children: React.ReactNode;
  limit: number;
  className?: string;
  noun?: string;
}) {
  const items = Children.toArray(children);
  const [open, setOpen] = useState(false);
  const visible = open ? items : items.slice(0, limit);
  const remaining = items.length - limit;

  return (
    <>
      <div className={className}>{visible}</div>
      {remaining > 0 && !open && (
        <div className="show-more-row">
          <button
            type="button"
            className="btn btn-secondary show-more-btn"
            onClick={() => setOpen(true)}
          >
            Show {remaining} {noun}
          </button>
        </div>
      )}
    </>
  );
}
