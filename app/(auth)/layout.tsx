export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/95">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(29,158,117,0.1),transparent)]" />
      
      <div className="w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="font-mono text-primary">Fin</span>
            <span className="text-foreground">Dash</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Dashboard Financeiro Pessoal
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
