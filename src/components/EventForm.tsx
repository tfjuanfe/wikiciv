"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent, type EventInput } from "@/app/actions/admin";

interface ServerOption {
  id: string;
  name: string;
}

export interface EventFormInitial {
  id?: string;
  serverId: string;
  name: string;
  theme: string;
  startDate: string;
  endDate: string;
  status: "ongoing" | "concluded";
  description: string;
}

export default function EventForm({
  mode,
  servers,
  initial,
}: {
  mode: "create" | "edit";
  servers: ServerOption[];
  initial: EventFormInitial;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [serverId, setServerId] = useState(initial.serverId);
  const [name, setName] = useState(initial.name);
  const [theme, setTheme] = useState(initial.theme);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [status, setStatus] = useState<"ongoing" | "concluded">(initial.status);
  const [description, setDescription] = useState(initial.description);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const payload: EventInput = {
      serverId,
      name,
      theme,
      startDate,
      endDate,
      status,
      description,
    };
    const res = isEdit
      ? await updateEvent(initial.id!, payload)
      : await createEvent(payload);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push(`/events/${res.id}`);
    router.refresh();
  }

  return (
    <form className="form-wrap" onSubmit={onSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="field">
        <label htmlFor="server">Server</label>
        {isEdit ? (
          <input
            type="text"
            value={servers.find((s) => s.id === serverId)?.name ?? ""}
            disabled
          />
        ) : (
          <select
            id="server"
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
          >
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="field">
        <label htmlFor="name">Event name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. The Ashen Era"
        />
      </div>

      <div className="field">
        <label htmlFor="theme">Theme</label>
        <input
          id="theme"
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g. Rise & fall of nations"
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="start">Start date</label>
          <input
            id="start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="end">
            End date{" "}
            <span className="hint">(required if concluded)</span>
          </label>
          <input
            id="end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label>Status</label>
        <div className="tag-row">
          <button
            type="button"
            className={`btn btn-sm ${status === "ongoing" ? "" : "btn-secondary"}`}
            onClick={() => setStatus("ongoing")}
          >
            Ongoing
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              status === "concluded" ? "" : "btn-secondary"
            }`}
            onClick={() => setStatus("concluded")}
          >
            Concluded
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="desc">Description</label>
        <textarea
          id="desc"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short summary of what happened during this event."
        />
      </div>

      <div className="btn-row">
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create event"}
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
