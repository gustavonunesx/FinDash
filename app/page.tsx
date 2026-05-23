import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  IconArrowRight,
  IconCheck,
  IconSparkles,
} from "@tabler/icons-react"
import LandingHero from "@/components/marketing/LandingHero"
import LandingFeatures from "@/components/marketing/LandingFeatures"

const freeFeatures    = ["Até 10 gastos por mês", "Até 3 fundos financeiros", "Calculadoras 50/30/20", "Renda extra e projeções"]
const premiumFeatures = ["Gastos ilimitados", "Fundos ilimitados", "Histórico mensal com gráficos", "Exportação de relatório PDF"]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Ambient background */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(29,158,117,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(55,138,221,0.05),transparent)]" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            <span className="font-mono text-primary">Fin</span>
            <span className="text-foreground">Dash</span>
          </span>
          <nav className="flex items-center gap-5">
            <Link href="/precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Preços
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="group flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
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
                  className="text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
                >
                  Criar conta grátis
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — client component com GSAP + partículas */}
        <LandingHero isLoggedIn={!!user} />

        {/* Stats bar + Features cards — client component com ScrollTrigger */}
        <LandingFeatures />

        {/* Pricing */}
        <section className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
              <IconSparkles size={12} />
              Planos simples
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Comece grátis.{" "}
              <span className="text-gradient">Evolua quando quiser.</span>
            </h2>
            <p className="text-muted-foreground">Sem surpresas, sem letras miúdas.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="group rounded-2xl border border-border/60 glass-subtle p-7 space-y-6 transition-all duration-300 hover:border-foreground/15 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-semibold">Gratuito</p>
                <p className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">R$0</p>
                <p className="text-xs text-muted-foreground mt-1.5">para sempre</p>
              </div>
              <ul className="space-y-3">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <IconCheck size={11} className="text-primary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="block text-center text-sm border border-border/70 rounded-xl px-4 py-3 hover:bg-card hover:border-foreground/20 transition-all font-semibold"
              >
                Criar conta grátis
              </Link>
            </div>

            {/* Premium — badge fora do card para não ser cortado */}
            <div className="relative mt-4 sm:mt-0">
              {/* Badge acima do card */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                <span className="relative overflow-hidden bg-primary text-white text-xs font-semibold px-5 py-1.5 rounded-full shadow-lg shadow-primary/40 inline-block whitespace-nowrap">
                  Recomendado
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer-slide_2s_ease-in-out_infinite]" />
                </span>
              </div>

              <div className="group relative rounded-2xl border-2 border-primary/70 bg-card pt-9 px-7 pb-7 space-y-6 animate-glow-pulse-green transition-all duration-300 hover:-translate-y-1">
                {/* Shimmer gradient interno */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/6 via-transparent to-transparent pointer-events-none" />

                <div className="relative">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-semibold">Premium</p>
                  <p className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                    R$19<span className="text-base font-normal text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">ou R$149/ano — 2 meses grátis</p>
                </div>

                <ul className="relative space-y-3">
                  {premiumFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                      <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <IconCheck size={11} className="text-primary" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/precos"
                  className="relative block text-center text-sm bg-primary text-white rounded-xl px-4 py-3 hover:bg-primary/90 transition-all font-semibold hover:shadow-xl hover:shadow-primary/30"
                >
                  Testar 14 dias grátis
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA — full width */}
        <section className="relative overflow-hidden py-28 text-center">
          {/* Gradientes de fundo cobrindo a section toda */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(29,158,117,0.10),transparent)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_20%_100%,rgba(55,138,221,0.06),transparent)] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="relative space-y-6 max-w-lg mx-auto px-4">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
              <IconSparkles size={12} />
              Grátis para começar
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
              Pronto para organizar<br />
              <span className="text-gradient">suas finanças?</span>
            </h2>

            <p className="text-muted-foreground text-lg">
              Crie sua conta em menos de 1 minuto. Sem cartão de crédito.
            </p>

            <Link
              href="/cadastro"
              className="group inline-flex items-center gap-2 bg-primary text-white rounded-xl px-10 py-4 font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Criar conta grátis — é rápido
              <IconArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden bg-background">
        {/* Números decorativos em mono — fundo atmosférico */}
        <div className="pointer-events-none select-none absolute inset-0 flex items-end overflow-hidden" aria-hidden>
          <span className="absolute bottom-[-0.15em] left-[-0.05em] font-mono font-black text-[20vw] leading-none text-foreground/[0.025] tracking-tighter whitespace-nowrap">
            50/30/20
          </span>
        </div>

        {/* Linha superior animada */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-10">

          {/* Grid principal: logo+tagline | colunas de links */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-10 sm:gap-16 mb-14">

            {/* Bloco logo */}
            <div className="space-y-4">
              <div>
                <span className="text-2xl font-black tracking-tight">
                  <span className="font-mono text-primary">Fin</span>
                  <span className="text-foreground">Dash</span>
                </span>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[220px]">
                  Organize seu dinheiro com inteligência. Regra 50/30/20 aplicada à vida real.
                </p>
              </div>
              {/* Métrica decorativa */}
              <div className="inline-flex items-center gap-2 border border-border/50 rounded-lg px-3 py-2 bg-card/40">
                <span className="size-1.5 rounded-full bg-primary animate-pulse-soft" />
                <span className="font-mono text-xs text-muted-foreground">
                  <span className="text-foreground font-semibold">1.200+</span> usuários organizando finanças
                </span>
              </div>
            </div>

            {/* Coluna Produto */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Produto</p>
              <ul className="space-y-3">
                {[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Preços",    href: "/precos" },
                  { label: "Calculadoras", href: "/dashboard" },
                  { label: "Histórico", href: "/dashboard" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:translate-x-0.5 inline-block transition-transform">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna Conta */}
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Conta</p>
              <ul className="space-y-3">
                {[
                  { label: "Entrar",       href: "/login" },
                  { label: "Criar conta",  href: "/cadastro" },
                  { label: "Configurações",href: "/configuracoes" },
                  { label: "Plano Premium",href: "/precos" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:translate-x-0.5 inline-block transition-transform">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divisor */}
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-6" />

          {/* Barra inferior */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/50">
            <p>© {new Date().getFullYear()} FinDash. Todos os direitos reservados.</p>
            <p className="font-mono tracking-tight">
              built for <span className="text-primary/70">financial clarity</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
