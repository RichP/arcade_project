import { NextRequest, NextResponse } from "next/server";

function getSecret(): string | null {
  return process.env.APP_SECRET || process.env.NEXTAUTH_SECRET || null;
}

function isDev(): boolean {
  return process.env.NODE_ENV !== "production";
}

function verifyCookie(val: string | undefined): boolean | Promise<boolean> {
  if (!val) return false;
  try {
    const secret = getSecret();
    if (!secret) return false;
    const [payload, sig] = val.split(".");
    if (!payload || !sig) return false;
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    const algo = { name: "HMAC", hash: "SHA-256" } as const;
    // edge-compatible subtle crypto
    return crypto.subtle.importKey("raw", keyData, algo, false, ["sign"]).then(async (key) => {
      const mac = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
      const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
      if (hex !== sig) return false;
      const [user, expStr] = payload.split("|");
      const exp = Number(expStr || 0);
      if (!user || !Number.isFinite(exp)) return false;
      if (Date.now() > exp) return false;
      return true;
    });
  } catch {
    return false;
  }
}

async function isAuthed(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get("admin_auth")?.value;
  const ok = await verifyCookie(cookie);
  if (ok) return true;
  // Allow in dev if no ADMIN_PASSWORD configured (local only)
  if (isDev() && !process.env.ADMIN_PASSWORD) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth checks for login endpoint and static assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
  pathname.startsWith("/admin/login") ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/cookies") ||
    pathname.startsWith("/terms")
  ) {
    return NextResponse.next();
  }

  // Protect /admin routes
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!(await isAuthed(req))) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  // Protect mutating admin APIs (allow GET; block POST/PUT/PATCH/DELETE)
  if (pathname.startsWith("/api/")) {
    const isMutation = req.method !== "GET" && req.method !== "HEAD";
    const isAdminApi =
      pathname.startsWith("/api/games") ||
      pathname.startsWith("/api/genres") ||
      pathname.startsWith("/api/settings") ||
  pathname.startsWith("/api/backup") ||
  pathname.startsWith("/api/redirects");
    // Require auth for mutations to admin APIs, and for backup endpoint even on GET
  if (((isMutation && isAdminApi) || pathname.startsWith("/api/backup")) && !(await isAuthed(req))) {
      return new NextResponse(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/:path*",
  ],
};
