"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Result = { ok: boolean; error?: string } | void;

export default function ActionButton({
  action,
  children,
  className = "btn btn-sm",
  confirm,
  title,
}: {
  action: () => Promise<Result>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  title?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function onClick() {
    if (confirm && !window.confirm(confirm)) return;
    start(async () => {
      const res = await action();
      if (res && res.ok === false) {
        alert(res.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={pending}
      title={title}
    >
      {pending ? "…" : children}
    </button>
  );
}
