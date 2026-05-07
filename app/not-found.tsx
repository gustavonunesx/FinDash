import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-4">
      <p className="text-7xl font-mono font-bold text-primary/30">404</p>
      <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
      <p className="text-muted-foreground text-sm max-w-xs">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex items-center gap-2 bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Ir para o dashboard
      </Link>
    </div>
  )
}
