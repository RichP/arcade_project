"use client";

import { useState } from "react";

export default function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Login failed");
      const next = new URLSearchParams(window.location.search).get("next") || "/admin";
      window.location.href = next;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-white/60 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-2 text-sm text-white"
        />
      </div>
      <button type="submit" className="btn-primary rounded-md px-3 py-1.5 text-sm" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {error && <div className="text-xs text-red-400">{error}</div>}
    </form>
  );
}
