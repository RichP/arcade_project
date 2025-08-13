import Link from "next/link";
import type { CSSProperties } from "react";
import type { Game } from "@/types/game";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 360;
}

export default async function TagsIndex() {
  const games = (await storage.listGames()) as Game[];
  const counts = new Map<string, number>();
  for (const g of games) {
    for (const t of (g.tags || [])) {
      const key = (t || "").trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  const entries = Array.from(counts.entries()).sort((a,b) => a[0].localeCompare(b[0], undefined, { sensitivity: "base" }));
  const sections = new Map<string, { tag: string; count: number }[]>();
  for (const [tag, count] of entries) {
    const first = tag[0]?.toUpperCase() || "#";
    const key = first >= "A" && first <= "Z" ? first : "#";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push({ tag, count });
  }
  const indexLetters = Array.from(sections.keys()).sort((a,b) => a.localeCompare(b));

  const chipHueStyle = (h: number): CSSProperties => ({ ["--chip-h" as string]: h } as unknown as CSSProperties);

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-white font-semibold text-xl">Tags</h1>
        <nav className="hidden sm:flex gap-2 text-xs text-white/60">
          {indexLetters.map((ch) => (
            <a key={ch} href={`#sec-${ch}`} className="hover:text-white/90">{ch}</a>
          ))}
        </nav>
      </header>

      <div className="space-y-8">
        {indexLetters.map((ch) => (
          <div key={ch} id={`sec-${ch}`}>
            <h2 className="text-white/80 font-medium mb-3">{ch}</h2>
            <div className="flex flex-wrap gap-2">
              {sections.get(ch)!.map(({ tag, count }) => {
                const hue = hashHue(tag);
                return (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="chip-subdued rounded-full px-3 py-1 text-sm border"
                    style={chipHueStyle(hue)}
                    title={`View games tagged ${tag}`}
                  >
                    <span className="text-white/90">{tag}</span>
                    <span className="ml-2 text-white/60">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
