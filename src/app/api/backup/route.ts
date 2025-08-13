import { storage } from "@/lib/storage";
import type { Game } from "@/types/game";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const games = await storage.listGames();
  const body = JSON.stringify({ games }, null, 2);
  const headers = new Headers({ "content-type": "application/json" });
  const dl = url.searchParams.get("download");
  if (dl !== "0") {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    headers.set("content-disposition", `attachment; filename="arcade-backup-${stamp}.json"`);
  }
  return new Response(body, { headers });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const items = (json?.games ?? json) as unknown;
    if (!Array.isArray(items)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid payload: expected an array or {games: []}" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    // Minimal normalization
  type Incoming = Record<string, unknown> & { id: string; title: string; slug?: unknown };
    const normalized: Game[] = items
      .filter((g: unknown): g is Incoming => {
        if (!g || typeof g !== "object") return false;
        const r = g as Record<string, unknown>;
        return typeof r.id === "string" && typeof r.title === "string";
      })
      .map((g) => ({
        id: String(g.id),
        slug: typeof g.slug === "string" && g.slug.trim() ? String(g.slug) : slugify(String(g.title)),
        title: String(g.title),
        featured: toBoolU(g.featured),
        genre: toStrArrU(g.genre),
        platforms: toStrArrU(g.platforms),
        mobile: toBoolU(g.mobile),
        height: toNumU(g.height),
        width: toNumU(g.width),
        rating: toNumU(g.rating),
        released: toStrU(g.released),
        thumbnail: toStrU(g.thumbnail),
        description: toStrU(g.description),
        tags: toStrArrU(g.tags),
        url: toStrU(g.url),
      }));
    const count = await storage.upsertMany(normalized);
    return new Response(JSON.stringify({ ok: true, data: { count } }), { headers: { "content-type": "application/json" } });
  } catch (e: unknown) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Restore failed" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}

function toStrU(v: unknown): string | undefined { return typeof v === "string" && v.trim() ? v : undefined; }
function toNumU(v: unknown): number | undefined { const n = Number(v); return Number.isFinite(n) ? n : undefined; }
function toBoolU(v: unknown): boolean | undefined { return typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : undefined; }
function toStrArrU(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  if (typeof v === "string") return v.split(/[\n,]/g).map((s) => s.trim()).filter(Boolean);
  return undefined;
}
