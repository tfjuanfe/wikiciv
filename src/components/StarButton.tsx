"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleStar } from "@/app/actions/social";
import Icon from "./Icon";

export default function StarButton({
  subjectKey,
  initialCount,
  initialStarred,
  isLoggedIn,
}: {
  subjectKey: string;
  initialCount: number;
  initialStarred: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [starred, setStarred] = useState(initialStarred);
  const [busy, setBusy] = useState(false);

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        className="btn btn-sm btn-secondary star-btn"
        title="Log in to star this article"
      >
        <Icon name="star" outline /> <span>{count}</span>
      </a>
    );
  }

  async function onClick() {
    setBusy(true);
    const res = await toggleStar(subjectKey);
    setBusy(false);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    setStarred(res.starred);
    setCount(res.count);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`btn btn-sm star-btn ${starred ? "star-on" : "btn-secondary"}`}
      title={starred ? "Remove your star" : "Star this article"}
    >
      {starred ? <Icon name="star" /> : <Icon name="star" outline />}{" "}
      <span>{count}</span>
    </button>
  );
}
