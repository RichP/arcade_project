import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// Small feed fetcher to avoid CORS from client. Allows http/https and returns JSON or raw text/XML.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) {
      return new Response(JSON.stringify({ ok: false, error: "Missing url" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    if (!/^https?:\/\//i.test(url)) {
      return new Response(JSON.stringify({ ok: false, error: "Only http/https URLs are allowed" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const res = await fetch(url, { headers: { accept: "application/json,application/xml,text/xml,text/plain;q=0.9,*/*;q=0.1" } });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: `Upstream error: ${res.status}` }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    // Try JSON first; if not JSON, return raw text and let client-side adapters parse (e.g., XML)
    let data: unknown;
    if (ct.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      // Some feeds may send JSON with text/plain content-type
      try {
        data = JSON.parse(text);
      } catch {
        data = text; // return raw text (XML/CSV/etc.)
      }
    }

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch feed";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
