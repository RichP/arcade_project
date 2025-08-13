import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";
import type { Game } from "@/types/game";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

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

async function readGames(): Promise<Game[]> { return storage.listGames(); }
async function writeGames(list: Game[]) { await storage.upsertMany(list); }

function coerceArray(val: unknown): string[] | undefined {
  if (val == null) return undefined;
  if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof val === "string") {
    return val
      .split(/[\,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

function generateNextId(existing: string[]): string {
  const nums = existing
    .map((id) => (id && id.startsWith("g-") ? parseInt(id.slice(2).replace(/^0+/, "") || "0", 10) : NaN))
    .filter((n) => Number.isFinite(n)) as number[];
  const max = nums.length ? Math.max(...nums) : 0;
  const next = max + 1;
  const padded = String(next).padStart(4, "0");
  return `g-${padded}`;
}

export async function GET() {
  try {
    const list = await readGames();
    return Response.json({ ok: true, data: list });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to read games";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const getStr = (k: string) => {
      const v = body[k];
      return typeof v === "string" ? v.trim() : "";
    };
    const title = getStr("title");
    const url = getStr("url");
    const thumbnail = getStr("thumbnail");
    if (!title || !url || !thumbnail) {
      return new Response(JSON.stringify({ ok: false, error: "title, url and thumbnail are required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const list = await readGames();
    const ids = list.map((g) => g.id).filter(Boolean) as string[];
    let id = getStr("id");
    if (!id || ids.includes(id)) {
      id = generateNextId(ids);
    }

    const item: Game = {
      id,
      slug: (() => {
        const s = getStr("slug");
        const fromTitle = slugify(title);
        const raw = (s || fromTitle).toLowerCase();
        // sanitize just in case
        return raw.replace(/[^a-z0-9\-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
      })(),
      title,
      url,
      thumbnail,
      featured: Boolean(body["featured"]) || undefined,
      genre: coerceArray(body["genre"]),
      platforms: coerceArray(body["platforms"]),
      mobile: body["mobile"] != null ? Boolean(body["mobile"]) : undefined,
      height: body["height"] != null ? Number(body["height"]) : undefined,
      width: body["width"] != null ? Number(body["width"]) : undefined,
      rating: body["rating"] != null ? Number(body["rating"]) : undefined,
      released: getStr("released") || undefined,
      description: getStr("description") || undefined,
      tags: coerceArray(body["tags"]),
    };

  if (storage.usingDb()) {
      const saved = await storage.addGame(item);
      return Response.json({ ok: true, data: saved });
    } else {
      list.push(item);
      await writeGames(list);
      return Response.json({ ok: true, data: item });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to add game";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function DELETE() {
  try {
    const n = await storage.deleteAllGames();
    return Response.json({ ok: true, data: { deleted: n } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete all games";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
