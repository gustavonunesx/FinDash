"use client"

import { IconWallet, IconPigMoney, IconChartBar } from "@tabler/icons-react"

const features = [
  {
    icon: <IconWallet size={26} strokeWidth={1.5} className="text-primary" />,
    title: "Regra 50/30/20",
    desc: "Distribua seus gastos de forma inteligente entre necessidades, investimentos e qualidade de vida.",
    accent: "#1D9E75",
  },
  {
    icon: <IconPigMoney size={26} strokeWidth={1.5} className="text-primary" />,
    title: "Fundos financeiros",
    desc: "Crie metas para reserva de emergência, viagens e conquistas. Acompanhe o progresso em tempo real.",
    accent: "#378ADD",
  },
  {
    icon: <IconChartBar size={26} strokeWidth={1.5} className="text-primary" />,
    title: "Histórico mensal",
    desc: "Visualize sua evolução financeira com gráficos claros mês a mês. Exclusivo Premium.",
    accent: "#BA7517",
  },
]

const stats = [
  { value: "R$ 2.4M", label: "gerenciados" },
  { value: "1.200+",  label: "usuários ativos" },
  { value: "4.9★",    label: "avaliação média" },
]

export default function LandingFeatures() {
  return (
    <div>
      {/* Stats bar */}
      <div className="border-y border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            {stats.map((s, i) => (
              <div key={s.label} className="stat-item flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                {i > 0 && <span className="hidden sm:block text-border/60 text-lg">•</span>}
                <div className="text-center sm:text-left">
                  <span className="font-extrabold font-mono text-foreground text-lg">{s.value}</span>
                  <span className="text-muted-foreground text-sm ml-1.5">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features section */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14 features-title animate-fade-up">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
            Tudo que você precisa para{" "}
            <span className="text-gradient">crescer financeiramente</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Ferramentas simples, resultados reais. Sem planilhas complicadas.
          </p>
        </div>

        <div className="features-grid grid grid-cols-1 sm:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="feature-card group relative rounded-2xl border border-border/60 glass-subtle p-7 space-y-5 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/20 overflow-hidden cursor-default animate-fade-up"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {/* Accent glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${f.accent}08, transparent)` }}
              />

              <div
                className="relative size-13 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${f.accent}18`, boxShadow: `0 0 0 1px ${f.accent}20` }}
              >
                {f.icon}
              </div>

              <div className="relative space-y-2">
                <h3 className="font-bold text-foreground text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
                style={{ backgroundColor: f.accent }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
