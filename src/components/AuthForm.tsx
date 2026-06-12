"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, register } from "@/app/actions/auth";

export default function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res =
      mode === "login"
        ? await login(username, password)
        : await register(username, password, email || undefined);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push(next || "/");
    router.refresh();
  }

  return (
    <form className="form-narrow" onSubmit={onSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
      </div>
      {mode === "register" && (
        <div className="field">
          <label htmlFor="email">
            Email <span className="muted">(optional, needed to contribute)</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <p className="muted" style={{ fontSize: "0.8rem", margin: "4px 0 0" }}>
            We&apos;ll send a verification link. You can browse without one, but a
            verified email is required to add records or accounts.
          </p>
        </div>
      )}
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="btn-row">
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "…" : mode === "login" ? "Log in" : "Create account"}
        </button>
        {mode === "login" ? (
          <span className="muted">
            New here? <Link href="/register">Sign up</Link>
          </span>
        ) : (
          <span className="muted">
            Have an account? <Link href="/login">Log in</Link>
          </span>
        )}
      </div>
    </form>
  );
}
