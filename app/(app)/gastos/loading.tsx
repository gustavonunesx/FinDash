export default function GastosLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-40 skeleton-shimmer rounded-lg" />
        <div className="h-4 w-56 skeleton-shimmer rounded" />
      </div>

      {/* Category cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div 
            key={i} 
            className="h-24 skeleton-shimmer rounded-xl border-l-[3px] border-muted"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="h-4 w-24 skeleton-shimmer rounded" />
          <div className="h-8 w-28 skeleton-shimmer rounded-lg" />
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="bg-muted/30 px-4 py-3 flex gap-4">
            <div className="h-3 w-12 skeleton-shimmer rounded" />
            <div className="h-3 w-20 skeleton-shimmer rounded hidden sm:block" />
            <div className="h-3 w-12 skeleton-shimmer rounded ml-auto" />
          </div>
          {/* Table rows */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-t border-border/50">
              <div className="h-4 flex-1 max-w-32 skeleton-shimmer rounded" />
              <div className="h-5 w-20 skeleton-shimmer rounded-full hidden sm:block" />
              <div className="h-4 w-24 skeleton-shimmer rounded ml-auto" />
              <div className="flex gap-1">
                <div className="h-8 w-8 skeleton-shimmer rounded-lg" />
                <div className="h-8 w-8 skeleton-shimmer rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
