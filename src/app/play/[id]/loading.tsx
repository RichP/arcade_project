export default function Loading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="w-full rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
          <div className="aspect-video bg-white/5 animate-pulse" />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="h-5 w-2/3 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-1/3 bg-white/5 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 w-16 bg-white/5 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <aside className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden border border-white/10 bg-white/[0.02]">
            <div className="aspect-video bg-white/5 animate-pulse" />
          </div>
        ))}
      </aside>
    </div>
  );
}
