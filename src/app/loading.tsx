import GameCardSkeleton from "../components/GameCardSkeleton";

export default function Loading() {
  return (
    <section className="space-y-6">
      {/* Featured skeleton */}
      <div>
        <div className="h-5 w-32 bg-white/[0.08] rounded mb-3" />
        <div className="flex overflow-x-hidden gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="min-w-[260px]">
              <GameCardSkeleton />
            </div>
          ))}
        </div>
      </div>

      {/* Stripe skeletons */}
      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, s) => (
          <div key={s}>
            <div className="h-5 w-40 bg-white/[0.08] rounded mb-3" />
            <div className="flex overflow-x-hidden gap-4">
              {Array.from({ length: 6 }).map((__, i) => (
                <div key={i} className="min-w-[220px] max-w-[260px]">
                  <GameCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid skeleton */}
      <div className="mt-6">
        <div className="h-5 w-24 bg-white/[0.08] rounded mb-3" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
