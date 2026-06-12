"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestChanges } from "@/app/actions/review";
import Icon from "./Icon";

// Inline "request changes" control: reveals a reason field so the archivist's
// feedback reaches the author instead of silently sending it back.
export default function RequestChangesForm({ entryId }: { entryId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit() {
    start(async () => {
      const res = await requestChanges(entryId, reason);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      setOpen(false);
      setReason("");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-sm btn-secondary"
        onClick={() => setOpen(true)}
      >
        <Icon name="undo" /> Request changes
      </button>
    );
  }

  return (
    <div style={{ width: "100%", marginTop: 8 }}>
      <textarea
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What needs to change? This is shown to the author."
        autoFocus
      />
      <div className="btn-row" style={{ marginTop: 6 }}>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={submit}
          disabled={pending}
        >
          {pending ? "Sending…" : "Send back with feedback"}
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
