// Clean component replacing previous broken content
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Game } from "@/types/game";
import type { GenreMapping } from "@/types/genreMapping";
import { fallbackEmojiForGenre } from "@/lib/genreEmoji";

type IconProps = { className?: string };
const EmojiIconWrap = ({ glyph, className }: { glyph: string; className?: string }) => (
  <span aria-hidden className={(className ? className + " " : "") + "inline-grid place-items-center"} style={{ fontSize: 18, lineHeight: 1 }}>
    {glyph}
  </span>
);
const IconHome = ({ className }: IconProps) => <EmojiIconWrap glyph="🏠" className={className} />;
const IconHeart = ({ className }: IconProps) => <EmojiIconWrap glyph="❤️" className={className} />;
const IconTiles = ({ className }: IconProps) => <EmojiIconWrap glyph="🗂️" className={className} />;
const IconTag = ({ className }: IconProps) => <EmojiIconWrap glyph="🏷️" className={className} />;
function createEmojiIcon(glyph: string) {
  const Comp = ({ className }: IconProps) => <EmojiIconWrap glyph={glyph} className={className} />;
  // Provide a stable display name to satisfy eslint react/display-name
  (Comp as unknown as { displayName?: string }).displayName = `EmojiIcon(${glyph})`;
  return Comp;
}

function getGenreIconFallback(name: string) {
  const n = (name || "").toLowerCase();
  if (n.includes("mahjong")) return createEmojiIcon("🀄");
  if (n.includes("solitaire") || n.includes("klondike") || n.includes("cards") || n.includes("card")) return createEmojiIcon("🃏");
  if (n.includes("puzzle") || n.includes("match")) return createEmojiIcon("🧩");
  if (n.includes("hidden")) return createEmojiIcon("🔎");
  if (n.includes("bubble")) return createEmojiIcon("🫧");
  if (n.includes("pinball")) return createEmojiIcon("🎱");
  if (n.includes("arcade")) return createEmojiIcon("🕹️");
  if (n.includes("brain")) return createEmojiIcon("🧠");
  if (n.includes("skill")) return createEmojiIcon("🎯");
  if (n.includes("idle") || n.includes("incremental") || n.includes("clicker")) return createEmojiIcon("⏱️");
  if (n.includes("management") || n.includes("simulation") || n.includes("craft") || n.includes("building")) return createEmojiIcon("⚙️");
  return createEmojiIcon("🏷️");
}

const itemsDef = [
  { key: "home", label: "Home", Icon: IconHome, href: "/" },
  { key: "favorites", label: "Favorites", Icon: IconHeart, href: "/?tab=favorites" },
  { key: "tags", label: "Tags", Icon: IconTag, href: "/tags" },
  { key: "all", label: "All", Icon: IconTiles, href: "/" },
];

export default function SidebarNav() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLg, setIsLg] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [genres, setGenres] = useState<{ name: string; count: number }[]>([]);
  const [emojiIndex, setEmojiIndex] = useState<Map<string, string>>(new Map());
  const [showMore, setShowMore] = useState(false);
  const widthExpanded = 224;
  const widthCollapsed = 64;
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const asideRef = useRef<HTMLDivElement | null>(null);

  // Initial setup and favorites watcher
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const setLarge = () => setIsLg(mq.matches);
    setLarge();
    mq.addEventListener?.("change", setLarge);

    try {
      const raw = localStorage.getItem("sidebar-collapsed");
      const initial = raw ? JSON.parse(raw) : false;
      setCollapsed(Boolean(initial));
    } catch {}

    const applyW = () => {
      const w = mq.matches ? (collapsed ? widthCollapsed : widthExpanded) : 0;
      document.documentElement.style.setProperty("--sidebar-w", `${w}px`);
    };
    applyW();

    const readFavs = () => {
      try {
        const rawFavs = localStorage.getItem("favorites");
        const list: string[] = rawFavs ? JSON.parse(rawFavs) : [];
        setFavCount(Array.isArray(list) ? list.length : 0);
      } catch {
        setFavCount(0);
      }
    };
    readFavs();
    const onStorage = (e: StorageEvent) => { if (e.key === "favorites") readFavs(); };
    const onFavUpdated = () => readFavs();
    window.addEventListener("storage", onStorage);
    window.addEventListener("favorites-updated", onFavUpdated as EventListener);

    return () => {
      mq.removeEventListener?.("change", setLarge);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("favorites-updated", onFavUpdated as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure CSS var tracks viewport breakpoint and collapsed state
  useEffect(() => {
    const isLarge = window.matchMedia("(min-width: 1024px)").matches;
    const w = isLarge ? (collapsed ? widthCollapsed : widthExpanded) : 0;
    document.documentElement.style.setProperty("--sidebar-w", `${w}px`);
    if (isLarge) {
      try { localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed)); } catch {}
    }
  }, [collapsed, isLg]);

  // Listen for hamburger toggle events from NavBar (mobile only)
  useEffect(() => {
    const onToggle = () => { if (!isLg) setIsMobileOpen((v) => !v); };
    window.addEventListener("sidebar-toggle", onToggle as EventListener);
    return () => window.removeEventListener("sidebar-toggle", onToggle as EventListener);
  }, [isLg]);

  // Close drawer on route/search changes or Esc
  useEffect(() => { if (!isLg) setIsMobileOpen(false); }, [pathname, sp, isLg]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsMobileOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus trap and inert background for mobile drawer
  useEffect(() => {
    if (isLg) return;
    const main = document.getElementById("main-content");
    if (isMobileOpen) {
      // inert background
      main?.setAttribute("aria-hidden", "true");
      // move focus into drawer
      const firstFocusable = asideRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
      const onFocus = (e: FocusEvent) => {
        if (!asideRef.current) return;
        if (!asideRef.current.contains(e.target as Node)) {
          e.stopPropagation();
          firstFocusable?.focus();
        }
      };
      document.addEventListener("focus", onFocus, true);
      return () => {
        document.removeEventListener("focus", onFocus, true);
        main?.removeAttribute("aria-hidden");
      };
    }
  }, [isMobileOpen, isLg]);

  const items = useMemo(() => itemsDef, []);

  // Fetch games + genre mapping to build canonical genre list and emoji index
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [gamesRes, mapRes] = await Promise.all([
          fetch("/api/games", { cache: "no-store" }),
          fetch("/api/genres", { cache: "no-store" }),
        ]);
        const gamesJson: { ok: boolean; data?: Game[] } = await gamesRes.json();
        const mapsJson: { ok: boolean; data?: GenreMapping[] } = await mapRes.json();
        const games = gamesJson.ok && gamesJson.data ? gamesJson.data : [];
        const maps = mapsJson.ok && mapsJson.data ? mapsJson.data : [];

        const includesIndex = new Map<string, string>();
        const emojiByName = new Map<string, string>();
        for (const m of maps) {
          for (const inc of m.includes || []) {
            const key = (inc || "").trim().toLowerCase();
            if (!key) continue;
            includesIndex.set(key, m.name);
          }
          if (m.name) {
            includesIndex.set(m.name.trim().toLowerCase(), m.name);
            if (m.emoji && m.emoji.trim()) emojiByName.set(m.name, m.emoji.trim());
          }
        }

        const counts = new Map<string, number>();
        for (const g of games) {
          if (!Array.isArray(g.genre)) continue;
          const seenForGame = new Set<string>();
          for (const raw of g.genre) {
            const rawTrim = (raw || "").trim();
            if (!rawTrim) continue;
            const key = rawTrim.toLowerCase();
            const canonical = includesIndex.get(key) || rawTrim;
            if (seenForGame.has(canonical)) continue;
            seenForGame.add(canonical);
            counts.set(canonical, (counts.get(canonical) || 0) + 1);
          }
        }
        const entries = Array.from(counts.entries())
          .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
          .map(([name, count]) => ({ name, count }));
        if (!cancelled) { setGenres(entries); setEmojiIndex(emojiByName); }
      } catch { /* ignore */ }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const activeForKey = (key: string) => {
    const tab = (sp?.get("tab") || "").toLowerCase();
    const genre = (sp?.get("genre") || "").toLowerCase();
    const onHome = pathname === "/" && !tab && !genre;
    switch (key) {
      case "home": return onHome;
      case "favorites": return tab === "favorites";
      case "tags": return pathname?.startsWith("/tags");
      default: return false;
    }
  };

  // Never show collapsed UI on mobile; collapse is desktop-only UX
  const effectiveCollapsed = isLg ? collapsed : false;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!isMobileOpen}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={`fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] transition-transform duration-300 ease-in-out rounded-r-xl border-r border-y border-white/10 bg-[#171a25] shadow-lg ${isLg ? "translate-x-0" : (isMobileOpen ? "translate-x-0" : "-translate-x-full")} lg:translate-x-0`}
        style={{ width: effectiveCollapsed ? widthCollapsed : widthExpanded }}
        aria-label="Sidebar navigation"
        role={!isLg && isMobileOpen ? "dialog" : undefined}
        aria-modal={!isLg && isMobileOpen ? true : undefined}
        ref={asideRef}
      >
        <div className="p-2 h-full flex flex-col gap-2">
          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex w-full rounded-lg bg-white/5 hover:bg-white/10 text-white h-8 items-center justify-center"
          >
            {collapsed ? ">" : "<"}
          </button>

          {/* Scrollable content area */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {/* Primary nav */}
            <nav className="flex flex-col gap-2">
              {items.map(({ key, label, Icon, href }) => {
                const isActive = activeForKey(key);
                const base = effectiveCollapsed
                  ? "relative h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
                  : "h-10 w-full rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center gap-3 px-3";
                return (
                  <button
                    key={key}
                    type="button"
                    title={label}
                    onClick={() => router.push(href)}
                    className={(base + (isActive && !effectiveCollapsed ? " font-semibold" : "")) + (isActive ? " sidebar-item-active" : "")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    <span className={effectiveCollapsed ? "sr-only" : "block"}>{label}</span>
                    {key === "favorites" && (
                      effectiveCollapsed ? (
                        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-[10px] grid place-items-center">
                          {favCount}
                        </span>
                      ) : (
                        <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-[10px]">
                          {favCount}
                        </span>
                      )
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Genres */}
            <div className="mt-0">
        {!effectiveCollapsed && <div className="px-2 text-[10px] uppercase tracking-wide text-white/50">Genres</div>}
              <nav className="flex flex-col gap-2 mt-1">
                {(showMore ? genres : genres.slice(0, 10)).map(({ name }) => {
                  const selected = (sp?.get("genre") || "").toLowerCase();
                  const isActive = !!selected && (name.toLowerCase() === selected || name.toLowerCase().includes(selected));
          const base = effectiveCollapsed
                    ? "h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
                    : "h-10 w-full rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center gap-3 px-3";
                  const emoji = emojiIndex.get(name) || fallbackEmojiForGenre(name);
                  const IconComp = emoji ? createEmojiIcon(emoji) : getGenreIconFallback(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => router.push(`/?genre=${encodeURIComponent(name)}`)}
                      className={(base + (isActive && !effectiveCollapsed ? " font-semibold" : "")) + (isActive ? " sidebar-item-active" : "")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <IconComp className="h-5 w-5" />
                      <span className={effectiveCollapsed ? "sr-only" : "block"}>{name}</span>
                    </button>
                  );
                })}
                {genres.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setShowMore((s) => !s)}
                    className={effectiveCollapsed
                      ? "h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
                      : "h-10 w-full rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center px-3"}
                    title={showMore ? "Show fewer" : "Show more"}
                  >
                    <span className={effectiveCollapsed ? "sr-only" : "block"}>{showMore ? "Show fewer" : "Show more"}</span>
                    {effectiveCollapsed && <span>{showMore ? "–" : "+"}</span>}
                  </button>
                )}
              </nav>
            </div>
          </div>

          {/* Footer (desktop only) */}
          {!effectiveCollapsed && (
            <footer className="mt-auto pt-3 mb-16 border-t border-white/10 text-white/60 text-xs rounded-md transition-colors duration-150 hover:bg-white/5 hidden lg:block">
              <nav className="flex flex-wrap gap-3">
                <a href="/privacy" className="hover:text-white/80">Privacy Policy</a>
                <a href="/cookies" className="hover:text-white/80">Cookies</a>
                <a href="/terms" className="hover:text-white/80">Terms</a>
                <a href="/sitemap" className="hover:text-white/80">Sitemap</a>
              </nav>
              <p className="mt-2">&copy; {new Date().getFullYear()} Arcade</p>
            </footer>
          )}
        </div>
      </aside>
    </>
  );
}
