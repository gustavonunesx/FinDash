export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="font-mono text-primary">Fin</span>Dash
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dashboard Financeiro Pessoal
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
