// Route Handlers use the Web Request type
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

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: RouteContext) {
  try {
  const { id } = await ctx.params;
    const patch = (await req.json()) as Record<string, unknown>;
    // Normalize array-ish fields
    const normPatch: Partial<Game> = {
      ...patch,
      title: patch["title"] != null ? String(patch["title"]) : undefined,
  slug: patch["slug"] != null ? String(patch["slug"]).toLowerCase().replace(/[^a-z0-9\-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "") : undefined,
      url: patch["url"] != null ? String(patch["url"]) : undefined,
      thumbnail: patch["thumbnail"] != null ? String(patch["thumbnail"]) : undefined,
      featured: patch["featured"] != null ? Boolean(patch["featured"]) : undefined,
      genre: patch["genre"] != null ? coerceArray(patch["genre"]) : undefined,
      platforms: patch["platforms"] != null ? coerceArray(patch["platforms"]) : undefined,
      mobile: patch["mobile"] != null ? Boolean(patch["mobile"]) : undefined,
      height: patch["height"] != null ? Number(patch["height"]) : undefined,
      width: patch["width"] != null ? Number(patch["width"]) : undefined,
      rating: patch["rating"] != null ? Number(patch["rating"]) : undefined,
      released: patch["released"] != null ? String(patch["released"]) : undefined,
      description: patch["description"] != null ? String(patch["description"]) : undefined,
      tags: patch["tags"] != null ? coerceArray(patch["tags"]) : undefined,
    } as Partial<Game>;

    // If title provided and slug not explicitly set, (re)generate slug
  if (typeof normPatch.title === "string" && (normPatch.slug == null || normPatch.slug === "")) {
      normPatch.slug = slugify(normPatch.title);
    }
    const updated = await storage.updateGame(id, normPatch);
    if (!updated) {
      return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    return Response.json({ ok: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update game";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function DELETE(_: Request, ctx: RouteContext) {
  try {
  const { id } = await ctx.params;
    const removed = await storage.deleteGame(id);
    if (!removed) {
      return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    return Response.json({ ok: true, data: removed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete game";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
