export default function GastosLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 bg-card rounded" />
        <div className="h-9 w-32 bg-card rounded-lg border border-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="h-16 bg-card rounded-lg border border-border" />)}
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <div className="h-4 flex-1 bg-border rounded" />
            <div className="h-4 w-20 bg-border rounded" />
            <div className="h-4 w-24 bg-border rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
