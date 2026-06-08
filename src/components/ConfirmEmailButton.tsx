"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmEmail } from "@/app/actions/verify";

export default function ConfirmEmailButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    start(async () => {
      const res = await confirmEmail(token);
      if (!res.ok) {
        setError(res.error);
        setState("error");
        return;
      }
      setState("done");
      router.refresh();
    });
  }

  if (state === "done") {
    return (
      <div className="alert alert-success">
        <strong>Your email is verified.</strong> You can now contribute records
        and accounts. <Link href="/entries/new">Add lore</Link> or head to your{" "}
        <Link href="/me">My Contributions</Link> page.
      </div>
    );
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="btn-row">
        <button className="btn" type="button" onClick={onClick} disabled={pending}>
          {pending ? "Verifying…" : "Verify my email"}
        </button>
      </div>
    </>
  );
}
