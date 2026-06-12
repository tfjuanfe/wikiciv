"use client";

import { useState, useTransition } from "react";
import { setEmailAndSendVerification, resendVerification } from "@/app/actions/verify";
import Icon from "./Icon";

export default function EmailVerification({
  email,
  verified,
}: {
  email: string | null;
  verified: boolean;
}) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(email ?? "");
  const [editing, setEditing] = useState(!email);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function save() {
    setMsg(null);
    start(async () => {
      const res = await setEmailAndSendVerification(value);
      if (!res.ok) {
        setMsg({ ok: false, text: res.error });
        return;
      }
      setEditing(false);
      setMsg({ ok: true, text: "Verification email sent. Check your inbox." });
    });
  }

  function resend() {
    setMsg(null);
    start(async () => {
      const res = await resendVerification();
      setMsg(
        res.ok
          ? { ok: true, text: "Verification email re-sent. Check your inbox." }
          : { ok: false, text: res.error },
      );
    });
  }

  return (
    <section className="card" style={{ marginBottom: 20 }}>
      <h2 className="section-title" style={{ marginTop: 0 }}>
        <span className="cube-bullet" aria-hidden /> Email &amp; verification
      </h2>

      {verified ? (
        <p className="muted" style={{ margin: "0 0 8px" }}>
          <strong className="verified-tag">
            <Icon name="check" /> Verified
          </strong>
          {": "}
          {email}. You can contribute records and accounts.
        </p>
      ) : (
        <p className="muted" style={{ margin: "0 0 8px" }}>
          {email
            ? `Your email (${email}) isn't verified yet. A verified email is required to contribute.`
            : "You haven't added an email. Add and verify one to start contributing."}
        </p>
      )}

      {msg && (
        <div
          className={`alert ${msg.ok ? "alert-success" : "alert-error"}`}
          style={{ margin: "8px 0" }}
        >
          {msg.text}
        </div>
      )}

      {editing ? (
        <div className="field" style={{ maxWidth: 360 }}>
          <label htmlFor="me-email">Email address</label>
          <input
            id="me-email"
            type="email"
            autoComplete="email"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="you@example.com"
          />
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button className="btn btn-sm" type="button" onClick={save} disabled={pending}>
              {pending ? "…" : "Send verification link"}
            </button>
            {email && (
              <button
                className="btn btn-sm btn-secondary"
                type="button"
                onClick={() => {
                  setValue(email);
                  setEditing(false);
                  setMsg(null);
                }}
                disabled={pending}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        !verified && (
          <div className="btn-row">
            <button className="btn btn-sm" type="button" onClick={resend} disabled={pending}>
              {pending ? "…" : "Resend verification email"}
            </button>
            <button
              className="btn btn-sm btn-secondary"
              type="button"
              onClick={() => setEditing(true)}
              disabled={pending}
            >
              Change email
            </button>
          </div>
        )
      )}
    </section>
  );
}
