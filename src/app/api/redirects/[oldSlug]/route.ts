import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type Ctx = { params: Promise<{ oldSlug: string }> };

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const { oldSlug } = await ctx.params;
    const ok = await storage.deleteSlugRedirect(oldSlug);
    if (!ok) {
      return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    return Response.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete redirect";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
