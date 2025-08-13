import GameCard from "@/components/GameCard";
import type { Game } from "@/types/game";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const games = (await storage.listGames()) as Game[];
  const { q: qp = "" } = await searchParams;
  const term = (qp || "").toString().trim();

  const all: Game[] = (games as Game[]).filter(
    (g) => typeof g?.thumbnail === "string" && !!g.thumbnail && typeof g?.url === "string" && !!g.url
  );
  const ql = term.toLowerCase();
  const results = term
    ? all.filter((g) => {
        const inTitle = (g.title || "").toLowerCase().includes(ql);
        const inTags = Array.isArray(g.tags)
          ? g.tags.some((t) => (t || "").toLowerCase().includes(ql))
          : false;
        const inGenre = Array.isArray(g.genre)
          ? g.genre.some((t) => (t || "").toLowerCase().includes(ql))
          : false;
        return inTitle || inTags || inGenre;
      })
    : [];

  return (
    <section className="space-y-4">
      {term ? (
        <h1 className="text-xl font-semibold text-white">
          Search results for: <span className="font-mono text-white/80">{term}</span>
        </h1>
      ) : (
        <h1 className="text-xl font-semibold text-white">Search</h1>
      )}

      {!term && (
        <p className="text-white/80">Type a search term in the bar above and press Enter.</p>
      )}

      {term && results.length === 0 && (
        <p className="text-white/60">No games found matching “{term}”.</p>
      )}

      {results.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </section>
  );
}
