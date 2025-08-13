import { storage } from "@/lib/storage";
import type { Game } from "@/types/game";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  try {
    const redirects = await storage.listSlugRedirects();
    const games = (await storage.listGames()) as Game[];
    const byId = new Map(games.map((g) => [g.id, g]));
    const enriched = redirects.map((r) => {
      const g = byId.get(r.gameId);
      return {
        oldSlug: r.oldSlug,
        gameId: r.gameId,
        currentSlug: g?.slug || null,
        title: g?.title || null,
      };
    });
    return Response.json({ ok: true, data: enriched });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to list redirects";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
