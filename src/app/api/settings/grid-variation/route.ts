import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Mode = "two" | "three";
const KEY = "gridVariationMode";
const DEFAULT_MODE: Mode = "three";

export async function GET() {
  try {
    const val = await storage.getSetting<Mode>(KEY);
    const mode: Mode = val === "two" || val === "three" ? val : DEFAULT_MODE;
    return NextResponse.json({ ok: true, data: { mode } });
  } catch {
    return NextResponse.json({ ok: true, data: { mode: DEFAULT_MODE } });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const mode: unknown = body?.mode;
    if (mode !== "two" && mode !== "three") {
      return NextResponse.json({ ok: false, error: "Invalid mode" }, { status: 400 });
    }
    const ok = await storage.setSetting(KEY, mode);
    if (!ok) return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
    return NextResponse.json({ ok: true, data: { mode } });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
