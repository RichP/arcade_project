"use client";

import { useEffect, useState } from "react";

export default function FavMark({ id, className = "" }: { id: string; className?: string }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("favorites");
        const list: string[] = raw ? JSON.parse(raw) : [];
        setFav(list.includes(id));
      } catch {
        setFav(false);
      }
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "favorites") read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id]);

  if (!fav) return null;

  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full w-5 h-5 bg-black/60 border border-white/20 shadow-sm ${className}`}
      title="Favorited"
    >
      <svg viewBox="0 0 24 24" width="12" height="12">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" fill="var(--primary)" stroke="#ffffffaa" strokeWidth="1" />
      </svg>
    </span>
  );
}
