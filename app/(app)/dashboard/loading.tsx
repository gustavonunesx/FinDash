export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 skeleton-shimmer rounded-lg" />
        <div className="h-4 w-64 skeleton-shimmer rounded" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div 
            key={i} 
            className="h-24 skeleton-shimmer rounded-xl border-l-[3px] border-muted"
          />
        ))}
      </div>

      {/* Distribution card skeleton */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="h-4 w-40 skeleton-shimmer rounded" />
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-24 skeleton-shimmer rounded" />
              <div className="h-3 w-16 skeleton-shimmer rounded" />
            </div>
            <div className="h-2 skeleton-shimmer rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-20 skeleton-shimmer rounded" />
              <div className="h-3 w-16 skeleton-shimmer rounded" />
            </div>
            <div className="h-2 skeleton-shimmer rounded-full" />
          </div>
        </div>
      </div>

      {/* Funds card skeleton */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex justify-between">
          <div className="h-4 w-20 skeleton-shimmer rounded" />
          <div className="h-4 w-16 skeleton-shimmer rounded" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-32 skeleton-shimmer rounded" />
                <div className="h-4 w-24 skeleton-shimmer rounded" />
              </div>
              <div className="h-2 skeleton-shimmer rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
