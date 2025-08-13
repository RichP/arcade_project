"use client";

import React, { useEffect, useRef, useState } from "react";
import { magLeave, magMove } from "@/lib/magnetic";
import GameCard from "./GameCard";

type Game = Parameters<typeof GameCard>[0]["game"]; // Type definition for Game

export default function FeaturedCarousel({ games }: { games: Game[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const [canMag, setCanMag] = useState(false);

  useEffect(() => {
    try {
      const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const finePointer = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: fine)").matches;
      setCanMag(!reduce && finePointer);
    } catch {
      setCanMag(false);
    }
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, []);

  const onMagMove: React.MouseEventHandler<HTMLElement> | undefined = canMag
    ? (e) => {
        if (rafId.current) return;
        rafId.current = requestAnimationFrame(() => {
          rafId.current = null;
          magMove(e as unknown as React.MouseEvent<HTMLElement>, 4);
        });
      }
    : undefined;

  const onMagLeave: React.MouseEventHandler<HTMLElement> | undefined = canMag
    ? (e) => magLeave(e as unknown as React.MouseEvent<HTMLElement>)
    : undefined;

  const scrollBy = (delta: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  const cardWidth = 260 + 16; // min width + gap

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollBy(-(scroller.current?.firstElementChild?.clientWidth || cardWidth));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollBy(scroller.current?.firstElementChild?.clientWidth || cardWidth);
    } else if (e.key === "Home") {
      e.preventDefault();
      scroller.current?.scrollTo({ left: 0, behavior: "smooth" });
    } else if (e.key === "End") {
      e.preventDefault();
      const el = scroller.current;
      if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    }
  };

  const placeholders = Array.from({ length: 4 });

  return (
    <div className="relative" style={{ contentVisibility: "auto" }}>
      <button
        type="button"
        aria-label="Scroll left"
  onClick={() => scrollBy(-(scroller.current?.firstElementChild?.clientWidth || cardWidth))}
  onMouseMove={onMagMove}
  onMouseLeave={onMagLeave}
        className="carousel-arrow pressable left-0 top-1/2 -translate-y-1/2"
      >
        ‹
      </button>

      <div
        ref={scroller}
        className="flex overflow-x-auto gap-4 pr-2 pl-12 snap-x snap-mandatory no-scrollbar"
        tabIndex={0}
        role="region"
        aria-label="Featured games"
        onKeyDown={onKeyDown}
      >
        {games && games.length > 0 ? (
          games.map((g, idx) => (
            <div key={g.id} className="min-w-[260px] snap-start" style={{ contentVisibility: "auto", containIntrinsicSize: "300px" }}>
              <GameCard game={g} /* First featured as priority for LCP */ {...(idx === 0 ? { priority: true } : {})} />
            </div>
          ))
        ) : (
          placeholders.map((_, i) => (
            <div key={i} className="min-w-[260px] snap-start">
              <div className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
                <div className="aspect-video skeleton" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 skeleton" />
                  <div className="h-3 w-1/3 skeleton" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        aria-label="Scroll right"
  onClick={() => scrollBy(scroller.current?.firstElementChild?.clientWidth || cardWidth)}
  onMouseMove={onMagMove}
  onMouseLeave={onMagLeave}
        className="carousel-arrow pressable right-0 top-1/2 -translate-y-1/2"
      >
        ›
      </button>
    </div>
  );
}
