"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  IconCheck, IconSparkles, IconShieldCheck, IconArrowRight,
  IconInfinity, IconChartBar, IconFileText, IconWallet, IconPigMoney, IconCalculator,
} from "@tabler/icons-react"

interface Props {
  isLoggedIn: boolean
  planoAtual: "free" | "premium"
  priceMonthly: string
  priceAnnual: string
}

const recursosFree = [
  { icon: <IconWallet size={14} />,     text: "Até 10 gastos mensais" },
  { icon: <IconPigMoney size={14} />,   text: "Até 3 fundos financeiros" },
  { icon: <IconCalculator size={14} />, text: "Calculadoras 50/30/20" },
  { icon: <IconCalculator size={14} />, text: "Calculadora de renda extra" },
  { icon: <IconChartBar size={14} />,   text: "Dashboard de resumo" },
]

const recursosPremium = [
  { icon: <IconInfinity size={14} />,   text: "Gastos e fundos ilimitados" },
  { icon: <IconChartBar size={14} />,   text: "Histórico mensal completo" },
  { icon: <IconChartBar size={14} />,   text: "Gráficos de evolução" },
  { icon: <IconFileText size={14} />,   text: "Exportação em PDF" },
  { icon: <IconCheck size={14} />,      text: "Tudo do plano gratuito" },
]

export function PrecosClient({ isLoggedIn, planoAtual, priceMonthly, priceAnnual }: Props) {
  const [anual, setAnual]            = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleCheckout(priceId: string) {
    if (!isLoggedIn) { window.location.href = "/cadastro"; return }
    startTransition(async () => {
      const res  = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-4xl mx-auto w-full px-4 py-24 space-y-16 flex-1">

        {/* Header */}
        <div className="text-center space-y-4 animate-fade-up">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-2">
            <IconSparkles size={12} />
            Planos simples
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            Comece grátis.{" "}
            <span className="text-primary">Evolua quando quiser.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Sem surpresas, sem letras miúdas.
          </p>
        </div>

        {/* Toggle mensal/anual */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm transition-colors duration-200 ${!anual ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
            Mensal
          </span>

          <button
            onClick={() => setAnual((v) => !v)}
            aria-label="Alternar entre mensal e anual"
            className="relative w-14 h-7 rounded-full transition-colors duration-200 shrink-0"
            style={{ backgroundColor: anual ? "var(--primary)" : "#3A3A50" }}
          >
            <span
              className="absolute top-1 left-0 size-5 rounded-full bg-white shadow-md transition-transform duration-200"
              style={{ transform: anual ? "translateX(32px)" : "translateX(4px)" }}
            />
          </button>

          <span className={`text-sm flex items-center gap-2 transition-colors duration-200 ${anual ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
            Anual
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold border border-primary/20">
              2 meses grátis
            </span>
          </span>
        </div>

        {/* Cards — mesma altura: ambos têm pt-10 (Free tem espaçador invisível equivalente ao badge) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto w-full items-stretch">

          {/* Free */}
          <div
            className="group rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm pt-10 px-8 pb-8 flex flex-col gap-7 transition-all duration-300 hover:border-foreground/15 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 mb-3">Gratuito</p>
              <p className="font-mono text-5xl font-extrabold text-foreground tracking-tight">R$0</p>
              <p className="text-sm text-muted-foreground mt-1.5">para sempre</p>
            </div>

            <ul className="space-y-3 flex-1">
              {recursosFree.map((r) => (
                <li key={r.text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    {r.icon}
                  </div>
                  {r.text}
                </li>
              ))}
            </ul>

            {planoAtual === "free" && isLoggedIn ? (
              <div className="w-full text-center py-3 text-sm text-muted-foreground border border-border/60 rounded-xl bg-card/40 font-medium">
                Plano atual
              </div>
            ) : (
              <Link
                href={isLoggedIn ? "/dashboard" : "/cadastro"}
                className="w-full text-center py-3 text-sm font-semibold rounded-xl border border-border/70 text-foreground hover:bg-card hover:border-foreground/20 transition-all"
              >
                {isLoggedIn ? "Continuar grátis" : "Criar conta grátis"}
              </Link>
            )}
          </div>

          {/* Premium */}
          <div
            className="flex flex-col animate-fade-up"
            style={{ animationDelay: "240ms" }}
          >
            {/* Badge acima do card */}
            <div className="flex justify-center mb-0">
              <span className="relative overflow-hidden bg-primary text-white text-xs font-semibold px-5 py-1.5 rounded-full shadow-lg shadow-primary/40 inline-flex items-center gap-1.5 whitespace-nowrap -mb-3 z-10">
                <IconSparkles size={11} />
                Mais popular
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer-slide_2s_ease-in-out_infinite]" />
              </span>
            </div>

            <div className="group relative rounded-2xl border-2 border-primary/70 bg-card pt-10 px-8 pb-8 flex flex-col gap-7 animate-glow-pulse-green transition-all duration-300 hover:-translate-y-1 overflow-hidden flex-1">
              {/* Inner gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/6 via-transparent to-transparent pointer-events-none rounded-2xl" />

              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80 mb-3">Premium</p>
                <div className="flex items-end gap-1.5">
                  <p className="font-mono text-5xl font-extrabold text-foreground tracking-tight">
                    {anual ? "R$149" : "R$19"}
                  </p>
                  <span className="text-sm text-muted-foreground mb-1.5">
                    {anual ? "/ano" : "/mês"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {anual ? "~R$12,40/mês — 2 meses grátis" : "ou R$149/ano, 2 meses grátis"}
                </p>
                <p className="text-xs text-primary mt-2.5 flex items-center gap-1.5 font-medium">
                  <IconShieldCheck size={13} />
                  14 dias grátis para testar
                </p>
              </div>

              <ul className="relative space-y-3 flex-1">
                {recursosPremium.map((r) => (
                  <li key={r.text} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary">
                      {r.icon}
                    </div>
                    {r.text}
                  </li>
                ))}
              </ul>

              {planoAtual === "premium" && isLoggedIn ? (
                <div className="relative w-full text-center py-3 text-sm text-primary border border-primary/30 rounded-xl bg-primary/10 font-semibold">
                  Plano atual
                </div>
              ) : (
                <button
                  onClick={() => handleCheckout(anual ? priceAnnual : priceMonthly)}
                  disabled={isPending}
                  className="relative group/btn w-full py-3.5 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? "Redirecionando..." : (
                    <>
                      Começar grátis 14 dias
                      <IconArrowRight size={15} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer trust */}
        <p className="text-center text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "320ms" }}>
          Cancele a qualquer momento. Sem cobrança durante o período de teste.
        </p>
      </div>
    </div>
  )
}
