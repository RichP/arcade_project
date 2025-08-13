"use client";

import { useEffect, useRef, useState } from "react";
import { confettiAtElement } from "../lib/confetti";
import { useConfettiProfile } from "./ConfettiProfileProvider";
import { magLeave, magMove } from "@/lib/magnetic";

export default function FavoriteButton({ id, className = "" }: { id: string; className?: string }) {
  const [fav, setFav] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const profile = useConfettiProfile();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("favorites");
      const list: string[] = raw ? JSON.parse(raw) : [];
      setFav(list.includes(id));
    } catch {}
  }, [id]);

  // Profile is provided by context from page-level provider

  const toggle = () => {
    try {
      const raw = localStorage.getItem("favorites");
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      localStorage.setItem("favorites", JSON.stringify(next));
      const nowFav = next.includes(id);
      setFav(nowFav);
    if (nowFav) {
        // Schedule after state flush/paint to avoid blocking the click frame
        try {
      requestAnimationFrame(() => confettiAtElement(btnRef.current, { profile }));
        } catch {
      confettiAtElement(btnRef.current, { profile });
        }
        // Achievement toast when reaching 5 favorites (one-time)
        try {
          const seen = localStorage.getItem("achv-5-favs");
          if (!seen && next.length >= 5) {
            localStorage.setItem("achv-5-favs", "1");
            window.dispatchEvent(new CustomEvent("app:toast", { detail: { message: "Achievement unlocked: 5 favorites!" } }));
          }
        } catch {}
      }
      try {
        window.dispatchEvent(new CustomEvent("favorites-updated", { detail: next }));
      } catch {}
    } catch {}
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
  onMouseMove={(e) => magMove(e as unknown as React.MouseEvent<HTMLElement>, 3)}
  onMouseLeave={(e) => magLeave(e as unknown as React.MouseEvent<HTMLElement>)}
      aria-pressed={fav}
      title={fav ? "Remove from favorites" : "Add to favorites"}
  className={`rounded-full p-1.5 backdrop-blur border border-white/10 bg-black/30 hover:bg-black/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-black/20 ${className}`}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path
          d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z"
          fill={fav ? "var(--primary)" : "#ffffff40"}
          stroke="#ffffffaa"
          strokeWidth="1.5"
        />
      </svg>
    </button>
  );
}
