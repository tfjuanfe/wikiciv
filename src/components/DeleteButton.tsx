"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Result = { ok: boolean; error?: string } | void;

export default function DeleteButton({
  action,
  confirm,
  redirectTo,
  children,
  className = "btn btn-sm btn-danger",
}: {
  action: () => Promise<Result>;
  confirm: string;
  redirectTo?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function onClick() {
    if (!window.confirm(confirm)) return;
    start(async () => {
      const res = await action();
      if (res && res.ok === false) {
        alert(res.error ?? "Could not delete.");
        return;
      }
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={pending}
    >
      {pending ? "Deleting…" : children}
    </button>
  );
}
