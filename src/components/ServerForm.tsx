"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createServer, updateServer } from "@/app/actions/admin";

export interface ServerFormInitial {
  id?: string;
  name: string;
  description: string;
}

export default function ServerForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: ServerFormInitial;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const payload = { name, description };
    const res =
      mode === "edit"
        ? await updateServer(initial.id!, payload)
        : await createServer(payload);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push(`/servers/${res.id}`);
    router.refresh();
  }

  return (
    <form className="form-narrow" onSubmit={onSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field">
        <label htmlFor="name">Server name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Stoneholm SMP"
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="desc">Description</label>
        <textarea
          id="desc"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What kind of civilization roleplay happens here?"
        />
      </div>
      <div className="btn-row">
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Saving…" : mode === "edit" ? "Save changes" : "Create server"}
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
