export default function HistoricoLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-44 skeleton-shimmer rounded-lg" />
        <div className="h-4 w-64 skeleton-shimmer rounded" />
      </div>

      {/* Line chart skeleton */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-5">
        <div className="h-5 w-32 skeleton-shimmer rounded" />
        <div className="h-60 skeleton-shimmer rounded-lg" />
      </div>

      {/* Bar chart skeleton */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-5">
        <div className="h-5 w-40 skeleton-shimmer rounded" />
        <div className="h-52 skeleton-shimmer rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="bg-muted/30 px-4 py-3 flex gap-4">
          <div className="h-3 w-10 skeleton-shimmer rounded" />
          <div className="h-3 w-12 skeleton-shimmer rounded" />
          <div className="h-3 w-12 skeleton-shimmer rounded" />
          <div className="h-3 w-12 skeleton-shimmer rounded ml-auto" />
        </div>
        {/* Rows */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-t border-border/50">
            <div className="h-4 w-16 skeleton-shimmer rounded" />
            <div className="h-4 w-20 skeleton-shimmer rounded" />
            <div className="h-4 w-20 skeleton-shimmer rounded" />
            <div className="h-4 w-20 skeleton-shimmer rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
