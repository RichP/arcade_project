export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-72 bg-white/5 rounded animate-pulse" />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
            <div className="aspect-video bg-white/5 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-3/5 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-2/5 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
