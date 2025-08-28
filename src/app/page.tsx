import FeaturedCarousel from "@/components/FeaturedCarousel";
import type { Game } from "@/types/game";
import type { GenreMapping } from "@/types/genreMapping";
import GamesGridWithFavorites from "@/components/GamesGridWithFavorites";
import GameCard from "@/components/GameCard";
import BecauseYouLiked from "@/components/BecauseYouLiked";
import { fallbackEmojiForGenre } from "@/lib/genreEmoji";
import { storage } from "@/lib/storage";
import { SITE_NAME } from "@/config/site";
import ConfettiProfileProvider, { type ConfettiProfile } from "@/components/ConfettiProfileProvider";

// Read latest data on each request in production too
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Dynamic metadata: reflect active genre in the document title for better SEO/share
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const { genre = "" } = await searchParams;
  let title = SITE_NAME;
  if (genre) {
    const maps = await storage.listGenreMappings();
    const includesIndex = new Map<string, string>();
    const emojiByName = new Map<string, string>();
    for (const m of maps) {
      for (const inc of m.includes || []) includesIndex.set((inc || "").trim().toLowerCase(), m.name);
      if (m.name) {
        includesIndex.set(m.name.trim().toLowerCase(), m.name);
        if (m.emoji && m.emoji.trim()) emojiByName.set(m.name, m.emoji.trim());
      }
    }
    const display = includesIndex.get(genre.trim().toLowerCase()) || genre.trim();
    const emoji = emojiByName.get(display);
  title = `All ${emoji ? emoji + " " : ""}${display} Games | ${SITE_NAME}`;
  } else {
  title = `${SITE_NAME} — Play Free Online Games`;
  }
  return { title };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; genre?: string }>;
}) {
  const key = "confettiProfile";
  const val = await storage.getSetting<ConfettiProfile>(key);
  const confettiProfile: ConfettiProfile = (val === "subtle" || val === "low-power" || val === "celebration") ? val : "celebration";
  // grid variation mode setting
  const gridVariation = await storage.getSetting<"two" | "three">("gridVariationMode");
  const variationMode: "two" | "three" = gridVariation === "two" || gridVariation === "three" ? gridVariation : "three";
  // mobile card aspect setting
  const mobileAspectSetting = await storage.getSetting<"square" | "video">("mobileCardAspect");
  const mobileAspect: "square" | "video" = mobileAspectSetting === "video" ? "video" : "square";
  const gamesData = await storage.listGames();
  const { tab = "", genre = "" } = await searchParams;
  const games = (gamesData as Game[]).filter(
    (g) => typeof g?.thumbnail === "string" && !!g.thumbnail && typeof g?.url === "string" && !!g.url
  );
  const featured: Game[] = games.filter((g) => !!g.featured);
  let others: Game[] = games.filter((g) => !g.featured);
  let displayGenre: string | null = null;
  const genreParam = genre.trim().toLowerCase();
  if (genreParam) {
    // Load mappings and build includes index
    const maps: GenreMapping[] = await storage.listGenreMappings();
    const includesIndex = new Map<string, string>();
    for (const m of maps) {
      for (const inc of m.includes || []) includesIndex.set((inc || "").trim().toLowerCase(), m.name);
      if (m.name) includesIndex.set(m.name.trim().toLowerCase(), m.name);
    }
    const matchesParam = (raw: string) => {
      const rawTrim = (raw || "").trim();
      if (!rawTrim) return false;
      const key = rawTrim.toLowerCase();
      const canonical = includesIndex.get(key) || rawTrim;
      return canonical.toLowerCase().includes(genreParam);
    };
    others = others.filter((g) => Array.isArray(g.genre) && g.genre.some(matchesParam));
    displayGenre = includesIndex.get(genreParam) || (genre || "").trim();
  }

  // Build a simple canonicalization to pick 2-3 top “stripes” when no genre filter is active
  const maps: GenreMapping[] = await storage.listGenreMappings();
  const includesIndex = new Map<string, string>();
  const emojiByName = new Map<string, string>();
  for (const m of maps) {
    for (const inc of m.includes || []) includesIndex.set((inc || "").trim().toLowerCase(), m.name);
    if (m.name) {
      includesIndex.set(m.name.trim().toLowerCase(), m.name);
      if (m.emoji && m.emoji.trim()) emojiByName.set(m.name, m.emoji.trim());
    }
  }

  const topStripes: { title: string; items: Game[] }[] = [];
  const isFavoritesTab = tab.toLowerCase() === "favorites";
  if (!genreParam && !isFavoritesTab) {
    // New & trending: released within 30 days and rating >= 4.2 (tweakable)
    const now = Date.now();
    const maxAgeDays = 30;
    const minRating = 4.2;
    const newTrending = others
      .filter((g) => {
        try {
          if (!g.released) return false;
          const d = new Date(g.released);
          if (isNaN(d.getTime())) return false;
          const days = Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24));
          return days >= 0 && days <= maxAgeDays && (g.rating ?? 0) >= minRating;
        } catch { return false; }
      })
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 12);
    if (newTrending.length) topStripes.push({ title: "New & trending", items: newTrending });

    // Count by canonical to find top categories
    const counts = new Map<string, number>();
    for (const g of others) {
      const seen = new Set<string>();
      for (const raw of g.genre || []) {
        const key = (raw || "").trim().toLowerCase();
        if (!key) continue;
        const canonical = includesIndex.get(key) || raw || "Other";
        if (seen.has(canonical)) continue;
        seen.add(canonical);
        counts.set(canonical, (counts.get(canonical) || 0) + 1);
      }
    }
    const top = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([title]) => title);

    for (const title of top) {
      const items = others.filter((g) => (g.genre || []).some((raw) => {
        const key = (raw || "").trim().toLowerCase();
        return (includesIndex.get(key) || raw) === title;
      })).slice(0, 12);
      if (items.length) topStripes.push({ title, items });
    }
    // De-duplicate the stripe items from the main grid show list to avoid repetition in first fold
  const stripeIds = new Set(topStripes.flatMap((s) => s.items.map((g) => g.id)));
    others = others.filter((g) => !stripeIds.has(g.id));
  }

  return (
    <ConfettiProfileProvider profile={confettiProfile}>
      <section className="space-y-6">
        {/* Featured carousel */}
        {featured.length > 0 && (
          <div>
            <h2 className="text-white/90 font-semibold mb-3">Featured</h2>
            <FeaturedCarousel games={featured} />
          </div>
        )}

    {/* Personalized stripe based on favorites (hidden on Favorites tab) */}
    {!genreParam && !isFavoritesTab && (
          <div className="mt-4">
            <BecauseYouLiked games={games} mappings={maps} />
          </div>
        )}

    {/* Curated stripes for top categories when not filtered or favorites */}
  {topStripes.length > 0 && !isFavoritesTab && (
          <div className="space-y-8">
            {topStripes.map((stripe) => (
              <div key={stripe.title}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/90 font-semibold">
                    {(emojiByName.get(stripe.title) || fallbackEmojiForGenre(stripe.title)) && (
                      <span aria-hidden className="mr-2 inline-grid place-items-center" style={{ fontSize: 16, lineHeight: 1 }}>{emojiByName.get(stripe.title) || fallbackEmojiForGenre(stripe.title)}</span>
                    )}
                    {stripe.title}
                  </h3>
                  <a href={`/?genre=${encodeURIComponent(stripe.title)}`} className="see-all-link text-xs text-white/60 hover:text-white">See all <span className="chev">→</span></a>
                </div>
    <div className="stripe-fade flex overflow-x-auto gap-4 no-scrollbar pr-1 -mx-1 px-1 sm:mx-0 sm:px-0" style={{ contentVisibility: "auto" }}>
                  {stripe.items.map((g) => (
  <div key={g.id} className="min-w-[70%] xs:min-w-[260px] sm:min-w-[240px] md:min-w-[260px] max-w-[300px]" style={{ contentVisibility: "auto", containIntrinsicSize: "300px" }}>
          <GameCard game={g} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

  {topStripes.length === 0 && !isFavoritesTab && !genreParam && (
          <div className="space-y-8">
            {/* Explicit New & trending skeleton stripe */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/90 font-semibold">New & trending</h3>
                <div className="h-3 w-16 skeleton rounded" />
              </div>
        <div className="stripe-fade flex overflow-x-auto gap-4 no-scrollbar pr-1 -mx-1 px-1 sm:mx-0 sm:px-0" style={{ contentVisibility: "auto" }}>
                {Array.from({ length: 6 }).map((_, i) => (
          <div key={`sk-new-${i}`} className="min-w-[70%] xs:min-w-[260px] sm:min-w-[240px] md:min-w-[260px] max-w-[300px]" style={{ contentVisibility: "auto", containIntrinsicSize: "300px" }}>
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
            {/* Generic top category skeleton stripe */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-40 skeleton rounded" />
                <div className="h-3 w-16 skeleton rounded" />
              </div>
        <div className="stripe-fade flex overflow-x-auto gap-4 no-scrollbar pr-1 -mx-1 px-1 sm:mx-0 sm:px-0" style={{ contentVisibility: "auto" }}>
                {Array.from({ length: 6 }).map((_, i) => (
          <div key={`sk-top-${i}`} className="min-w-[70%] xs:min-w-[260px] sm:min-w-[240px] md:min-w-[260px] max-w-[300px]" style={{ contentVisibility: "auto", containIntrinsicSize: "300px" }}>
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
          </div>
        )}

  {/* Grid of games with Favorites tab */}
        <div className="mt-6">
          <h2 className="text-white/90 font-semibold mb-3">
            {displayGenre ? (
              <>
                {(emojiByName.get(displayGenre) || fallbackEmojiForGenre(displayGenre)) && (
                  <span aria-hidden className="mr-2 inline-grid place-items-center" style={{ fontSize: 18, lineHeight: 1 }}>{emojiByName.get(displayGenre) || fallbackEmojiForGenre(displayGenre)}</span>
                )}
                All <span className="bg-gradient-to-r from-[var(--primary)] to-pink-400 text-transparent bg-clip-text italic font-semibold">{displayGenre}</span> Games
              </>
            ) : (
              "All Games"
            )}
          </h2>
          {/* Use virtualization automatically when the dataset is large. */}
          <GamesGridWithFavorites
            games={others}
            initialTab={tab === "favorites" ? "favorites" : "all"}
            virtualize={others.length > 800}
            variationMode={variationMode}
            mobileAspect={mobileAspect}
          />
        </div>
      </section>
    </ConfettiProfileProvider>
  );
}
