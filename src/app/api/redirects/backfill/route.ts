import { storage } from "@/lib/storage";
import type { Game } from "@/types/game";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type BackupShape = { games?: Game[] } | Game[];

function asGames(body: unknown): Game[] | undefined {
  if (!body) return undefined;
  if (Array.isArray(body)) return body as Game[];
  if (typeof body === "object" && (body as Record<string, unknown>)["games"]) {
    const g = (body as Record<string, unknown>)["games"];
    return Array.isArray(g) ? (g as Game[]) : undefined;
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => undefined)) as BackupShape | undefined;
    const oldGames = asGames(body);
    if (!oldGames || oldGames.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Provide an old backup JSON with a games array" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const current = (await storage.listGames()) as Game[];
    const byId = new Map(current.map((g) => [g.id, g]));
    let created = 0;
    for (const og of oldGames) {
      const id = og?.id;
      const oldSlug = og?.slug;
      if (!id || !oldSlug) continue;
      const now = byId.get(id);
      if (!now) continue;
      const curSlug = now.slug;
      if (!curSlug || curSlug === oldSlug) continue;
      const ok = await storage.addSlugRedirect(oldSlug, id);
      if (ok) created++;
    }
    return Response.json({ ok: true, created });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to backfill redirects";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
