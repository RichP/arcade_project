"use client";

import React, { useState, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import FavoriteButton from "@/components/FavoriteButton";
import FavMark from "@/components/FavMark";
import RatingStars from "./RatingStars";

type Game = {
  id: string;
  slug?: string;
  title: string;
  featured?: boolean;
  genre?: string[];
  platforms?: string[];
  mobile?: boolean;
  height?: number;
  width?: number;
  rating?: number;
  released?: string;
  thumbnail?: string;
  description?: string;
  tags?: string[];
  url?: string;
  // Some entries may have stray keys with different casing
  Width?: number;
};

// rating stars now imported from RatingStars

function GameCardImpl({ game, aspectClass = "aspect-video", titleLines = 1, recentDays = 14, priority = false }: { game: Game; aspectClass?: string; titleLines?: 1 | 2; recentDays?: number; priority?: boolean }) {
  const rating = game.rating ?? 0;
  const thumb = game.thumbnail;
  const isTopRated = (rating ?? 0) >= 4.7;
  const isRecent = (() => {
    try {
      if (!game.released) return false;
      const d = new Date(game.released);
      if (isNaN(d.getTime())) return false;
      const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= recentDays;
    } catch {
      return false;
    }
  })();
  const platformBadge = game.mobile === true ? "📱" : "💻";
  const [copied, setCopied] = useState(false);
  const onCopy: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    try {
  const url = `${window.location.origin}/play/${encodeURIComponent(game.slug || game.id)}`;
      await navigator.clipboard.writeText(url);
      window.dispatchEvent(new CustomEvent("app:toast", { detail: { message: "Link copied" } }));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {}
  };
  const playHref = `/play/${encodeURIComponent(game.slug || game.id)}`;
  return (
    <Link
      href={playHref}
      className="game-card group block rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200 hover:shadow-xl hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      style={{ contentVisibility: "auto", containIntrinsicSize: "300px" } as React.CSSProperties}
    >
  <div className={`${aspectClass} w-full overflow-hidden bg-black/30 relative thumb-shine`}>
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          <FavoriteButton id={game.id} />
          <button
            type="button"
            aria-label="Copy link"
            onClick={onCopy}
            className="pressable text-xs bg-black/40 border border-white/10 rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus-pill pointer-events-none group-hover:pointer-events-auto touch:pointer-events-auto touch:opacity-100"
            data-ripple
            title="Copy link"
          >
            {copied ? "✅" : "🔗"}
          </button>
        </div>
        <div className="absolute left-2 bottom-2 z-10">
          <FavMark id={game.id} />
        </div>
        {isRecent ? (
          <span className="badge-new absolute left-2 top-2 z-10 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[var(--primary)]/90 text-[var(--on-primary)] border border-white/10 shadow">
            New
          </span>
        ) : isTopRated ? (
          <span className="ribbon z-10">Top</span>
        ) : null}
  <span className="absolute right-2 bottom-2 z-10 text-xs bg-black/40 border border-white/10 rounded-full px-2 py-0.5 opacity-80 group-hover:opacity-100 transition-opacity will-change-transform focus-pill" tabIndex={0} title={game.mobile ? "Mobile" : "Desktop"}>
          <span aria-hidden>{platformBadge}</span>
          <span className="sr-only">{game.mobile ? "Mobile" : "Desktop"}</span>
        </span>
        {thumb ? (
          <Image
            src={thumb}
            alt={game.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading={priority ? undefined : "lazy"}
            priority={priority}
            width={800}
            height={450}
            quality={70}
            sizes="(max-width: 640px) 70vw, (max-width: 768px) 240px, (max-width: 1024px) 260px, 300px"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDgwJyBoZWlnaHQ9JzI3MCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWxsPScjMjAyMzJmJy8+PC9zdmc+"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-white/40 text-xs">
            No Image
          </div>
        )}
        {/* Subtle quick-view on hover */}
        {game.description ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 p-2">
            <div className="line-clamp-2 text-[11px] leading-snug text-white/90 bg-black/50 backdrop-blur-sm rounded-md px-2 py-1 border border-white/10">
              {game.description}
            </div>
          </div>
        ) : null}

  {/* Play now CTA chip (top-center to avoid overlap with other pills) */}
  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-2 z-10 text-[11px] bg-[var(--primary)] text-[var(--on-primary)] border border-white/10 rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity select-none">
          Play now
        </span>
      </div>
      <div className="p-3">
        <h3 className={`text-white text-sm font-medium ${titleLines === 2 ? "line-clamp-2" : "line-clamp-1"}`}>{game.title}</h3>
        <div className="mt-2 flex items-center gap-2">
      <RatingStars rating={rating} />
          <span className="text-white/40 text-xs">{rating.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  );
}

const GameCard = memo(GameCardImpl);
export default GameCard;
