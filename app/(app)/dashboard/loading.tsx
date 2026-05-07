export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      <div className="h-7 w-40 bg-card rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="h-20 bg-card rounded-lg border border-border" />)}
      </div>
      <div className="h-32 bg-card rounded-lg border border-border" />
      <div className="h-40 bg-card rounded-lg border border-border" />
    </div>
  )
}
