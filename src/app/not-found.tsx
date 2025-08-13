import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-lg">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.06),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.04),transparent_40%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-3xl">🧩</span>
            <h1 className="text-xl font-semibold text-white">Level not found</h1>
          </div>
          <p className="text-white/70 text-sm mt-2">The page you’re looking for has moved, or never existed.</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link href="/" className="btn-primary rounded-md px-3 py-1.5 text-sm">Back to home</Link>
            <Link href="/random" className="chip rounded-md px-3 py-1.5 text-sm border">Play something random 🎲</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
