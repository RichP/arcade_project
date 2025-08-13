import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import type { Game } from "@/types/game";

export const runtime = "nodejs";

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const url = (p: string) => (base ? `${base}${p}` : p);
  const now = new Date();

  type Item = { url: string; lastModified: Date; changeFrequency?: string; priority?: number };
  const items: Item[] = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: url("/cookies"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const games = (await storage.listGames()) as Game[];
    for (const g of games) {
      const id = g.id;
      if (!id) continue;
      const handle = g.slug ? g.slug : id;
      // Prefer updatedAt, then released date, else current time
      const lmSource = g.updatedAt || g.released;
      const lm = lmSource ? new Date(lmSource) : now;
      items.push({
        url: url(`/play/${encodeURIComponent(handle)}`),
        lastModified: isNaN(lm.getTime()) ? now : lm,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    // Tag pages
    const seen = new Set<string>();
    for (const g of games) {
      for (const t of (g.tags || [])) {
        const tag = (t || "").trim();
        if (!tag || seen.has(tag)) continue;
        seen.add(tag);
        items.push({
          url: url(`/tags/${encodeURIComponent(tag)}`),
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.3,
        });
      }
    }
    if (seen.size > 0) {
      items.push({ url: url("/tags"), lastModified: now, changeFrequency: "weekly", priority: 0.4 });
    }
  } catch {
    // ignore storage errors; return core URLs
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
    + items.map((it) => {
        const parts = [
          `<loc>${xmlEscape(it.url)}</loc>`,
          `<lastmod>${it.lastModified.toISOString()}</lastmod>`,
        ];
        if (it.changeFrequency) parts.push(`<changefreq>${it.changeFrequency}</changefreq>`);
        if (typeof it.priority === "number") parts.push(`<priority>${it.priority.toFixed(1)}</priority>`);
        return `<url>${parts.join("")}</url>`;
      }).join("")
    + `</urlset>`;

  return new NextResponse(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
