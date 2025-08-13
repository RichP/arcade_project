import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
  const body = (await req.json()) as { name?: string; includes?: string[]; emoji?: string };
  const emoji = sanitizeEmoji(body.emoji);
  const item = await storage.upsertGenreMapping({ id, name: String(body.name || "Unnamed"), includes: Array.isArray(body.includes) ? body.includes : [], emoji });
    return Response.json({ ok: true, data: item });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "failed";
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const ok = await storage.deleteGenreMapping(id);
    return Response.json({ ok });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "failed";
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
}

function sanitizeEmoji(input?: string): string | undefined {
  if (!input) return undefined;
  const s = String(input).trim();
  if (!s) return undefined;
  return s.slice(0, 8);
}
