export default function GameCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] animate-pulse">
      <div className="aspect-video w-full bg-white/[0.06]" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-white/[0.08] rounded w-3/4" />
        <div className="flex items-center gap-2">
          <div className="h-3 bg-white/[0.08] rounded w-20" />
          <div className="h-3 bg-white/[0.08] rounded w-8" />
        </div>
      </div>
    </div>
  );
}
