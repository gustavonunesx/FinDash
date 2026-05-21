"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { IconCheck, IconSparkles, IconShieldCheck } from "@tabler/icons-react"

interface Props {
  isLoggedIn: boolean
  planoAtual: "free" | "premium"
  priceMonthly: string
  priceAnnual: string
}

const recursosFree = [
  "Até 10 gastos mensais",
  "Até 3 fundos financeiros",
  "Calculadoras 50/30/20",
  "Calculadora de renda extra",
  "Dashboard de resumo",
]

const recursosPremium = [
  "Gastos e fundos ilimitados",
  "Histórico mensal completo",
  "Gráficos de evolução",
  "Exportação em PDF",
  "Tudo do plano gratuito",
]

export function PrecosClient({ isLoggedIn, planoAtual, priceMonthly, priceAnnual }: Props) {
  const [anual, setAnual] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleCheckout(priceId: string) {
    if (!isLoggedIn) {
      window.location.href = "/cadastro"
      return
    }
    startTransition(async () => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 space-y-14">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(29,158,117,0.1),transparent)]" />

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Planos simples e transparentes</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">
          Comece de graça e faça upgrade quando precisar de mais poder.
        </p>

        {/* Toggle mensal/anual */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className={`text-sm transition-all duration-150 ${!anual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Mensal
          </span>
          <button
            onClick={() => setAnual((v) => !v)}
            className={`relative w-14 h-7 rounded-full transition-all duration-200 ${anual ? "bg-primary" : "bg-muted"}`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-white shadow-md transition-all duration-200 ${anual ? "translate-x-8" : "translate-x-1"}`}
            />
          </button>
          <span className={`text-sm flex items-center gap-2 transition-all duration-150 ${anual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Anual
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/20">
              2 meses grátis
            </span>
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {/* Free */}
        <div className="rounded-2xl border border-border bg-card p-8 flex flex-col gap-6 transition-all duration-200 hover:border-foreground/15 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Gratuito</p>
            <p className="font-mono text-4xl font-bold text-foreground">R$0</p>
            <p className="text-sm text-muted-foreground mt-1">para sempre</p>
          </div>

          <ul className="space-y-3 flex-1">
            {recursosFree.map((r) => (
              <li key={r} className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="size-5 rounded-full bg-fd-green/10 flex items-center justify-center mt-0.5 shrink-0">
                  <IconCheck size={12} className="text-fd-green" />
                </div>
                {r}
              </li>
            ))}
          </ul>

          {planoAtual === "free" && isLoggedIn ? (
            <div className="w-full text-center py-3 text-sm text-muted-foreground border border-border rounded-xl bg-muted/30">
              Plano atual
            </div>
          ) : (
            <Link
              href={isLoggedIn ? "/dashboard" : "/cadastro"}
              className="w-full text-center py-3 text-sm font-medium rounded-xl border border-border text-foreground hover:bg-muted/30 hover:border-foreground/20 transition-all"
            >
              {isLoggedIn ? "Continuar grátis" : "Criar conta grátis"}
            </Link>
          )}
        </div>

        {/* Premium */}
        <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col gap-6 relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/15">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="text-xs px-4 py-1.5 rounded-full bg-primary text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-primary/30">
              <IconSparkles size={12} /> Mais popular
            </span>
          </div>

          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">Premium</p>
            {anual ? (
              <>
                <p className="font-mono text-4xl font-bold text-foreground">R$149</p>
                <p className="text-sm text-muted-foreground mt-1">por ano · ~R$12,40/mês</p>
              </>
            ) : (
              <>
                <p className="font-mono text-4xl font-bold text-foreground">R$19</p>
                <p className="text-sm text-muted-foreground mt-1">por mês</p>
              </>
            )}
            <p className="text-xs text-primary mt-2 flex items-center gap-1.5">
              <IconShieldCheck size={14} />
              14 dias grátis para testar
            </p>
          </div>

          <ul className="space-y-3 flex-1">
            {recursosPremium.map((r) => (
              <li key={r} className="flex items-start gap-3 text-sm text-foreground">
                <div className="size-5 rounded-full bg-primary/15 flex items-center justify-center mt-0.5 shrink-0">
                  <IconCheck size={12} className="text-primary" />
                </div>
                {r}
              </li>
            ))}
          </ul>

          {planoAtual === "premium" && isLoggedIn ? (
            <div className="w-full text-center py-3 text-sm text-primary border border-primary/30 rounded-xl bg-primary/10 font-medium">
              Plano atual
            </div>
          ) : (
            <button
              onClick={() => handleCheckout(anual ? priceAnnual : priceMonthly)}
              disabled={isPending}
              className="w-full py-3 text-sm font-medium rounded-xl bg-primary text-white hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60"
            >
              {isPending ? "Redirecionando..." : "Começar grátis 14 dias"}
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Cancele a qualquer momento. Sem cobrança durante o período de teste.
      </p>
    </div>
  )
}
