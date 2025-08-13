import { storage } from "@/lib/storage";
import type { Game } from "@/types/game";
import GameCard from "@/components/GameCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const title = `Tag: ${decodeURIComponent(tag)}`;
  return { title };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const q = decodeURIComponent(tag).trim().toLowerCase();
  const games = (await storage.listGames()) as Game[];
  const filtered = games.filter((g) => Array.isArray(g.tags) && g.tags.some((t) => (t || "").trim().toLowerCase() === q));

  return (
    <section className="space-y-4">
      <h1 className="text-white font-semibold text-xl">Tag: <span className="bg-gradient-to-r from-[var(--primary)] to-pink-400 text-transparent bg-clip-text italic font-semibold">{decodeURIComponent(tag)}</span></h1>
      {filtered.length === 0 ? (
        <p className="text-white/70">No games found for this tag.</p>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </section>
  );
}
