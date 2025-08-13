import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Profile = "subtle" | "celebration" | "low-power";
const KEY = "confettiProfile";
const DEFAULT_PROFILE: Profile = "celebration";

export async function GET() {
  try {
    const val = await storage.getSetting<Profile>(KEY);
    const profile: Profile = (val === "subtle" || val === "low-power" || val === "celebration") ? val : DEFAULT_PROFILE;
    return NextResponse.json({ ok: true, data: { profile } });
  } catch {
    return NextResponse.json({ ok: true, data: { profile: DEFAULT_PROFILE } });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const profile: unknown = body?.profile;
    if (profile !== "subtle" && profile !== "celebration" && profile !== "low-power") {
      return NextResponse.json({ ok: false, error: "Invalid profile" }, { status: 400 });
    }
    const ok = await storage.setSetting(KEY, profile);
    if (!ok) return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
    return NextResponse.json({ ok: true, data: { profile } });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
