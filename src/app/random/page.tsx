import type { Game } from "@/types/game";
import { redirect } from "next/navigation";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RandomPage() {
  const games = (await storage.listGames()) as Game[];
  const list: Game[] = games.filter(
    (g) => !!g && !!g.id && typeof g.thumbnail === "string" && !!g.thumbnail && typeof g.url === "string" && !!g.url
  );
  if (list.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-semibold text-white">Random Game</h1>
        <p className="text-white/80">No games available.</p>
      </section>
    );
  }
  const idx = Math.floor(Math.random() * list.length);
  const chosen = list[idx];
  redirect(`/play/${encodeURIComponent(chosen.id)}`);
}
