import type { MetadataRoute } from "next";
import { storage } from "@/lib/storage";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const url = (p: string) => (base ? `${base}${p}` : p);
  const now = new Date();

  // Static core routes
  const items: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: url("/cookies"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Dynamic per-game routes using their stable IDs; slugs are optional for SEO prettiness only
  try {
    const games = await storage.listGames();
    for (const g of games) {
      const id = g.id;
      if (!id) continue;
      const handle = g.slug ? g.slug : id;
      const lm = g.released ? new Date(g.released) : now;
      items.push({
        url: url(`/play/${encodeURIComponent(handle)}`),
        lastModified: isNaN(lm.getTime()) ? now : lm,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    // If storage fails (e.g., DB unreachable during build), still return core routes
  }

  return items;
}
