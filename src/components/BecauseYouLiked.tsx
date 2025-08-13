"use client";

import { useEffect, useMemo, useState } from "react";
import type { Game } from "@/types/game";
import type { GenreMapping } from "@/types/genreMapping";
import GameCard from "@/components/GameCard";

function buildIncludesIndex(maps: GenreMapping[]) {
  const idx = new Map<string, string>();
  for (const m of maps) {
    for (const inc of m.includes || []) idx.set((inc || "").trim().toLowerCase(), m.name);
    if (m.name) idx.set(m.name.trim().toLowerCase(), m.name);
  }
  return idx;
}

export default function BecauseYouLiked({ games, mappings }: { games: Game[]; mappings: GenreMapping[] }) {
  const [favIds, setFavIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("favorites");
        setFavIds(raw ? JSON.parse(raw) : []);
      } catch {
        setFavIds([]);
      }
      setLoaded(true);
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "favorites") read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const { title, items } = useMemo(() => {
    if (games.length === 0) return { title: "", items: [] as Game[] };
    const favSet = new Set(favIds);
    const favoriteGames = games.filter((g) => favSet.has(g.id));
    if (favoriteGames.length === 0) return { title: "", items: [] as Game[] };

    const includesIndex = buildIncludesIndex(mappings);

    // Collect top canonical genres from favorites
    const genreCount = new Map<string, number>();
    for (const g of favoriteGames) {
      const seen = new Set<string>();
      for (const raw of g.genre || []) {
        const key = (raw || "").trim().toLowerCase();
        if (!key) continue;
        const canonical = includesIndex.get(key) || (raw || "");
        if (seen.has(canonical)) continue;
        seen.add(canonical);
        genreCount.set(canonical, (genreCount.get(canonical) || 0) + 1);
      }
    }
    const top = Array.from(genreCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!top) return { title: "", items: [] as Game[] };

    const recommendations = games
      .filter((g) => !favSet.has(g.id))
      .filter((g) => (g.genre || []).some((raw) => {
        const key = (raw || "").trim().toLowerCase();
        return (includesIndex.get(key) || raw) === top;
      }))
      .slice(0, 12);

    const title = `Because you liked ${top}`;
    return { title, items: recommendations };
  }, [games, mappings, favIds]);

  // Before favorites load, show a lightweight skeleton to avoid layout shift.
  if (!loaded) {
    const placeholders = Array.from({ length: 6 });
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white/90 font-semibold">Personalized picks</h3>
        </div>
  <div className="flex overflow-x-auto gap-4 no-scrollbar pr-1 -mx-1 px-1 sm:mx-0 sm:px-0" style={{ contentVisibility: "auto" }}>
          {placeholders.map((_, i) => (
            <div key={i} className="min-w-[70%] xs:min-w-[260px] sm:min-w-[240px] md:min-w-[260px] max-w-[300px]">
              <div className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
                <div className="aspect-video skeleton" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-2/3 skeleton" />
                  <div className="h-3 w-1/3 skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // After load: if user has no favorites, hide the stripe.
  if (favIds.length === 0) return null;

  // If loaded and we have favorites but no items to recommend, hide gracefully
  if (!title || items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/90 font-semibold">{title}</h3>
      </div>
    <div className="flex overflow-x-auto gap-4 no-scrollbar pr-1 -mx-1 px-1 sm:mx-0 sm:px-0" style={{ contentVisibility: "auto" }}>
        {items.map((g) => (
      <div key={g.id} className="min-w-[70%] xs:min-w-[260px] sm:min-w-[240px] md:min-w-[260px] max-w-[300px]" style={{ contentVisibility: "auto", containIntrinsicSize: "300px" }}>
            <GameCard game={g} />
          </div>
        ))}
      </div>
    </div>
  );
}
