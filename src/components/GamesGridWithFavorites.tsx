"use client";

import { useEffect, useMemo, useState, useCallback, useRef, memo, forwardRef } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import { useRouter, useSearchParams } from "next/navigation";
import type { Game } from "@/types/game";
import GameCard from "./GameCard";

type TabKey = "all" | "favorites";
type SortKey = "relevance" | "rating" | "newest" | "title";
type PlatformKey = "all" | "mobile" | "desktop";
type TimeKey = "any" | "30d";

type VariationMode = "two" | "three";
type MobileAspect = "square" | "video";
type Props = { games: Game[]; initialTab?: TabKey; virtualize?: boolean; variationMode?: VariationMode; mobileAspect?: MobileAspect };

type VirtuosoListProps = React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode; "data-testid"?: string };
type VirtuosoItemProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
  "data-index"?: number;
  "data-item-index"?: number;
  "data-known-size"?: number;
  context?: unknown;
  item?: unknown;
};

const ListContainer = memo(
  forwardRef<HTMLDivElement, VirtuosoListProps>(function GridListContainer(
    { children, style, className, ...rest },
    ref
  ) {
    return (
      <div
        ref={ref}
        {...rest}
        style={{ contentVisibility: "auto", ...(style || {}) }}
  className={`grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-[1fr]${className ? " " + className : ""}`}
      >
        {children}
      </div>
    );
  })
);

const ItemContainer = memo(
  forwardRef<HTMLDivElement, VirtuosoItemProps>(function GridItemContainer(
    { children, style, className, ...rest },
    ref
  ) {
    return (
      <div
        ref={ref}
        {...rest}
        style={{ contentVisibility: "auto", containIntrinsicSize: "300px", ...(style || {}) }}
        className={className}
      >
        {children}
      </div>
    );
  })
);

export default function GamesGridWithFavorites({ games, initialTab, virtualize, variationMode = "three", mobileAspect = "square" }: Props) {
  const [tab, setTab] = useState<TabKey>("all");
  const router = useRouter();
  const sp = useSearchParams();
  const [favIds, setFavIds] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [platform, setPlatform] = useState<PlatformKey>("all");
  const [playableOnly, setPlayableOnly] = useState(false);
  const [time, setTime] = useState<TimeKey>("any");

  // Load favorites and initial UI state
  useEffect(() => {
    try {
      if (initialTab) {
        setTab(initialTab);
        localStorage.setItem("home-tab", initialTab);
      } else {
        const saved = localStorage.getItem("home-tab") as TabKey | null;
        if (saved === "all" || saved === "favorites") setTab(saved);
      }
      // Initialize from URL
      const urlQ = sp?.get("q") || "";
      const urlSort = (sp?.get("sort") || "relevance").toLowerCase();
      const urlPlatform = (sp?.get("platform") || "all").toLowerCase();
      const urlPlayable = sp?.get("playable") === "1";
      const urlTime = (sp?.get("time") || "any").toLowerCase();
      setQ(urlQ);
      if (urlSort === "rating" || urlSort === "newest" || urlSort === "title" || urlSort === "relevance") setSort(urlSort as SortKey);
      if (urlPlatform === "mobile" || urlPlatform === "desktop" || urlPlatform === "all") setPlatform(urlPlatform as PlatformKey);
      setPlayableOnly(Boolean(urlPlayable));
      if (urlTime === "30d" || urlTime === "any") setTime(urlTime as TimeKey);
      // If a genre is active and no sort specified, prefer Rating by default
      const hasGenre = Boolean(sp?.get("genre"));
      const hasSortParam = Boolean(sp?.get("sort"));
      if (hasGenre && !hasSortParam) setSort("rating");
    } catch {}

    const readFavs = () => {
      try {
        const raw = localStorage.getItem("favorites");
        setFavIds(raw ? JSON.parse(raw) : []);
      } catch {
        setFavIds([]);
      }
    };
    readFavs();
    const onStorage = (e: StorageEvent) => { if (e.key === "favorites") readFavs(); };
    const onFavEvent = () => readFavs();
    window.addEventListener("storage", onStorage);
    window.addEventListener("favorites-updated", onFavEvent as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("favorites-updated", onFavEvent as EventListener);
    };
  }, [initialTab, sp]);

  // Persist tab changes
  useEffect(() => {
    try { localStorage.setItem("home-tab", tab); } catch {}
  }, [tab]);

  // Debounce pushing q to URL for smoother typing
  useEffect(() => {
    const h = setTimeout(() => {
      try {
        const params = new URLSearchParams(sp ?? undefined);
        if (q && q.trim()) params.set("q", q.trim()); else params.delete("q");
        const qs = params.toString();
        router.replace(qs ? `/?${qs}` : "/");
      } catch {}
    }, 350);
    return () => clearTimeout(h);
  }, [q, router, sp]);

  // Push platform/playable/time to URL (immediate)
  useEffect(() => {
    try {
      const params = new URLSearchParams(sp ?? undefined);
      if (platform && platform !== "all") params.set("platform", platform); else params.delete("platform");
      if (playableOnly) params.set("playable", "1"); else params.delete("playable");
      if (time && time !== "any") params.set("time", time); else params.delete("time");
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/");
    } catch {}
  }, [platform, playableOnly, time, router, sp]);

  const favSet = useMemo(() => new Set(favIds), [favIds]);
  const favorites = useMemo(() => games.filter((g) => favSet.has(g.id)), [games, favSet]);

  // Filters
  const filterByQuery = useCallback((list: Game[]) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((g) => (g.title || "").toLowerCase().includes(needle));
  }, [q]);

  const filterPlayablePlatformTime = useCallback((list: Game[]) => {
    const now = Date.now();
    const maxAgeMs = time === "30d" ? 30 * 24 * 60 * 60 * 1000 : Infinity;
    return list.filter((g) => {
      if (playableOnly) {
        if (!(g && g.id && typeof g.thumbnail === "string" && g.thumbnail && typeof g.url === "string" && g.url)) return false;
      }
      if (platform === "mobile" && g.mobile !== true) return false;
      if (platform === "desktop" && g.mobile === true) return false;
      if (maxAgeMs !== Infinity) {
        const t = g.released ? Date.parse(g.released) : NaN;
        if (!Number.isFinite(t)) return false;
        if (now - t > maxAgeMs) return false;
      }
      return true;
    });
  }, [platform, playableOnly, time]);

  // Sorting
  const toDate = (s?: string) => {
    if (!s) return 0;
    const t = Date.parse(s);
    return Number.isFinite(t) ? t : 0;
  };
  const sortList = useCallback((list: Game[]) => {
    switch (sort) {
      case "rating": return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case "newest": return [...list].sort((a, b) => toDate(b.released) - toDate(a.released));
      case "title": return [...list].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      case "relevance":
      default: return list;
    }
  }, [sort]);

  const base = tab === "favorites" ? favorites : games;
  const show = useMemo(() => sortList(filterByQuery(filterPlayablePlatformTime(base))), [base, filterByQuery, filterPlayablePlatformTime, sortList]);

  // Progressive mount to prevent large paint when not virtualizing
  const [visibleCount, setVisibleCount] = useState(24);
  const incTimer = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);
  useEffect(() => {
    if (virtualize) return; // skip when using virtualization
    setVisibleCount(24);
    startedRef.current = false;
    if (incTimer.current) { window.clearInterval(incTimer.current); incTimer.current = null; }
    const total = show.length;
    if (total <= 24) return;

    const startRamping = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const schedule = (fn: () => void) => {
        const anyWin = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
        if (typeof anyWin.requestIdleCallback === "function") anyWin.requestIdleCallback(fn);
        else requestAnimationFrame(fn);
      };
      schedule(() => {
        let current = 24;
        incTimer.current = window.setInterval(() => {
          current = Math.min(current + 24, total);
          setVisibleCount(current);
          if (current >= total && incTimer.current) {
            window.clearInterval(incTimer.current);
            incTimer.current = null;
          }
        }, 100);
      });
    };

    const el = gridRef.current;
    if (el && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver((entries) => {
        const e = entries[0];
        if (e && e.isIntersecting) {
          startRamping();
          io.disconnect();
        }
      }, { root: null, rootMargin: "300px 0px", threshold: 0 });
      io.observe(el);
      return () => io.disconnect();
    } else {
      startRamping();
    }
    return () => { if (incTimer.current) { window.clearInterval(incTimer.current); incTimer.current = null; } };
  }, [virtualize, tab, q, sort, platform, playableOnly, time, show.length]);

  const updateUrlForTab = useCallback((nextTab: TabKey) => {
    try {
      const params = new URLSearchParams(sp ?? undefined);
      if (nextTab === "favorites") params.set("tab", "favorites"); else params.delete("tab");
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/");
    } catch {}
  }, [router, sp]);

  const updateUrlForSort = useCallback((next: SortKey) => {
    try {
      const params = new URLSearchParams(sp ?? undefined);
      if (next && next !== "relevance") params.set("sort", next); else params.delete("sort");
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/");
    } catch {}
  }, [router, sp]);

  return (
    <div className="space-y-3">
      {/* Tabs row + Clear chip (right-aligned on wide screens) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setTab("all"); updateUrlForTab("all"); }}
            className={`${tab === "all" ? "bg-white/10 text-white" : "bg-white/5 text-white/80"} rounded-full px-3 py-1 text-sm border border-white/10 hover:bg-white/10 transition-colors duration-200`}
          >
            All <span className="text-white/50 ml-1">({games.length})</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab("favorites"); updateUrlForTab("favorites"); }}
            className={`${tab === "favorites" ? "bg-white/10 text-white" : "bg-white/5 text-white/80"} rounded-full px-3 py-1 text-sm border border-white/10 hover:bg-white/10 transition-colors duration-200`}
          >
            Favorites <span className="text-white/50 ml-1">({favorites.length})</span>
          </button>
        </div>
        {/* Search + Sort + Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title…"
            className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm text-white placeholder-white/40 w-44 sm:w-56"
          />
          <select
            value={sort}
            onChange={(e) => { const next = e.target.value as SortKey; setSort(next); updateUrlForSort(next); }}
            className="rounded-full bg-white/5 border border-white/10 px-2 py-1 text-sm text-white"
            title="Sort"
          >
            <option value="relevance">Relevance</option>
            <option value="rating">Rating</option>
            <option value="newest">Newest</option>
            <option value="title">Title A–Z</option>
          </select>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as PlatformKey)}
            className="rounded-full bg-white/5 border border-white/10 px-2 py-1 text-sm text-white"
            title="Platform"
          >
            <option value="all">All platforms</option>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value as TimeKey)}
            className="rounded-full bg-white/5 border border-white/10 px-2 py-1 text-sm text-white"
            title="Time"
          >
            <option value="any">Any time</option>
            <option value="30d">Last 30 days</option>
          </select>
          <label className="inline-flex items-center gap-1 text-white/80 text-sm">
            <input type="checkbox" checked={playableOnly} onChange={(e) => setPlayableOnly(e.target.checked)} />
            Playable only
          </label>
        </div>
      </div>

      {/* Clear filter chip if a genre is active (SSR/CSR parity) */}
      {Boolean(sp?.get("genre")) && (
        <button
          type="button"
          onClick={() => {
            try {
              const params = new URLSearchParams(sp?.toString() || undefined);
              params.delete("genre");
              const qs = params.toString();
              router.replace(qs ? `/?${qs}` : "/");
            } catch {}
          }}
          className="chip self-start sm:self-auto rounded-full px-3 py-1 text-xs font-medium border focus:ring-2 focus:ring-[var(--primary)]/60 focus:outline-none"
          title="Clear genre filter"
        >
          Clear filter ×
        </button>
      )}

      {tab === "favorites" && favorites.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mascot" aria-hidden>
            <span className="mascot-emoji">🕹️</span>
          </div>
          <div className="text-white/80 text-sm">
            <div className="font-medium text-white">No favorites yet</div>
            <div>Tap the heart on any game to add it. Your top 5 unlocks a tiny celebration.</div>
          </div>
        </div>
      ) : null}

      {show.length === 0 && !(tab === "favorites" && favorites.length === 0) ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-white/70 text-sm">
          <p>No games match the current filter.</p>
          <p className="mt-1">Tip: Clear the filter from the chip above or in the sidebar to see more games.</p>
        </div>
      ) : (
        virtualize || show.length > 800 ? (
      <VirtuosoGrid
            data={show}
            components={{ List: ListContainer, Item: ItemContainer }}
            itemContent={(i, g) => {
        // Visual sizes without changing grid span
  const useThree = variationMode === "three";
  const isTall = i % 9 === 0;
  const isSquare = useThree && !isTall && i % 7 === 0;
  // On mobile, enforce a single uniform aspect; apply variation only from sm and up
  const aspectMobile = mobileAspect === "video" ? "aspect-video" : "aspect-square"; // uniform on mobile
  const aspectDesktop = isTall ? "sm:aspect-[3/4]" : isSquare ? "sm:aspect-square" : "sm:aspect-video";
  const aspect = `${aspectMobile} ${aspectDesktop}`;
  const titleLines = isTall || isSquare ? 2 : 1;
  const cis = isTall ? "420px" : isSquare ? "360px" : "300px";
              return (
                <div style={{ containIntrinsicSize: cis }}>
                  <GameCard game={g} aspectClass={aspect} titleLines={titleLines as 1 | 2} />
                </div>
              );
            }}
            useWindowScroll
            overscan={400}
          />
        ) : (
      <div ref={gridRef} className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-[1fr]" style={{ contentVisibility: "auto" }}>
            {((show && show.length > 0) ? (show as Array<Game | null>).slice(0, visibleCount) : Array.from({ length: 10 }, () => null)).map((g, i) => {
              const isTall = i % 9 === 0;
              const isWide = i % 5 === 0 && i % 9 !== 0;
        // Uniform mobile aspect; varied from sm and up
        const aspectMobile = mobileAspect === "video" ? "aspect-video" : "aspect-square";
        const aspectDesktop = isTall ? "sm:aspect-[3/4]" : isWide ? "sm:aspect-[16/9]" : "sm:aspect-video";
        const aspect = `${aspectMobile} ${aspectDesktop}`;
              const titleLines = isTall ? 2 : 1;
              const key = g ? g.id : `sk-${i}`;
              return (
                <div
                  key={key}
                  className={isTall ? "sm:row-span-2" : isWide ? "sm:col-span-2" : ""}
                  style={{ contentVisibility: "auto", containIntrinsicSize: isTall ? "420px" : "300px" }}
                >
                  {g ? (
                    <GameCard game={g} aspectClass={aspect} titleLines={titleLines as 1 | 2} />
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
                      <div className={`${aspect} skeleton`} />
                      <div className="p-3 space-y-2">
                        <div className="h-4 w-3/4 skeleton" />
                        <div className="h-3 w-1/3 skeleton" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
