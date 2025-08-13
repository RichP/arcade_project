import type { Game } from "@/types/game";
import Link from "next/link";
import type { Metadata } from "next";
import AdminManager from "@/components/AdminManager";
import { storage } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Admin",
  description: "Lightweight stats and data overview for the arcade.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getPlayable(list: Game[]): Game[] {
  return list.filter(
    (g) => !!g && !!g.id && typeof g.thumbnail === "string" && !!g.thumbnail && typeof g.url === "string" && !!g.url
  );
}

export default async function AdminPage() {
  const all = (await storage.listGames()) as Game[];
  const playable = getPlayable(all);
  const featured = playable.filter((g) => !!g.featured);
  const byGenre = new Map<string, number>();
  for (const g of playable) {
    if (Array.isArray(g.genre)) {
      for (const tag of g.genre) {
        const key = (tag || "").trim();
        if (!key) continue;
        byGenre.set(key, (byGenre.get(key) || 0) + 1);
      }
    }
  }
  const topGenres = Array.from(byGenre.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
  <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Admin</h1>
    <p className="text-white/70 text-sm">Manage games and see quick stats.</p>
        <form
          action="/api/admin/logout"
          method="post"
          className="mt-2"
        >
          <button
            type="submit"
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/90 hover:bg-white/10"
            formAction="/api/admin/logout"
          >
            Sign out
          </button>
        </form>
      </header>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-white/60 text-xs">Total games</p>
          <p className="text-white text-2xl font-semibold">{all.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-white/60 text-xs">Playable (thumb + url)</p>
          <p className="text-white text-2xl font-semibold">{playable.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-white/60 text-xs">Featured</p>
          <p className="text-white text-2xl font-semibold">{featured.length}</p>
        </div>
      </div>

  {/* Manager: add/edit form and list */}
  <AdminManager />

      {/* Genres */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="text-white/90 font-semibold mb-3 text-sm">Top Genres</h2>
        {topGenres.length === 0 ? (
          <p className="text-white/60 text-sm">No genre data.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topGenres.map(([name, count]) => (
              <Link
                key={name}
                href={`/?genre=${encodeURIComponent(name)}`}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                title={`Filter by ${name}`}
              >
                {name}
                <span className="ml-1 text-white/50">({count})</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Compact list */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-white/60">
              <tr>
                <th className="px-3 py-2 border-b border-white/10">Title</th>
                <th className="px-3 py-2 border-b border-white/10">ID</th>
                <th className="px-3 py-2 border-b border-white/10">Rating</th>
                <th className="px-3 py-2 border-b border-white/10">Genre</th>
                <th className="px-3 py-2 border-b border-white/10">Playable</th>
                <th className="px-3 py-2 border-b border-white/10">Link</th>
              </tr>
            </thead>
            <tbody>
              {all.map((g) => {
                const isPlayable = Boolean(
                  g && g.id && typeof g.thumbnail === "string" && g.thumbnail && typeof g.url === "string" && g.url
                );
                return (
                  <tr key={g.id || g.title} className="text-white/80 hover:bg-white/[0.03]">
                    <td className="px-3 py-2 align-top">
                      <span className="text-white">{g.title || "—"}</span>
                      {g.featured ? (
                        <span className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] bg-[var(--primary)] text-[var(--on-primary)] border border-white/10">Featured</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 align-top text-white/60 font-mono text-xs">{g.id || "—"}</td>
                    <td className="px-3 py-2 align-top text-white/70">{typeof g.rating === "number" ? g.rating.toFixed(1) : "—"}</td>
                    <td className="px-3 py-2 align-top text-white/70">
                      {Array.isArray(g.genre) && g.genre.length > 0 ? g.genre.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className={`text-xs ${isPlayable ? "text-emerald-400" : "text-red-400"}`}>
                        {isPlayable ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      {g.id ? (
                        <Link href={`/play/${encodeURIComponent(g.slug || g.id)}`} className="text-[var(--primary)] underline">
                          Play
                        </Link>
                      ) : (
                        <span className="text-white/50">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
