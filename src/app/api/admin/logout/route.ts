import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const accept = req.headers.get("accept") || "";
  const wantsHtml = accept.includes("text/html");
  const res = wantsHtml ? NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")) : NextResponse.json({ ok: true });
  // Clear the cookie by setting an expiry in the past
  res.cookies.set("admin_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return res;
}

export function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}
