export default function FundosLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 bg-card rounded" />
        <div className="h-9 w-36 bg-card rounded-lg border border-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0,1,2].map(i => <div key={i} className="h-40 bg-card rounded-lg border border-border" />)}
      </div>
    </div>
  )
}
