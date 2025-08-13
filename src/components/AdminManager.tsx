"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FEED_ADAPTERS, type FeedType } from "@/lib/feedAdapters";
import type { Game } from "@/types/game";

type FormState = Partial<Game> & { id?: string };

export default function AdminManager() {
  const [games, setGames] = useState<Game[]>([]);
  const [tab, setTab] = useState<"games" | "import" | "genres" | "redirects">("games");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ existing: Game; diffs: Record<string, { old?: string; next?: string }> } | null>(null);
  // Feed import state
  const [feedType, setFeedType] = useState<FeedType>("GenericList");
  const [feedUrl, setFeedUrl] = useState("");
  const [feedPreview, setFeedPreview] = useState<Game[] | null>(null);
  const [feedBusy, setFeedBusy] = useState(false);
  // Confetti settings state
  const [confettiProfile, setConfettiProfile] = useState<"subtle" | "celebration" | "low-power">("celebration");
  const [confettiBusy, setConfettiBusy] = useState(false);
  const [confettiMsg, setConfettiMsg] = useState<string | null>(null);
  // Grid Variation setting (two vs three sizes)
  const [gridVariation, setGridVariation] = useState<"two" | "three">("three");
  const [gridBusy, setGridBusy] = useState(false);
  const [gridMsg, setGridMsg] = useState<string | null>(null);
  // Mobile card aspect setting
  const [mobileAspect, setMobileAspect] = useState<"square" | "video">("square");
  const [mobileBusy, setMobileBusy] = useState(false);
  const [mobileMsg, setMobileMsg] = useState<string | null>(null);

  const playable = useMemo(
    () => games.filter((g) => g.id && g.thumbnail && g.url),
    [games]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/games", { cache: "no-store" });
        const json: { ok: boolean; data?: Game[]; error?: string } = await res.json();
        if (!json.ok || !json.data) throw new Error(json.error || "Failed to load");
        setGames(json.data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load games");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load confetti profile
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings/confetti", { cache: "no-store" });
        const j: { ok: boolean; data?: { profile: "subtle" | "celebration" | "low-power" } } = await res.json();
        if (j.ok && j.data?.profile) setConfettiProfile(j.data.profile);
      } catch {}
    })();
  }, []);

  // Load grid variation mode
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings/grid-variation", { cache: "no-store" });
        const j: { ok: boolean; data?: { mode: "two" | "three" } } = await res.json();
        if (j.ok && j.data?.mode) setGridVariation(j.data.mode);
      } catch {}
    })();
  }, []);

  // Load mobile aspect setting
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings/mobile-aspect", { cache: "no-store" });
        const j: { ok: boolean; data?: { value: "square" | "video" } } = await res.json();
        if (j.ok && j.data?.value) setMobileAspect(j.data.value);
      } catch {}
    })();
  }, []);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [filter, setFilter] = useState("");
  const filteredGames = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) =>
      (g.title || "").toLowerCase().includes(q) ||
      (g.id || "").toLowerCase().includes(q) ||
      (g.slug || "").toLowerCase().includes(q)
    );
  }, [games, filter]);
  const totalPages = Math.max(1, Math.ceil(filteredGames.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
  const pagedGames = useMemo(() => filteredGames.slice((page - 1) * pageSize, page * pageSize), [filteredGames, page]);

  const resetForm = () => {
    setEditingId(null);
    setForm({});
  };

  const onEdit = (g: Game) => {
    setEditingId(g.id);
    setForm({ ...g });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement & HTMLTextAreaElement;
    const name = target.name as keyof FormState | string;
    const type = (target as HTMLInputElement).type;
    const checked = (target as HTMLInputElement).checked;
    const value = target.value;
    const v: unknown = type === "checkbox" ? checked : value;
  setForm((f) => ({ ...f, [name]: v as unknown as never }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const isEdit = Boolean(editingId);

      // Duplicate title prevention when adding new
      if (!isEdit) {
        const titleIn = (form.title || "").trim().toLowerCase();
        const existing = games.find((g) => (g.title || "").trim().toLowerCase() === titleIn);
        if (existing) {
          // compute diffs for url/description (and thumbnail)
          const diffs: Record<string, { old?: string; next?: string }> = {};
          const fields: Array<keyof Pick<Game, "url" | "description">> = ["url", "description"];
          for (const k of fields) {
            const oldVal = (existing[k] as string | undefined) || "";
            const nextVal = (form[k] as string | undefined) || "";
            if (nextVal && nextVal.trim() && oldVal.trim() !== nextVal.trim()) {
              diffs[k] = { old: oldVal, next: nextVal };
            }
          }
          if (Object.keys(diffs).length === 0) {
            // Nothing new provided; block duplication
            setBusy(false);
            setError("A game with this title already exists.");
            return;
          }
          // Show alert with option to update existing
          setDuplicate({ existing, diffs });
          setBusy(false);
          return;
        }
      }

      const payload: Record<string, unknown> = {
        ...form,
        // ensure string values are sent for multi-value fields; API will parse
        genre: Array.isArray(form.genre) ? (form.genre as string[]).join(", ") : (form.genre as string | undefined),
        tags: Array.isArray(form.tags) ? (form.tags as string[]).join(", ") : (form.tags as string | undefined),
        platforms: Array.isArray(form.platforms) ? (form.platforms as string[]).join(", ") : (form.platforms as string | undefined),
      };
      const url = isEdit ? `/api/games/${encodeURIComponent(editingId!)}` : "/api/games";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
  const json: { ok: boolean; error?: string } = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to save");
      // Refresh list
      const res2 = await fetch("/api/games", { cache: "no-store" });
  const j2: { ok: boolean; data: Game[] } = await res2.json();
  setGames(j2.data);
      setMessage(isEdit ? "Game updated" : "Game added");
      resetForm();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  // Handle duplicate alert actions
  const applyUpdateToExisting = async () => {
    if (!duplicate) return;
    try {
      setBusy(true);
      setError(null);
      const id = duplicate.existing.id;
      // Build patch from current form for safe updates, do not change title/id
      const patch: Record<string, unknown> = {
        url: form.url,
        description: form.description,
        thumbnail: form.thumbnail,
        featured: form.featured,
        mobile: form.mobile,
        height: form.height,
        width: form.width,
        rating: form.rating,
        released: form.released,
        genre: Array.isArray(form.genre) ? (form.genre as string[]).join(", ") : (form.genre as string | undefined),
        tags: Array.isArray(form.tags) ? (form.tags as string[]).join(", ") : (form.tags as string | undefined),
        platforms: Array.isArray(form.platforms) ? (form.platforms as string[]).join(", ") : (form.platforms as string | undefined),
      };
      const res = await fetch(`/api/games/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json: { ok: boolean; error?: string } = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to update");
      const res2 = await fetch("/api/games", { cache: "no-store" });
      const j2: { ok: boolean; data: Game[] } = await res2.json();
      setGames(j2.data);
      setMessage("Updated existing game");
      setDuplicate(null);
      resetForm();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const dismissDuplicate = () => setDuplicate(null);

  const onDelete = async (g: Game) => {
  const proceed = typeof window !== "undefined" ? window.confirm(`Delete \"${g.title}\"? This cannot be undone.`) : false;
    if (!proceed) return;
    try {
      setBusy(true);
      setError(null);
      const res = await fetch(`/api/games/${encodeURIComponent(g.id)}`, { method: "DELETE" });
      const json: { ok: boolean; error?: string } = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to delete");
      // Refresh list
      const res2 = await fetch("/api/games", { cache: "no-store" });
      const j2: { ok: boolean; data: Game[] } = await res2.json();
      setGames(j2.data);
      setMessage("Game deleted");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { k: "games", label: "Games" },
          { k: "import", label: "Import" },
          { k: "genres", label: "Genre Mapping" },
          { k: "redirects", label: "Redirects" },
        ].map(({ k, label }) => (
          <button
            key={k}
            onClick={() => setTab(k as typeof tab)}
            className={`px-3 py-1.5 rounded-md text-sm border ${tab === k ? "btn-primary" : "chip"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Import Tab */}
      {tab === "import" && (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
  <h2 className="text-white/90 font-semibold mb-2 text-sm">Import from Feed (JSON or XML)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-white/60 mb-1">Feed Type</label>
            <select
              value={feedType}
              onChange={(e) => setFeedType(e.target.value as FeedType)}
              className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
            >
              {FEED_ADAPTERS.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-white/60 mb-1">Feed URL</label>
            <input
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://example.com/feed.json • https://gamemonetize.com/feed.php?format=0&page=1 • https://www.onlinegames.io/media/plugins/genGames/embed.json"
              className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
            />
          </div>
        </div>
        {/* Mapping visualization */}
        <div className="mt-3 text-xs text-white/70">
          <p className="mb-1">Mapping:</p>
          <ul className="list-disc ml-5 grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {FEED_ADAPTERS.find((a) => a.id === feedType)?.describeMapping.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="btn-primary rounded-md px-3 py-1.5 text-sm"
            disabled={feedBusy || !feedUrl}
            onClick={async () => {
              try {
                setFeedBusy(true);
                setError(null);
                setMessage(null);
                const res = await fetch(`/api/import?url=${encodeURIComponent(feedUrl)}`, { cache: "no-store" });
                const j = await res.json();
                if (!j.ok) throw new Error(j.error || "Failed to fetch feed");
                const adapter = FEED_ADAPTERS.find((a) => a.id === feedType)!;
                const parsed = adapter.parse(j.data);
                // De-duplicate by title against existing list AND within this feed
                const seen = new Set<string>(games.map((g) => (g.title || "").trim().toLowerCase()));
                const unique: Game[] = [];
                for (const g of parsed) {
                  const key = (g.title || "").trim().toLowerCase();
                  if (!key || seen.has(key)) continue;
                  seen.add(key);
                  unique.push(g);
                }
                setFeedPreview(unique);
                setMessage(`Preview: ${unique.length} new of ${parsed.length} parsed (duplicates omitted)`);
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Failed to preview feed");
                setFeedPreview(null);
              } finally {
                setFeedBusy(false);
                setTimeout(() => setMessage(null), 3000);
              }
            }}
          >
            {feedBusy ? "Fetching…" : "Preview"}
          </button>
          <button
            type="button"
            className="chip rounded-md px-3 py-1.5 text-sm border"
            disabled={feedBusy || !feedPreview || feedPreview.length === 0}
            onClick={async () => {
              if (!feedPreview) return;
              try {
                setFeedBusy(true);
                setError(null);
                // Import sequentially to keep API simple; could be batched later.
                for (const item of feedPreview) {
                  const payload: Record<string, unknown> = {
                    ...item,
                    // ensure API accepts strings for arrays
                    genre: Array.isArray(item.genre) ? item.genre.join(", ") : item.genre,
                    tags: Array.isArray(item.tags) ? item.tags.join(", ") : item.tags,
                    platforms: Array.isArray(item.platforms) ? item.platforms.join(", ") : item.platforms,
                  };
                  const res = await fetch("/api/games", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const jr = await res.json();
                  if (!jr.ok) {
                    // Continue but surface last error
                    throw new Error(jr.error || "Failed to import an item");
                  }
                }
                // Refresh local list
                const res2 = await fetch("/api/games", { cache: "no-store" });
                const j2: { ok: boolean; data: Game[] } = await res2.json();
                setGames(j2.data);
                setMessage(`Imported ${feedPreview.length} games`);
                setFeedPreview(null);
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Failed to import feed");
              } finally {
                setFeedBusy(false);
                setTimeout(() => setMessage(null), 3000);
              }
            }}
          >
            Import
          </button>
          {message && <span className="text-emerald-400 text-xs">{message}</span>}
          {error && <span className="text-red-400 text-xs">{error}</span>}
        </div>

        {/* Preview table */}
        {feedPreview && (
          <div className="mt-3 rounded-lg border border-white/10 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-white/60">
                <tr>
                  <th className="px-3 py-2 border-b border-white/10">Title</th>
                  <th className="px-3 py-2 border-b border-white/10">URL</th>
                  <th className="px-3 py-2 border-b border-white/10">Thumb</th>
                  <th className="px-3 py-2 border-b border-white/10">Genre</th>
                </tr>
              </thead>
              <tbody>
                {feedPreview.map((g) => (
                  <tr key={`${g.title}-${g.url}`} className="text-white/80">
                    <td className="px-3 py-2 align-top text-white">{g.title}</td>
                    <td className="px-3 py-2 align-top text-white/70 truncate max-w-[24ch]">
                      <a href={g.url} target="_blank" rel="noreferrer" className="text-[var(--primary)] underline">{g.url}</a>
                    </td>
                    <td className="px-3 py-2 align-top text-white/70 truncate max-w-[20ch]">{g.thumbnail}</td>
                    <td className="px-3 py-2 align-top text-white/70">{(g.genre || []).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
  </div>
  )}

  {/* Games Tab: Add/Edit + List with pagination */}
  {tab === "games" && (
  <>
  {/* Site Settings */}
  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
    <h2 className="text-white/90 font-semibold mb-2 text-sm">Site Settings</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
      <div>
        <label className="block text-xs text-white/60 mb-1">Confetti Profile</label>
        <select
          value={confettiProfile}
          onChange={(e) => setConfettiProfile(e.target.value as typeof confettiProfile)}
          className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
        >
          <option value="subtle">Subtle</option>
          <option value="celebration">Celebration</option>
          <option value="low-power">Low power</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-white/60 mb-1">Grid Variation</label>
        <select
          value={gridVariation}
          onChange={(e) => setGridVariation(e.target.value as typeof gridVariation)}
          className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
        >
          <option value="three">Three sizes (tall, square, normal)</option>
          <option value="two">Two sizes (tall, normal)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-white/60 mb-1">Mobile Card Aspect</label>
        <select
          value={mobileAspect}
          onChange={(e) => setMobileAspect(e.target.value as typeof mobileAspect)}
          className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
        >
          <option value="square">Square (1:1)</option>
          <option value="video">Video (16:9)</option>
        </select>
      </div>
      <div className="sm:col-span-2 flex items-center gap-2">
        <button
          type="button"
          className="btn-primary rounded-md px-3 py-1.5 text-sm"
          disabled={confettiBusy}
          onClick={async () => {
            try {
              setConfettiBusy(true);
              setConfettiMsg(null);
              const res = await fetch("/api/settings/confetti", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ profile: confettiProfile }),
              });
              const j = await res.json();
              if (!j.ok) throw new Error(j.error || "Failed to save settings");
              setConfettiMsg("Saved");
            } catch (e: unknown) {
              setConfettiMsg(e instanceof Error ? e.message : "Failed to save");
            } finally {
              setConfettiBusy(false);
              setTimeout(() => setConfettiMsg(null), 2000);
            }
          }}
        >
          {confettiBusy ? "Saving…" : "Save"}
        </button>
        {confettiMsg && <span className="text-xs text-white/70">{confettiMsg}</span>}
      </div>
      <div className="sm:col-span-2 flex items-center gap-2">
        <button
          type="button"
          className="btn-primary rounded-md px-3 py-1.5 text-sm"
          disabled={gridBusy}
          onClick={async () => {
            try {
              setGridBusy(true);
              setGridMsg(null);
              const res = await fetch("/api/settings/grid-variation", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ mode: gridVariation }),
              });
              const j = await res.json();
              if (!j.ok) throw new Error(j.error || "Failed to save settings");
              setGridMsg("Saved");
            } catch (e: unknown) {
              setGridMsg(e instanceof Error ? e.message : "Failed to save");
            } finally {
              setGridBusy(false);
              setTimeout(() => setGridMsg(null), 2000);
            }
          }}
        >
          {gridBusy ? "Saving…" : "Save Grid Settings"}
        </button>
        {gridMsg && <span className="text-xs text-white/70">{gridMsg}</span>}
      </div>
      <div className="sm:col-span-2 flex items-center gap-2">
        <button
          type="button"
          className="btn-primary rounded-md px-3 py-1.5 text-sm"
          disabled={mobileBusy}
          onClick={async () => {
            try {
              setMobileBusy(true);
              setMobileMsg(null);
              const res = await fetch("/api/settings/mobile-aspect", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ value: mobileAspect }),
              });
              const j = await res.json();
              if (!j.ok) throw new Error(j.error || "Failed to save settings");
              setMobileMsg("Saved");
            } catch (e: unknown) {
              setMobileMsg(e instanceof Error ? e.message : "Failed to save");
            } finally {
              setMobileBusy(false);
              setTimeout(() => setMobileMsg(null), 2000);
            }
          }}
        >
          {mobileBusy ? "Saving…" : "Save Mobile Aspect"}
        </button>
        {mobileMsg && <span className="text-xs text-white/70">{mobileMsg}</span>}
      </div>
    </div>
  </div>
  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="text-white/90 font-semibold mb-2 text-sm">Add / Edit Game</h2>
        {duplicate && (
          <div className="mb-3 rounded-lg border border-amber-600/40 bg-amber-950/30 p-3 text-amber-200">
            <p className="text-sm font-medium">A game with this title already exists.</p>
            {Object.keys(duplicate.diffs).length > 0 && (
              <div className="mt-2 text-xs text-amber-200/90 space-y-1">
                {Object.entries(duplicate.diffs).map(([k, v]) => (
                  <div key={k}>
                    <span className="font-semibold">{k}:</span> &quot;{v.old || ""}&quot; → &quot;{v.next || ""}&quot;
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <button type="button" className="btn-primary rounded-md px-3 py-1.5 text-sm" onClick={applyUpdateToExisting} disabled={busy}>
                Update existing
              </button>
              <button type="button" className="chip rounded-md px-3 py-1.5 text-sm border" onClick={dismissDuplicate}>
                Dismiss
              </button>
            </div>
          </div>
        )}
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/60 mb-1">Title *</label>
            <input name="title" value={form.title || ""} onChange={onChange} className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white" required />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">ID (optional)</label>
            <input name="id" value={form.id || ""} onChange={onChange} className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white" placeholder="auto if blank or duplicate" />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Slug</label>
            <input
              name="slug"
              value={(form.slug as string | undefined) || ""}
              onChange={onChange}
              className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
              placeholder="auto from title; must be URL-safe"
              pattern="[a-z0-9\-]+"
              title="Lowercase letters, numbers and dashes only"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-white/60 mb-1">URL *</label>
            <input name="url" value={form.url || ""} onChange={onChange} className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white" required />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-white/60 mb-1">Thumbnail *</label>
            <input name="thumbnail" value={form.thumbnail || ""} onChange={onChange} className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white" required />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-white/60 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description || ""}
              onChange={onChange}
              rows={4}
              className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
              placeholder="Short description of the game"
            />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Featured</label>
            <input type="checkbox" name="featured" checked={Boolean(form.featured)} onChange={onChange} />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Mobile</label>
            <input type="checkbox" name="mobile" checked={Boolean(form.mobile)} onChange={onChange} />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Height</label>
            <input type="number" name="height" value={form.height ?? ""} onChange={onChange} className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Width</label>
            <input type="number" name="width" value={form.width ?? ""} onChange={onChange} className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Rating</label>
            <input type="number" step="0.1" name="rating" value={form.rating ?? ""} onChange={onChange} className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Released</label>
            <input name="released" value={form.released || ""} onChange={onChange} className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white" placeholder="YYYY-MM-DD" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-white/60 mb-1">Genre (comma or newline separated)</label>
            <textarea
              name="genre"
              value={Array.isArray(form.genre) ? form.genre.join(", ") : ((form.genre as string | undefined) ?? "")}
              onChange={onChange}
              rows={2}
              className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-white/60 mb-1">Tags (comma or newline separated)</label>
            <textarea
              name="tags"
              value={Array.isArray(form.tags) ? form.tags.join(", ") : ((form.tags as string | undefined) ?? "")}
              onChange={onChange}
              rows={2}
              className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-white/60 mb-1">Platforms (comma or newline separated)</label>
            <textarea
              name="platforms"
              value={Array.isArray(form.platforms) ? form.platforms.join(", ") : ((form.platforms as string | undefined) ?? "")}
              onChange={onChange}
              rows={2}
              className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <button className="btn-primary rounded-md px-3 py-1.5 text-sm" disabled={busy} type="submit">
              {editingId ? (busy ? "Saving..." : "Save Changes") : busy ? "Adding..." : "Add Game"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="chip rounded-md px-3 py-1.5 text-sm border">Cancel</button>
            )}
            {message && <span className="text-emerald-400 text-xs">{message}</span>}
            {error && <span className="text-red-400 text-xs">{error}</span>}
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-white/90 font-semibold text-sm">Existing Games ({filteredGames.length}{filter ? ` of ${games.length}` : ""})</h3>
          <div className="flex items-center gap-2">
            <input
              value={filter}
              onChange={(e) => { setPage(1); setFilter(e.target.value); }}
              placeholder="Filter by title, id or slug…"
              className="rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-xs text-white"
            />
            <a
              href="/api/backup?download=1"
              className="chip rounded-md px-2 py-1 text-xs border"
              title="Download a JSON backup of all games"
            >
              Download backup (JSON)
            </a>
            <label className="chip rounded-md px-2 py-1 text-xs border cursor-pointer">
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setBusy(true);
                    setError(null);
                    const text = await file.text();
                    const json = JSON.parse(text);
                    const res = await fetch("/api/backup", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify(json),
                    });
                    const j = await res.json();
                    if (!j.ok) throw new Error(j.error || "Restore failed");
                    const res2 = await fetch("/api/games", { cache: "no-store" });
                    const j2: { ok: boolean; data: Game[] } = await res2.json();
                    setGames(j2.data);
                    setMessage(`Restored ${j.data?.count ?? 0} games`);
                  } catch (e: unknown) {
                    setError(e instanceof Error ? e.message : "Restore failed");
                  } finally {
                    setBusy(false);
                    (e.target as HTMLInputElement).value = "";
                    setTimeout(() => setMessage(null), 2000);
                  }
                }}
              />
              Restore from file
            </label>
            <button
            type="button"
            className="chip rounded-md px-2 py-1 text-xs border text-red-300 hover:text-red-900"
            onClick={async () => {
              if (typeof window !== "undefined") {
                const ok = window.confirm("Delete ALL games? This will not affect genre mappings. This cannot be undone.");
                if (!ok) return;
              }
              try {
                setBusy(true);
                setError(null);
                const res = await fetch("/api/games", { method: "DELETE" });
                const j: { ok: boolean; data?: { deleted: number }; error?: string } = await res.json();
                if (!j.ok) throw new Error(j.error || "Failed to delete all games");
                const res2 = await fetch("/api/games", { cache: "no-store" });
                const j2: { ok: boolean; data: Game[] } = await res2.json();
                setGames(j2.data);
                setMessage(`Deleted ${j.data?.deleted ?? 0} games`);
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Failed to delete all games");
              } finally {
                setBusy(false);
                setTimeout(() => setMessage(null), 2000);
              }
            }}
            >
              Delete all
            </button>
          </div>
        </div>
        {/* Pager */}
  <div className="flex items-center gap-2 mb-2 text-xs text-white/70">
          <button className="chip rounded-md px-2 py-1 border" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <span>Page {page} / {totalPages}</span>
          <button className="chip rounded-md px-2 py-1 border" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
        </div>
        {loading ? (
          <p className="text-white/60 text-sm">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {pagedGames.map((g) => (
              <div key={g.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-medium text-sm">{g.title}</div>
                  <div className="text-white/60 text-xs">{g.id}{g.slug ? ` • ${g.slug}` : ""}</div>
                  <div className="text-white/60 text-xs">{(g.genre || []).join(", ")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="chip rounded-md px-2 py-1 text-xs border" onClick={() => onEdit(g)}>Edit</button>
                  <button className="chip rounded-md px-2 py-1 text-xs border text-red-300 hover:text-red-900" onClick={() => onDelete(g)} type="button">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
      
    <p className="text-white/50 text-xs">Playable: {playable.length} / {games.length}</p>
  </>
    )}

      {/* Genre Mapping Tab */}
  {tab === "genres" && <GenreMappingManager games={games} />}
  {tab === "redirects" && <RedirectsManager />}
    </div>
  );
}

function GenreMappingManager({ games }: { games: Game[] }) {
  const [rows, setRows] = useState<{ id?: string; name: string; includes: string[]; emoji?: string }[]>([]);
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    // build available genres from games
    const set = new Set<string>();
    for (const g of games) if (Array.isArray(g.genre)) for (const t of g.genre) if (t && t.trim()) set.add(t.trim());
    setAllGenres(Array.from(set).sort((a,b)=>a.localeCompare(b)));
  }, [games]);

  useEffect(() => {
  (async () => {
      try {
        const res = await fetch("/api/genres", { cache: "no-store" });
    const j: { ok: boolean; data?: { id: string; name: string; includes: string[]; emoji?: string }[] } = await res.json();
        if (j.ok && j.data) {
          setRows(j.data);
          // collapse all loaded rows by default
          setExpanded(new Set());
        }
      } catch {}
    })();
  }, []);

  const keyFor = (idx: number, r: { id?: string }) => r.id ?? `__i_${idx}`;
  const isExpanded = (idx: number, r: { id?: string }) => expanded.has(keyFor(idx, r));
  const setRowExpanded = (idx: number, r: { id?: string }, on: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const k = keyFor(idx, r);
      if (on) next.add(k); else next.delete(k);
      return next;
    });
  };

  const addRow = () =>
    setRows((r) => {
      const next = [...r, { name: "", includes: [], emoji: "" }];
      const idx = next.length - 1;
      // expand new row
      setExpanded((prev) => new Set([...prev, `__i_${idx}`]));
      return next;
    });
  const saveRow = async (idx: number) => {
    try {
      setBusy(true);
      setError(null);
      const row = rows[idx];
      const method = row.id ? "PUT" : "POST";
      const url = row.id ? `/api/genres/${encodeURIComponent(row.id)}` : "/api/genres";
    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify({ name: row.name, includes: row.includes, emoji: (row.emoji || "").trim() || undefined }) });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Failed to save mapping");
  const saved = j.data as { id: string; name: string; includes: string[]; emoji?: string };
  setRows((r) => r.map((x, i) => (i === idx ? saved : x)));
  // collapse after save
  setRowExpanded(idx, saved, false);
      setMessage("Saved");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2000);
    }
  };
  const deleteRow = async (idx: number) => {
    const row = rows[idx];
    if (!row?.id) { setRows((r) => r.filter((_,i)=>i!==idx)); return; }
    try {
      if (typeof window !== "undefined") {
        const ok = window.confirm(`Delete mapping "${row.name}"? This cannot be undone.`);
        if (!ok) return;
      }
      setBusy(true);
      setError(null);
      const res = await fetch(`/api/genres/${encodeURIComponent(row.id)}`, { method: "DELETE" });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Failed to delete");
      setRows((r) => r.filter((_,i)=>i!==idx));
      setMessage("Deleted");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
      <h2 className="text-white/90 font-semibold text-sm">Genre Lookup</h2>
      <p className="text-white/60 text-xs">Group many source genres into one canonical type.</p>
      <div className="flex items-center gap-2 text-xs">
        <button className="btn-primary rounded-md px-3 py-1.5" onClick={addRow}>Add Row</button>
        {message && <span className="text-emerald-400">{message}</span>}
        {error && <span className="text-red-400">{error}</span>}
      </div>
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={row.id ?? idx} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-2">
            {/* Collapsed view */}
            {!isExpanded(idx, row) && (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-medium text-sm truncate flex items-center gap-2">
                    {row.emoji && <span aria-hidden className="inline-grid place-items-center" style={{ fontSize: 16, lineHeight: 1 }}>{row.emoji}</span>}
                    <span>{row.name || "(Untitled)"}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {(row.includes || []).map((g) => (
                      <span key={g} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-white/10 border border-white/15 text-white">{g}</span>
                    ))}
                    {(!row.includes || row.includes.length === 0) && (
                      <span className="text-white/40 text-xs">No genres selected</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="chip rounded-md px-3 py-1.5 border text-xs" onClick={() => setRowExpanded(idx, row, true)}>Edit</button>
                  <button className="chip rounded-md px-3 py-1.5 border text-xs text-red-300 hover:text-red-900" onClick={() => deleteRow(idx)}>Delete</button>
                </div>
              </div>
            )}

            {/* Expanded editor */}
            {isExpanded(idx, row) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Canonical Type</label>
                <input
                  className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
                  value={row.name}
                  onChange={(e) => setRows((r) => r.map((x,i)=> i===idx ? { ...x, name: e.target.value } : x))}
                  placeholder="e.g. Mahjong"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Emoji</label>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Genre emoji"
                    className="flex-1 rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
                    value={row.emoji || ""}
                    onChange={(e) => setRows((r) => r.map((x,i)=> i===idx ? { ...x, emoji: e.target.value } : x))}
                    placeholder="e.g. 🀄 🧩 🎯"
                  />
                  <details className="relative">
                    <summary className="chip rounded-md px-2 py-1 border text-xs cursor-pointer select-none">Pick</summary>
                    <div className="absolute z-10 mt-1 right-0 w-56 rounded-md border border-white/10 bg-[#0f121a] p-2 shadow-lg grid grid-cols-8 gap-1">
                      {(["🀄","🃏","🧩","🔎","🫧","🎱","🕹️","🧠","🎯","⏱️","⚙️","♟️","🧸","🗺️","🧪","🎮","🧱","🧿","♠️","♦️","♥️","♣️"]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          className="h-7 w-7 rounded grid place-items-center hover:bg-white/10"
                          onClick={() => setRows((r) => r.map((x,i)=> i===idx ? { ...x, emoji: g } : x))}
                          aria-label={`Choose ${g}`}
                        >
                          <span aria-hidden>{g}</span>
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
                <p className="mt-1 text-[10px] text-white/40">Optional. One emoji works best.</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-white/60 mb-1">Includes genres</label>
                <ChipsMultiSelect
                  options={allGenres}
                  value={row.includes}
                  onChange={(vals) => setRows((r) => r.map((x,i)=> i===idx ? { ...x, includes: vals } : x))}
                />
              </div>
            </div>
            )}
            {isExpanded(idx, row) && (
              <div className="flex items-center gap-2 text-xs">
                <button className="btn-primary rounded-md px-3 py-1.5" disabled={busy} onClick={() => saveRow(idx)}>Save</button>
                <button className="chip rounded-md px-3 py-1.5 border" disabled={busy} onClick={() => setRowExpanded(idx, row, false)}>Cancel</button>
                <button className="chip rounded-md px-3 py-1.5 border text-red-300 hover:text-red-900" disabled={busy} onClick={() => deleteRow(idx)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RedirectsManager() {
  const [rows, setRows] = useState<Array<{ oldSlug: string; gameId: string; currentSlug: string | null; title: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/redirects", { cache: "no-store" });
      const j: { ok: boolean; data?: typeof rows; error?: string } = await res.json();
      if (!j.ok || !j.data) throw new Error(j.error || "Failed to load redirects");
      setRows(j.data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onDelete = async (oldSlug: string) => {
    try {
      if (typeof window !== "undefined") {
        const ok = window.confirm(`Remove redirect for "${oldSlug}"?`);
        if (!ok) return;
      }
      setBusy(true);
      setErr(null);
      const res = await fetch(`/api/redirects/${encodeURIComponent(oldSlug)}`, { method: "DELETE" });
      const j: { ok: boolean; error?: string } = await res.json();
      if (!j.ok) throw new Error(j.error || "Failed to delete");
      setRows((r) => r.filter((x) => x.oldSlug !== oldSlug));
      setMsg("Deleted");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 1500);
    }
  };

  const onBackfill = async () => {
    if (!file) { setErr("Choose a backup JSON file first"); return; }
    try {
      setBusy(true);
      setErr(null);
      setMsg(null);
      const text = await file.text();
      const body = JSON.parse(text);
      const res = await fetch("/api/redirects/backfill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j: { ok: boolean; created?: number; error?: string } = await res.json();
      if (!j.ok) throw new Error(j.error || "Backfill failed");
      setMsg(`Backfilled ${j.created ?? 0} redirects`);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Backfill failed");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 2500);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
      <h2 className="text-white/90 font-semibold text-sm">Legacy Slug Redirects</h2>
      <p className="text-white/60 text-xs">Manage 302 redirects from historical slugs to current canonical slugs.</p>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="text-xs text-white/70">{loading ? "Loading…" : `${rows.length} redirect${rows.length === 1 ? "" : "s"}`}</div>
        <div className="flex gap-2 items-center">
          <input type="file" accept="application/json" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-xs" />
          <button className="btn-primary rounded-md px-3 py-1.5 text-sm disabled:opacity-50" disabled={busy || !file} onClick={onBackfill}>Backfill from backup</button>
        </div>
      </div>
      {err && <div className="text-red-400 text-xs">{err}</div>}
      {msg && <div className="text-emerald-400 text-xs">{msg}</div>}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="text-white/60">
            <tr>
              <th className="px-3 py-2 border-b border-white/10">Old slug</th>
              <th className="px-3 py-2 border-b border-white/10">Game</th>
              <th className="px-3 py-2 border-b border-white/10">Current slug</th>
              <th className="px-3 py-2 border-b border-white/10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-2 text-white/60" colSpan={4}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-2 text-white/60" colSpan={4}>No redirects</td></tr>
            ) : rows.map((r) => (
              <tr key={r.oldSlug} className="text-white/80 hover:bg-white/[0.03]">
                <td className="px-3 py-2 align-top font-mono">{r.oldSlug}</td>
                <td className="px-3 py-2 align-top">
                  {r.title ? <span className="text-white">{r.title}</span> : <span className="text-white/60">(missing)</span>}
                  <span className="text-white/40 ml-2">[{r.gameId}]</span>
                </td>
                <td className="px-3 py-2 align-top font-mono">{r.currentSlug || <span className="text-white/60">(none)</span>}</td>
                <td className="px-3 py-2 align-top">
                  <button className="chip rounded-md px-2 py-1 text-xs border" disabled={busy} onClick={() => onDelete(r.oldSlug)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ChipsMultiSelect({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const selected = new Set(value);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query ? options.filter((o) => o.toLowerCase().includes(query)) : options;
    const selectedSet = new Set(value);
    // Show selected first
    return [
      ...base.filter((o) => selectedSet.has(o)),
      ...base.filter((o) => !selectedSet.has(o)),
    ];
  }, [options, q, value]);

  const toggle = (opt: string) => {
    const next = new Set(value);
    if (next.has(opt)) next.delete(opt); else next.add(opt);
    onChange(Array.from(next));
  };

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 min-h-7">
        {value.length === 0 ? (
          <span className="text-white/40 text-xs">No genres selected</span>
        ) : (
          value.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => toggle(v)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-white/10 border border-white/15 text-white hover:bg-white/20"
              title="Click to remove"
            >
              {v}
              <span aria-hidden>×</span>
            </button>
          ))
        )}
      </div>

      {/* Filter input */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter genres…"
        className="w-full rounded-md bg-[#1a1d29] border border-[#262a3a] px-2 py-1 text-sm text-white"
      />

      {/* Options list */}
      <div className="max-h-48 overflow-auto rounded-md border border-white/10 bg-black/20 divide-y divide-white/5">
        {filtered.map((opt) => {
          const isSel = selected.has(opt);
          return (
            <button
              type="button"
              key={opt}
              onClick={() => toggle(opt)}
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-white/10 ${isSel ? "bg-white/10" : ""}`}
              aria-pressed={isSel}
            >
              <span className={`inline-block h-3 w-3 rounded-sm border ${isSel ? "bg-[var(--primary)] border-[var(--primary)]" : "border-white/30"}`} />
              <span className="text-white/90">{opt}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-xs text-white/50">No matches</div>
        )}
      </div>
    </div>
  );
}
