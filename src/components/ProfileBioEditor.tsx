"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";

export default function ProfileBioEditor({
  initialBio,
}: {
  initialBio: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(initialBio);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div>
        {bio ? (
          <p className="profile-bio">{bio}</p>
        ) : (
          <p className="muted">No bio yet.</p>
        )}
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => setEditing(true)}
        >
          Edit bio
        </button>
      </div>
    );
  }

  async function save() {
    setBusy(true);
    setError(null);
    const res = await updateProfile(bio);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="field">
      {error && <div className="alert alert-error">{error}</div>}
      <textarea
        rows={4}
        value={bio}
        maxLength={500}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Tell others who you are in the world: your factions, your role, your story."
      />
      <div className="btn-row">
        <button className="btn btn-sm" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save bio"}
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setBio(initialBio);
            setEditing(false);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
