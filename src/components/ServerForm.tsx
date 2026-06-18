"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createServer, updateServer } from "@/app/actions/admin";
import { requestServer } from "@/app/actions/requests";

export interface ServerFormInitial {
  id?: string;
  name: string;
  description: string;
  discordUrl: string;
}

export default function ServerForm({
  mode,
  submitMode = "create",
  initial,
}: {
  mode: "create" | "edit";
  // "create" = write directly (archivist); "request" = submit for review (host).
  submitMode?: "create" | "request";
  initial: ServerFormInitial;
}) {
  const router = useRouter();
  const isRequest = submitMode === "request";
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [discordUrl, setDiscordUrl] = useState(initial.discordUrl);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    if (isRequest) {
      const res = await requestServer({ name, description, discordUrl });
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        return;
      }
      setDone(true);
      setBusy(false);
      return;
    }

    const payload = { name, description, discordUrl };
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

  if (done) {
    return (
      <div className="alert alert-success">
        Thanks! Your server suggestion was submitted. An archivist will review it
        and publish it shortly.
      </div>
    );
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
      <div className="field">
        <label htmlFor="discord">
          Discord link{" "}
          <span className="hint">
            {isRequest ? "(required)" : "(optional)"}
          </span>
        </label>
        <input
          id="discord"
          type="url"
          value={discordUrl}
          onChange={(e) => setDiscordUrl(e.target.value)}
          placeholder="https://discord.gg/your-invite"
        />
      </div>
      <div className="btn-row">
        <button className="btn" type="submit" disabled={busy}>
          {busy
            ? "Saving…"
            : isRequest
              ? "Submit for review"
              : mode === "edit"
                ? "Save changes"
                : "Create server"}
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
