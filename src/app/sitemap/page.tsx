import Link from "next/link";
import { storage } from "@/lib/storage";
import type { Game } from "@/types/game";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Simple HTML sitemap for human users. Not a replacement for sitemap.xml
export const metadata = {
  title: "Sitemap",
  description: "Browse all games, tags, and key pages on Arcade.",
};

export default async function HtmlSitemapPage() {
  const games = (await storage.listGames()) as Game[];
  const sortedGames = [...games].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  const tagsSet = new Set<string>();
  for (const g of games) {
    for (const t of g.tags || []) {
      const tag = (t || "").trim();
      if (tag) tagsSet.add(tag);
    }
  }
  const tags = Array.from(tagsSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero header */}
      <header className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 shadow-lg">
        <p className="text-xs uppercase tracking-wider text-white/50">Index</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-fuchsia-400">
          Sitemap
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
            <span aria-hidden>🧭</span>
            {sortedGames.length} games
          </span>
          {tags.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
              <span aria-hidden>🏷️</span>
              {tags.length} tags
            </span>
          )}
          <span className="hidden sm:inline text-white/40">•</span>
          <span className="hidden sm:inline">Human-readable overview (XML at /sitemap.xml)</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          {/* Core section */}
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
              <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
                <span aria-hidden>🧱</span> Core Pages
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                <li><Link className="hover:text-white/90 text-white/70" href="/">Home</Link></li>
                <li><Link className="hover:text-white/90 text-white/70" href="/tags">Tags</Link></li>
                <li><Link className="hover:text-white/90 text-white/70" href="/privacy">Privacy Policy</Link></li>
                <li><Link className="hover:text-white/90 text-white/70" href="/cookies">Cookies</Link></li>
                <li><Link className="hover:text-white/90 text-white/70" href="/terms">Terms</Link></li>
                <li><Link className="hover:text-white/90 text-white/70" href="/sitemap.xml">XML Sitemap</Link></li>
              </ul>
            </section>

          {/* Games */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🎮</span> Games ({sortedGames.length})
            </h2>
            {sortedGames.length === 0 ? (
              <p className="mt-3 text-white/60 text-sm">No games available.</p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3 text-sm max-h-[480px] overflow-y-auto pr-2">
                {sortedGames.map((g) => {
                  const handle = g.slug || g.id;
                  return (
                    <li key={g.id}>
                      <Link className="hover:text-white/90 text-white/70" href={`/play/${encodeURIComponent(handle)}`}>{g.title}</Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Tags */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-md">
            <h2 className="text-white/90 text-xl font-semibold flex items-center gap-2">
              <span aria-hidden>🏷️</span> Tags ({tags.length})
            </h2>
            {tags.length === 0 ? (
              <p className="mt-3 text-white/60 text-sm">No tags yet.</p>
            ) : (
              <ul className="mt-3 columns-2 md:columns-3 gap-2 text-sm [&_a]:break-words">
                {tags.map((t) => (
                  <li key={t} className="py-0.5"><Link className="hover:text-white/90 text-white/70" href={`/tags/${encodeURIComponent(t)}`}>{t}</Link></li>
                ))}
              </ul>
            )}
          </section>

          <div className="text-right text-xs text-white/60">
            <a href="#" className="hover:text-white/80">Back to top ↑</a>
          </div>
        </div>

        {/* Sidebar summary */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-white/10 bg-white/[0.02] p-5 shadow-md space-y-5 text-sm">
            <div>
              <div className="text-white/60 uppercase tracking-wide text-xs mb-1">Summary</div>
              <ul className="space-y-1 text-white/80">
                <li>Games: {sortedGames.length}</li>
                <li>Tags: {tags.length}</li>
                <li><Link href="/random" className="text-[var(--primary)] hover:underline">Random Game →</Link></li>
              </ul>
            </div>
            <div className="text-white/60 text-xs leading-relaxed">
              This sitemap page helps users (and crawlers) discover deep content via internal links.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
