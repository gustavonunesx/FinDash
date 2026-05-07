import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 h-14 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6">
        <Link href="/" className="text-lg font-bold">
          <span className="font-mono text-primary">Fin</span>Dash
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className="text-sm px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Ir para o app
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="text-sm px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
