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
import { AnimatedBackground } from "@/components/landing/AnimatedBackground"
import { AnimatedHero, AnimatedFeatures, AnimatedPricing } from "@/components/landing/AnimatedSections"

const features = [
  {
    icon: <IconWallet size={24} strokeWidth={1.5} className="text-primary" />,
    title: "Regra 50/30/20",
    desc: "Distribua seus gastos de forma inteligente entre necessidades, objetivos e qualidade de vida.",
  },
  {
    icon: <IconPigMoney size={24} strokeWidth={1.5} className="text-primary" />,
    title: "Fundos financeiros",
    desc: "Crie metas para reserva de emergência, viagens, e conquistas. Acompanhe o progresso em tempo real.",
  },
  {
    icon: <IconChartBar size={24} strokeWidth={1.5} className="text-primary" />,
    title: "Histórico mensal",
    desc: "Visualize sua evolução financeira com gráficos claros mês a mês. Exclusivo para usuários Premium.",
  },
]

const freeFeatures = ["Até 10 gastos", "Até 3 fundos", "Calculadoras 50/30/20", "Renda extra e projeções"]
const premiumFeatures = ["Gastos ilimitados", "Fundos ilimitados", "Histórico mensal com gráficos", "Exportação de relatório PDF"]

export default async function LandingPage() {
  let user = null
  
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase not configured or error - continue without user
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 glass">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold">
            <span className="font-mono text-primary">Fin</span>
            <span className="text-foreground">Dash</span>
          </span>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="group flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
              >
                Ir para o app 
                <IconArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
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
        <AnimatedHero>
          <section className="max-w-5xl mx-auto px-4 py-24 text-center">
            <div 
              data-animate="badge"
              className="inline-flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8"
            >
              <IconSparkles size={12} />
              Dashboard financeiro pessoal
            </div>
            <h1 
              data-animate="title"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 tracking-tight"
            >
              Tome o controle das{" "}
              <span className="text-primary relative">
                suas finanças
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 10C50 2 150 2 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30" />
                </svg>
              </span>
            </h1>
            <p 
              data-animate="subtitle"
              className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Use a regra 50/30/20 para organizar gastos, criar fundos com metas e acompanhar sua evolução financeira mês a mês.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cadastro"
                data-animate="cta"
                className="group inline-flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-8 py-3.5 font-medium hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
              >
                Começar grátis
                <IconArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/precos"
                data-animate="cta"
                className="inline-flex items-center justify-center gap-2 border border-border text-foreground rounded-xl px-8 py-3.5 font-medium hover:bg-card hover:border-foreground/20 transition-all"
              >
                Ver planos
              </Link>
            </div>
            <p data-animate="footer-text" className="mt-6 text-xs text-muted-foreground">Sem cartão de crédito • 14 dias de Premium grátis</p>
          </section>
        </AnimatedHero>

        {/* Features */}
        <AnimatedFeatures>
          <section className="max-w-5xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {features.map((f) => (
                <div 
                  key={f.title} 
                  data-animate="feature-card"
                  className="group rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 space-y-4 transition-all duration-300 hover:border-primary/30 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/20">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </AnimatedFeatures>

        {/* Pricing preview */}
        <AnimatedPricing>
          <section className="max-w-5xl mx-auto px-4 py-16">
            <div data-animate="pricing-title" className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Planos simples e transparentes</h2>
              <p className="text-muted-foreground">Comece grátis. Faça upgrade quando precisar de mais.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Free */}
              <div 
                data-animate="pricing-card"
                className="group rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-7 space-y-5 transition-all duration-300 hover:border-foreground/15 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5"
              >
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Gratuito</p>
                  <p className="text-4xl font-bold text-foreground">R$0</p>
                  <p className="text-xs text-muted-foreground mt-1">para sempre</p>
                </div>
                <ul className="space-y-3">
                  {freeFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconCheck size={12} className="text-primary" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/cadastro"
                  className="block text-center text-sm border border-border rounded-xl px-4 py-3 hover:bg-muted/30 hover:border-foreground/20 transition-all font-medium"
                >
                  Criar conta grátis
                </Link>
              </div>

              {/* Premium */}
              <div 
                data-animate="pricing-card"
                className="group rounded-2xl border-2 border-primary bg-card/80 backdrop-blur-sm p-7 space-y-5 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/15"
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-lg shadow-primary/30">Recomendado</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Premium</p>
                  <p className="text-4xl font-bold text-foreground">R$19<span className="text-base font-normal text-muted-foreground">/mês</span></p>
                  <p className="text-xs text-muted-foreground mt-1">ou R$149/ano (2 meses grátis)</p>
                </div>
                <ul className="space-y-3">
                  {premiumFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                      <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <IconCheck size={12} className="text-primary" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/precos"
                  className="block text-center text-sm bg-primary text-white rounded-xl px-4 py-3 hover:bg-primary/90 transition-all font-medium hover:shadow-lg hover:shadow-primary/25"
                >
                  Testar 14 dias grátis
                </Link>
              </div>
            </div>
          </section>
        </AnimatedPricing>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FinDash — Todos os direitos reservados
      </footer>
    </div>
  )
}
