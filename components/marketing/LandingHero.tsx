"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { IconArrowRight, IconSparkles, IconTrendingUp } from "@tabler/icons-react"
import { gsap } from "gsap"

const PARTICLES = [
  { symbol: "R$", top: "12%", left: "8%",  size: "text-2xl", duration: "7s",  delay: "0s"   },
  { symbol: "$",  top: "25%", left: "92%", size: "text-3xl", duration: "9s",  delay: "1.2s" },
  { symbol: "%",  top: "68%", left: "5%",  size: "text-xl",  duration: "6s",  delay: "0.5s" },
  { symbol: "↑",  top: "80%", left: "88%", size: "text-2xl", duration: "8s",  delay: "2s"   },
  { symbol: "R$", top: "45%", left: "96%", size: "text-lg",  duration: "10s", delay: "3s"   },
  { symbol: "$",  top: "8%",  left: "55%", size: "text-xl",  duration: "7.5s",delay: "1.8s" },
  { symbol: "₿",  top: "60%", left: "2%",  size: "text-2xl", duration: "11s", delay: "0.8s" },
  { symbol: "↑",  top: "18%", left: "78%", size: "text-lg",  duration: "6.5s",delay: "2.5s" },
  { symbol: "%",  top: "88%", left: "42%", size: "text-2xl", duration: "9s",  delay: "1.5s" },
  { symbol: "R$", top: "35%", left: "14%", size: "text-lg",  duration: "8.5s",delay: "3.5s" },
  { symbol: "$",  top: "72%", left: "68%", size: "text-xl",  duration: "7s",  delay: "0.3s" },
  { symbol: "₿",  top: "50%", left: "50%", size: "text-lg",  duration: "12s", delay: "4s"   },
]

const BARS = [
  { label: "Necessidades", pct: 82, color: "#1D9E75", delay: 0 },
  { label: "Investimentos", pct: 63, color: "#378ADD", delay: 0.15 },
  { label: "Qualidade",     pct: 41, color: "#BA7517", delay: 0.3  },
]

interface LandingHeroProps {
  isLoggedIn: boolean
}

export default function LandingHero({ isLoggedIn }: LandingHeroProps) {
  const heroRef    = useRef<HTMLDivElement>(null)
  const barsRef    = useRef<HTMLDivElement[]>([])
  const counterRef = useRef<HTMLSpanElement>(null)
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text entrance timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.from(".hero-badge",     { y: 20, opacity: 0, duration: 0.6 })
        .from(".hero-title",     { y: 30, opacity: 0, duration: 0.7 }, "-=0.3")
        .from(".hero-subtitle",  { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
        .from(".hero-ctas",      { y: 16, opacity: 0, duration: 0.5 }, "-=0.3")
        .from(".hero-trust",     { opacity: 0, duration: 0.4 }, "-=0.2")
        .from(".hero-mock",      { x: 40, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.6")

      // Animate bars in mock dashboard
      barsRef.current.forEach((bar, i) => {
        if (!bar) return
        const target = BARS[i].pct
        gsap.from(bar, {
          width: "0%",
          duration: 1.2,
          delay: 0.8 + BARS[i].delay,
          ease: "elastic.out(1, 0.6)",
        })
        gsap.to({ val: 0 }, {
          val: target,
          duration: 1.2,
          delay: 0.8 + BARS[i].delay,
          ease: "power2.out",
          onUpdate() {
            const el = bar.nextElementSibling as HTMLSpanElement | null
            if (el) el.textContent = `${Math.round((this as any)._targets[0].val)}%`
          },
        })
      })

      // Counter R$ 12.450
      const obj = { val: 0 }
      gsap.to(obj, {
        val: 12450,
        duration: 1.8,
        delay: 1.0,
        ease: "power2.out",
        onUpdate() {
          setCounter(Math.round(obj.val))
        },
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden max-w-7xl mx-auto px-4 pt-20 pb-24 lg:pt-28 lg:pb-32"
    >
      {/* Multi-layer background */}
      <div className="pointer-events-none select-none" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_20%_10%,rgba(29,158,117,0.10),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(55,138,221,0.07),transparent)]" />
      </div>

      {/* Floating particles */}
      <div className="pointer-events-none select-none" aria-hidden>
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className={`absolute font-mono font-bold text-primary animate-float-particle ${p.size}`}
            style={{
              top: p.top,
              left: p.left,
              "--p-duration": p.duration,
              "--p-delay": p.delay,
            } as React.CSSProperties}
          >
            {p.symbol}
          </span>
        ))}
      </div>

      {/* Content grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Left — text */}
        <div className="space-y-8">
          <div className="hero-badge inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5">
            <IconSparkles size={12} />
            Dashboard financeiro inteligente
          </div>

          <div className="hero-title space-y-2">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tight text-foreground">
              Tome o<br />
              controle das<br />
              <span className="text-gradient">suas finanças</span>
            </h1>
          </div>

          <p className="hero-subtitle text-lg text-muted-foreground max-w-md leading-relaxed">
            Use a regra 50/30/20 para distribuir gastos, criar fundos com metas e acompanhar sua evolução mês a mês.
          </p>

          <div className="hero-ctas flex flex-col sm:flex-row gap-3">
            <Link
              href="/cadastro"
              className="group inline-flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-8 py-4 font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Começar grátis
              <IconArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/precos"
              className="inline-flex items-center justify-center gap-2 border border-border/70 text-foreground rounded-xl px-8 py-4 font-semibold text-sm hover:bg-card hover:border-foreground/20 transition-all backdrop-blur-sm"
            >
              Ver planos
            </Link>
          </div>

          <p className="hero-trust text-xs text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="text-primary">✓</span> Sem cartão de crédito</span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1"><span className="text-primary">✓</span> 14 dias de Premium grátis</span>
          </p>
        </div>

        {/* Right — mock dashboard */}
        <div className="hero-mock relative">
          {/* Glow behind card */}
          <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl" />

          <div className="relative glass rounded-2xl border border-primary/20 p-6 space-y-5 shadow-2xl shadow-black/40">
            {/* Mock header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-primary" />
                <span className="text-xs font-medium text-muted-foreground font-mono">FinDash — maio 2025</span>
              </div>
              <div className="flex items-center gap-1 text-primary text-xs font-mono font-semibold">
                <IconTrendingUp size={14} />
                +12%
              </div>
            </div>

            {/* Counter */}
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Saldo disponível</p>
              <p className="text-3xl font-extrabold text-foreground font-mono">
                R$ <span ref={counterRef}>{counter.toLocaleString("pt-BR")}</span>
              </p>
            </div>

            {/* Bars */}
            <div className="space-y-3">
              {BARS.map((bar, i) => (
                <div key={bar.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{bar.label}</span>
                    <span className="text-xs font-mono font-semibold text-foreground">0%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border/40 overflow-hidden">
                    <div
                      ref={(el) => { if (el) barsRef.current[i] = el }}
                      className="h-full rounded-full"
                      style={{ width: `${bar.pct}%`, backgroundColor: bar.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Mini metric cards */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: "Gastos", value: "23", unit: "itens" },
                { label: "Fundos", value: "5",  unit: "ativos" },
                { label: "Meta",   value: "78", unit: "%" },
              ].map((m) => (
                <div key={m.label} className="bg-card/60 rounded-xl p-2.5 text-center border border-border/30">
                  <p className="text-lg font-bold font-mono text-foreground">{m.value}<span className="text-xs text-muted-foreground ml-0.5">{m.unit}</span></p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
