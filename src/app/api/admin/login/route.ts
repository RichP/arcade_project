import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function getSecret(): string {
  const s = process.env.APP_SECRET || process.env.NEXTAUTH_SECRET as string | undefined;
  if (!s) throw new Error("APP_SECRET not configured");
  return s;
}

async function sign(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${payload}.${hex}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { password?: string };
    const pwd = body?.password || "";
    const expected = process.env.ADMIN_PASSWORD || "";
    if (!expected) {
      return new Response(JSON.stringify({ ok: false, error: "Server not configured" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    if (pwd !== expected) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid password" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    // 12h expiry
    const exp = Date.now() + 12 * 60 * 60 * 1000;
    const token = await sign(`admin|${exp}`);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_auth", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(exp),
    });
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Login failed";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
