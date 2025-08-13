import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await storage.listGenreMappings();
    return Response.json({ ok: true, data: items });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "failed";
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
  const body = (await req.json()) as { id?: string; name?: string; includes?: string[]; emoji?: string };
    const list = await storage.listGenreMappings();
    // generate id
    const ids = list.map((x) => x.id).filter(Boolean);
    const id = body.id && !ids.includes(body.id) ? body.id : genNext("gm-", ids);
  const emoji = sanitizeEmoji(body.emoji);
  const item = await storage.upsertGenreMapping({ id, name: String(body.name || "Unnamed"), includes: Array.isArray(body.includes) ? body.includes : [], emoji });
    return Response.json({ ok: true, data: item });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "failed";
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
}

function genNext(prefix: string, existing: string[]): string {
  const nums = existing
    .map((id) => (id.startsWith(prefix) ? parseInt(id.slice(prefix.length).replace(/^0+/, "") || "0", 10) : NaN))
    .filter((n) => Number.isFinite(n)) as number[];
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function sanitizeEmoji(input?: string): string | undefined {
  if (!input) return undefined;
  const s = String(input).trim();
  if (!s) return undefined;
  // Limit to short glyphs; allow multi-codepoint emojis but cap length to avoid abuse
  return s.slice(0, 8);
}
