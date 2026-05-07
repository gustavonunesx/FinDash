import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  IconChartBar,
  IconPigMoney,
  IconSparkles,
  IconWallet,
  IconCheck,
  IconArrowRight,
} from "@tabler/icons-react"

const features = [
  {
    icon: <IconWallet size={22} className="text-primary" />,
    title: "Regra 50/30/20",
    desc: "Distribua seus gastos de forma inteligente entre necessidades, objetivos e qualidade de vida.",
  },
  {
    icon: <IconPigMoney size={22} className="text-primary" />,
    title: "Fundos financeiros",
    desc: "Crie metas para reserva de emergência, viagens, e conquistas. Acompanhe o progresso em tempo real.",
  },
  {
    icon: <IconChartBar size={22} className="text-primary" />,
    title: "Histórico mensal",
    desc: "Visualize sua evolução financeira com gráficos claros mês a mês. Exclusivo para usuários Premium.",
  },
]

const freeFeatures = ["Até 10 gastos", "Até 3 fundos", "Calculadoras 50/30/20", "Renda extra e projeções"]
const premiumFeatures = ["Gastos ilimitados", "Fundos ilimitados", "Histórico mensal com gráficos", "Exportação de relatório PDF"]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold">
            <span className="font-mono text-primary">Fin</span>Dash
          </span>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Ir para o app <IconArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Criar conta grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-6">
            <IconSparkles size={12} />
            Dashboard financeiro pessoal
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Tome o controle das{" "}
            <span className="text-primary">suas finanças</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Use a regra 50/30/20 para organizar gastos, criar fundos com metas e acompanhar sua evolução financeira mês a mês.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white rounded-lg px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
            >
              Começar grátis
              <IconArrowRight size={16} />
            </Link>
            <Link
              href="/precos"
              className="inline-flex items-center justify-center gap-2 border border-border text-foreground rounded-lg px-6 py-3 font-medium hover:bg-card transition-colors"
            >
              Ver planos
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Sem cartão de crédito • 14 dias de Premium grátis</p>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing preview */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-center text-foreground mb-2">Planos simples e transparentes</h2>
          <p className="text-center text-muted-foreground text-sm mb-10">Comece grátis. Faça upgrade quando precisar de mais.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Free */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gratuito</p>
                <p className="text-3xl font-bold text-foreground">R$0</p>
                <p className="text-xs text-muted-foreground">para sempre</p>
              </div>
              <ul className="space-y-2">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IconCheck size={14} className="text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="block text-center text-sm border border-border rounded-lg px-4 py-2 hover:bg-muted/30 transition-colors"
              >
                Criar conta grátis
              </Link>
            </div>

            {/* Premium */}
            <div className="rounded-xl border-2 border-primary bg-card p-6 space-y-4 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">Recomendado</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Premium</p>
                <p className="text-3xl font-bold text-foreground">R$19<span className="text-base font-normal text-muted-foreground">/mês</span></p>
                <p className="text-xs text-muted-foreground">ou R$149/ano (2 meses grátis)</p>
              </div>
              <ul className="space-y-2">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <IconCheck size={14} className="text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/precos"
                className="block text-center text-sm bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors"
              >
                Testar 14 dias grátis
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FinDash — Todos os direitos reservados
      </footer>
    </div>
  )
}
