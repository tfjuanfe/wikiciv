"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/app/actions/social";

export default function CommentForm({ subjectKey }: { subjectKey: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    const res = await addComment(subjectKey, body);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <form className="comment-form" onSubmit={onSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <textarea
        rows={3}
        value={body}
        maxLength={2000}
        placeholder="Add a comment…"
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="btn-row">
        <button className="btn btn-sm" type="submit" disabled={busy || !body.trim()}>
          {busy ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
