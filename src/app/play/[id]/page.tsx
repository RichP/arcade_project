import RatingStars from "@/components/RatingStars";
import Link from "next/link";
import Image from "next/image";
import type { Game } from "@/types/game";
import { Suspense, type CSSProperties } from "react";
import type { Metadata } from "next";
import { storage } from "@/lib/storage";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { fallbackEmojiForGenre } from "@/lib/genreEmoji";
import { JsonLd, videoGameJsonLd, breadcrumbsJsonLd } from "@/components/SEO";

// Force this route to render dynamically so updates to games.json reflect without a rebuild
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getGameById(id: string): Promise<Game | undefined> {
  return storage.getGameById(id);
}

// Deterministic hue from a string for tag coloring (0-359)
function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params; // id may actually be a slug; storage.getGameById handles both
  const g = await getGameById(id);
  if (!g) return { title: "Game not found" };
  const title = `${g.title} • Play`;
  const baseDesc = g.description || `Play ${g.title} online.`;
  const description = baseDesc.length > 155 ? baseDesc.slice(0, 152) + "..." : baseDesc;
  const images = g.thumbnail ? [g.thumbnail] : undefined;
  return {
    title,
    description,
  alternates: { canonical: `/play/${encodeURIComponent(g.slug || g.id)}` },
    openGraph: {
      title,
      description,
      images,
      type: "article",
      url: `/play/${encodeURIComponent(g.slug || g.id)}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGameById(id);
  // If not found, try old slug redirect map
  if (!game) {
    const byOld = await storage.getGameIdByOldSlug(id);
    if (byOld) {
      // 302 to current canonical (use current slug if exists)
      const g2 = await getGameById(byOld);
      if (g2) {
        redirect(`/play/${encodeURIComponent(g2.slug || g2.id)}`);
      }
    }
  }
  if (!game) return notFound();
  // Redirect to canonical slug path if requested with a non-canonical handle
  const canonical = game.slug || game.id;
  if (id !== canonical) {
    permanentRedirect(`/play/${encodeURIComponent(canonical)}`);
  }

  const list = (await storage.listGames()) as Game[];
  const others: Game[] = list.filter((g) => g.id !== game.id);

  // Load genre mappings to determine canonical names and admin-chosen emojis
  const maps = await storage.listGenreMappings();
  const includesIndex = new Map<string, string>(); // raw lower -> canonical
  const emojiByName = new Map<string, string>();   // canonical -> emoji
  for (const m of maps) {
    for (const inc of m.includes || []) {
      const key = (inc || "").trim().toLowerCase();
      if (key) includesIndex.set(key, m.name);
    }
    if (m.name) {
      includesIndex.set(m.name.trim().toLowerCase(), m.name);
      if (m.emoji && m.emoji.trim()) emojiByName.set(m.name, m.emoji.trim());
    }
  }

  // Helper for setting CSS custom property without using any
  const chipHueStyle = (h: number): CSSProperties => ({ ["--chip-h" as string]: h } as unknown as CSSProperties);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Structured data for the game */}
      {(
        () => {
          const base = process.env.NEXT_PUBLIC_SITE_URL || "";
          const data = videoGameJsonLd({
                baseUrl: base,
                id: game.id,
                name: game.title,
                description: game.description || undefined,
                image: game.thumbnail || undefined,
                genres: Array.isArray(game.genre) ? game.genre : undefined,
                urlPath: `/play/${encodeURIComponent(game.slug || game.id)}`,
                ratingValue: game.rating,
                ratingCount: game.rating ? Math.max(1, Math.round((game.rating * 10))) : undefined,
              });
              const crumbs = breadcrumbsJsonLd(base, [
                { name: "Home", path: "/" },
                ...(Array.isArray(game.genre) && game.genre[0] ? [{ name: game.genre[0], path: `/?genre=${encodeURIComponent(game.genre[0])}` }] : []),
                { name: game.title, path: `/play/${encodeURIComponent(game.slug || game.id)}` },
              ] )
              return <>
                <JsonLd data={data} />
                {crumbs ? <JsonLd data={crumbs} /> : null}
              </>;
        }
      )()}
      {/* Main column */}
      <div className="lg:col-span-2 space-y-4">
        {/* Player */}
        {game.url ? (
          <div className="w-full rounded-xl overflow-hidden border border-white/10 bg-black/40">
            <iframe
              src={game.url}
              className="w-full"
              style={{ aspectRatio: "16/9", backgroundColor: "#000" }}
              allowFullScreen
            />
          </div>
        ) : null}

        {/* Details */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <h1 className="text-xl font-semibold text-white">{game.title}</h1>
          {game.rating ? (
            <div className="flex items-center gap-2">
              <RatingStars rating={game.rating} />
              <span className="text-white/60 text-sm">{game.rating.toFixed(1)}</span>
            </div>
          ) : null}
          {game.released ? (
            <p className="text-white/60 text-sm">Released: {game.released}</p>
          ) : null}
          {Array.isArray(game.genre) && game.genre.length > 0 ? (
            <div className="text-white/60 text-sm flex flex-wrap gap-2 items-center">
              <span className="text-white/60">Genre:</span>
              {game.genre.map((t) => {
                const hue = hashHue(t);
                const style = chipHueStyle(hue);
                const rawTrim = (t || "").trim();
                const canonical = includesIndex.get(rawTrim.toLowerCase()) || rawTrim;
                const emoji = emojiByName.get(canonical) || fallbackEmojiForGenre(canonical);
                return (
                  <Link
                    key={t}
                    href={`/?genre=${encodeURIComponent(t)}`}
                    prefetch={false}
                    className="inline-flex items-center chip-subdued rounded-full px-2 py-0.5 transition-colors border"
                    style={style}
                  >
                    {/* Emoji prefix for quick recognition */}
                    {emoji && (
                      <span aria-hidden className="mr-1" style={{ lineHeight: 1 }}>{emoji}</span>
                    )}
                    {t}
                  </Link>
                );
              })}
            </div>
          ) : null}
          {game.description ? (
            <p className="text-white/80 text-sm leading-6">{game.description}</p>
          ) : null}
          {Array.isArray(game.tags) && game.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
      {game.tags.map((t: string) => {
                const hue = hashHue(t);
                const style = chipHueStyle(hue);
                return (
                  <Link
                    key={t}
                    href={`/search?q=${encodeURIComponent(t)}`}
        prefetch={false}
                    className="chip-subdued rounded-full px-2 py-0.5 text-xs transition-colors border"
                    title={`Search for ${t}`}
                    style={style}
                  >
                    {t}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Right column: other games in 2-column simple overlay cards */}
      <Suspense fallback={<div className="grid grid-cols-2 gap-4">{Array.from({ length: 6 }).map((_,i)=>(<div key={i} className="aspect-video rounded-lg bg-white/5 animate-pulse"/>))}</div>}>
        <OtherGamesGrid others={others} />
      </Suspense>
    </div>
  );
}

function OtherGamesGrid({ others }: { others: Game[] }) {
  return (
    <aside
      className="grid grid-cols-2 gap-4"
      style={{ contentVisibility: "auto" }}
    >
      {others.map((g) => (
        <Link
          key={g.id}
          href={`/play/${encodeURIComponent(g.slug || g.id)}`}
          prefetch={false}
          className="group relative rounded-lg overflow-hidden border border-white/10 bg-white/[0.02] transition-all duration-200 hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          style={{ contentVisibility: "auto", containIntrinsicSize: "180px" }}
        >
          {g.thumbnail ? (
            <Image
              src={g.thumbnail}
              alt={g.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              width={800}
              height={450}
              sizes="(min-width: 1024px) 16.5vw, 50vw"
              style={{ aspectRatio: "16/9" }}
              placeholder="blur"
              quality={70}
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDgwJyBoZWlnaHQ9JzI3MCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWxsPScjMjAyMzJmJy8+PC9zdmc+"
            />
          ) : (
            <div className="aspect-video grid place-items-center text-white/40 text-xs">No Image</div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent transition-colors duration-200 group-hover:from-black/80">
            <p className="text-white/90 group-hover:text-white transition-colors duration-200 text-xs font-medium line-clamp-2">{g.title}</p>
          </div>
        </Link>
      ))}
    </aside>
  );
}
