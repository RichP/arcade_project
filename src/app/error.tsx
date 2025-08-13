"use client";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="mx-auto max-w-xl p-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-lg">
            {/* playful confetti dots */}
            <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[conic-gradient(var(--primary)_0_25%,transparent_25_100%)] opacity-15 blur-2xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,white_0,transparent_60%)] opacity-10" />

            <div className="flex items-center gap-3">
              <span aria-hidden className="text-3xl">🕹️</span>
              <h1 className="text-xl font-semibold text-white">Whoops! The arcade cabinet hiccupped</h1>
            </div>
            <p className="text-white/70 text-sm mt-2">That’s on us. Want to give it another go?</p>
            {error?.digest && <p className="text-white/40 text-xs mt-2">Ref: {error.digest}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button onClick={reset} className="btn-primary rounded-md px-3 py-1.5 text-sm">Try again</button>
              <Link href="/random" className="chip rounded-md px-3 py-1.5 text-sm border">Surprise me 🎲</Link>
              <Link href="/" className="chip rounded-md px-3 py-1.5 text-sm border">Go home</Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
