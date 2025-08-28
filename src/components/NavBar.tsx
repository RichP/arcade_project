"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/types/game";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState("");
  const [gamesList, setGamesList] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [menuOpenAnnounce, setMenuOpenAnnounce] = useState<string | null>(null);

  // Load games from API to avoid importing a JSON module that we mutate at runtime
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingGames(true);
        const res = await fetch("/api/games", { cache: "no-store" });
        const json: { ok: boolean; data?: Game[] } = await res.json();
        if (!cancelled && json.ok && Array.isArray(json.data)) {
          setGamesList(json.data);
        }
      } finally {
        if (!cancelled) setLoadingGames(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRandom = useCallback(() => {
    // Base playable list
  const base: Game[] = (gamesList as Game[]).filter(
      (g) => !!g && !!g.id && typeof g.thumbnail === "string" && !!g.thumbnail && typeof g.url === "string" && !!g.url
    );

    let pool = base;

    // Apply Favorites filter if active
    const tab = sp?.get("tab") || "";
    if (tab === "favorites") {
      try {
        const raw = localStorage.getItem("favorites");
        const favIds: string[] = raw ? JSON.parse(raw) : [];
        pool = pool.filter((g) => favIds.includes(g.id));
      } catch {
        // ignore parse errors and fallback to base
      }
    }

    // Apply genre filter if present
    const genre = (sp?.get("genre") || "").toLowerCase();
    if (genre) {
      pool = pool.filter((g) => Array.isArray(g.genre) && g.genre.some((x) => (x || "").toLowerCase().includes(genre)));
    }

    // If on search page and q present, apply same basic search logic
    const q = (sp?.get("q") || "").toLowerCase().trim();
    const onSearch = pathname?.startsWith("/search");
    if (onSearch && q) {
      pool = pool.filter((g) => {
        const inTitle = (g.title || "").toLowerCase().includes(q);
        const inTags = Array.isArray(g.tags) ? g.tags.some((t) => (t || "").toLowerCase().includes(q)) : false;
        const inGenre = Array.isArray(g.genre) ? g.genre.some((t) => (t || "").toLowerCase().includes(q)) : false;
        return inTitle || inTags || inGenre;
      });
    }

    // Fallback to base if nothing matched, with a brief toast
    let list = pool;
    if (!pool.length) {
      setToast("No games match current filters. Picking from all games.");
      setTimeout(() => setToast(""), 2500);
      list = base;
    }
    if (!list.length) return;
    const idx = Math.floor(Math.random() * list.length);
    const chosen = list[idx];
    router.push(`/play/${encodeURIComponent(chosen.id)}`);
  }, [pathname, router, sp, gamesList]);

  const qOnSearchPage = pathname?.startsWith("/search") ? sp?.get("q") ?? "" : "";
  const activeTab = sp?.get("tab") || "";
  const activeGenre = sp?.get("genre") || "";
  const hasFilter = Boolean(activeTab || activeGenre);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      const el = inputRef.current;
      if (el) {
        el.value = "";
        el.blur();
      }
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.includes("Mac");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Dynamic accessible label for Random scope
  const tab = sp?.get("tab") || "";
  const genre = sp?.get("genre") || "";
  const q = sp?.get("q") || "";
  const onSearch = pathname?.startsWith("/search");
  let randomScope = "all games";
  if (tab === "favorites") randomScope = "Favorites";
  else if (genre) randomScope = `${genre} games`;
  else if (onSearch && q) randomScope = `search results for \"${q}\"`;

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur border-b border-black/20 shadow-sm"
      style={{ backgroundColor: "var(--nav-bg)" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Hamburger (mobile) + Logo (Home) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10"
            aria-label="Toggle menu"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("sidebar-toggle"));
              // small polite ARIA live announcement for SR users
              setMenuOpenAnnounce("Toggled menu");
              setTimeout(() => setMenuOpenAnnounce(null), 600);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2">
          <Image
            src="/zoglog.svg"
            alt="Website logo"
            width={128}
            height={128}
            //className="invert"
            priority
          />
          <span className="sr-only">Home</span>
          </Link>
          {/* polite live region for the hamburger toggle */}
          {menuOpenAnnounce && (
            <span className="sr-only" role="status" aria-live="polite">{menuOpenAnnounce}</span>
          )}
        </div>

    {/* Center: Search bar */}
    <form action="/search" method="GET" className="flex-1 max-w-xl mx-4 w-full">
          <label htmlFor="q" className="sr-only">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            placeholder="Search games..."
      defaultValue={qOnSearchPage}
      onKeyDown={onKeyDown}
      ref={inputRef}
      className="w-full rounded-full border px-4 py-2 text-sm outline-none text-white placeholder-white/50 bg-[#1a1d29] border-[#262a3a] focus:ring-2 focus:ring-[var(--primary)]"
          />
        </form>

        {/* Right: Active filter chip + Random Game button */}
  <div className="relative flex items-center gap-2">
          {hasFilter && (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="chip rounded-full px-3 py-1 text-xs font-medium border focus:ring-2 focus:ring-[var(--primary)]/60 focus:outline-none"
              title="Clear filters"
            >
              {activeTab ? `Favorites` : activeGenre}
              <span className="ml-2 text-white/70">×</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleRandom}
            className="btn-primary rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loadingGames || gamesList.length === 0}
            aria-label={`Random game from ${randomScope}`}
            title={`Random from ${randomScope}`}
          >
            Random Game
          </button>
          {toast && (
            <div
              role="status"
              aria-live="polite"
              className="absolute -bottom-10 right-0 rounded-md bg-black/70 text-white text-xs px-2 py-1 border border-white/10 shadow-lg"
            >
              {toast}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
