import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MobileAspect = "square" | "video";
const KEY = "mobileCardAspect";
const DEFAULT_VALUE: MobileAspect = "square";

export async function GET() {
  try {
    const val = await storage.getSetting<MobileAspect>(KEY);
    const value: MobileAspect = val === "square" || val === "video" ? val : DEFAULT_VALUE;
    return NextResponse.json({ ok: true, data: { value } });
  } catch {
    return NextResponse.json({ ok: true, data: { value: DEFAULT_VALUE } });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const value: unknown = body?.value;
    if (value !== "square" && value !== "video") {
      return NextResponse.json({ ok: false, error: "Invalid value" }, { status: 400 });
    }
    const ok = await storage.setSetting(KEY, value);
    if (!ok) return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
    return NextResponse.json({ ok: true, data: { value } });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
