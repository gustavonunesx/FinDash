import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-3">
        <span className="font-mono text-primary">Fin</span>Dash
      </h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md">
        Dashboard financeiro pessoal com a regra 50/30/20.
        Controle seus gastos, fundos e metas em um só lugar.
      </p>
      <div className="flex gap-3">
        <Link href="/cadastro">
          <Button>Começar grátis</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" className="border-border">Entrar</Button>
        </Link>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        🚧 Landing page completa vem no Milestone 6
      </p>
    </div>
  )
}
