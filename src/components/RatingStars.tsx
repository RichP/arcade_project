import React, { CSSProperties } from "react";

export function Star({ fraction = 0 }: { fraction?: number }) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <defs>
        <clipPath id="starClip">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </clipPath>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
        className="fill-white/15"
      />
      <rect x="0" y="0" width={`${pct}%`} height="100%" className="fill-[--star-color]" clipPath="url(#starClip)" />
    </svg>
  );
}

export default function RatingStars({ rating = 0 }: { rating?: number }) {
  const safe = Math.max(0, Math.min(5, rating));
  const full = Math.floor(safe);
  const frac = safe - full;
  const stars = Array.from({ length: 5 }, (_, i) => {
    const fraction = i < full ? 1 : i === full ? frac : 0;
    return <Star key={i} fraction={fraction} />;
  });
  const style = { "--star-color": "#fbbf24" } as CSSProperties & Record<string, string>;
  return (
    <div className="sparkle flex items-center gap-1" style={style}>
      <div className="sparkle-dot" />
      {stars}
    </div>
  );
}
