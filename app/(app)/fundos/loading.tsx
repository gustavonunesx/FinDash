export default function FundosLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-24 skeleton-shimmer rounded-lg" />
        <div className="h-4 w-56 skeleton-shimmer rounded" />
      </div>

      {/* Action bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 skeleton-shimmer rounded" />
        <div className="h-8 w-28 skeleton-shimmer rounded-lg" />
      </div>

      {/* Fund cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2].map((i) => (
          <div 
            key={i} 
            className="rounded-xl border border-border bg-card p-5 space-y-4 border-l-[3px] border-l-muted"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2.5 skeleton-shimmer rounded-full" />
                <div className="h-5 w-28 skeleton-shimmer rounded" />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="h-7 w-32 skeleton-shimmer rounded" />
              <div className="h-3 w-20 skeleton-shimmer rounded" />
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-2.5 skeleton-shimmer rounded-full" />
              <div className="flex justify-between">
                <div className="h-3 w-20 skeleton-shimmer rounded" />
                <div className="h-3 w-24 skeleton-shimmer rounded" />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border/50 flex justify-between">
              <div className="h-3 w-28 skeleton-shimmer rounded" />
              <div className="h-3 w-24 skeleton-shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
