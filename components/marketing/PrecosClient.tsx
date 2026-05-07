"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { IconCheck, IconSparkles } from "@tabler/icons-react"

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
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">Planos simples e transparentes</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Comece de graça e faça upgrade quando precisar de mais poder.
        </p>

        {/* Toggle mensal/anual */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className={`text-sm ${!anual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Mensal
          </span>
          <button
            onClick={() => setAnual((v) => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors ${anual ? "bg-primary" : "bg-border"}`}
          >
            <span
              className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${anual ? "translate-x-7" : "translate-x-1"}`}
            />
          </button>
          <span className={`text-sm flex items-center gap-1.5 ${anual ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Anual
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
              2 meses grátis
            </span>
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Free */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Gratuito</p>
            <p className="mt-1 font-mono text-3xl font-bold text-foreground">R$0</p>
            <p className="text-xs text-muted-foreground mt-0.5">para sempre</p>
          </div>

          <ul className="space-y-2.5 flex-1">
            {recursosFree.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
                <IconCheck size={15} className="text-fd-green mt-0.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>

          {planoAtual === "free" && isLoggedIn ? (
            <div className="w-full text-center py-2 text-sm text-muted-foreground border border-border rounded-lg">
              Plano atual
            </div>
          ) : (
            <Link
              href={isLoggedIn ? "/dashboard" : "/cadastro"}
              className="w-full text-center py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-card/80 transition-colors"
            >
              {isLoggedIn ? "Continuar grátis" : "Criar conta grátis"}
            </Link>
          )}
        </div>

        {/* Premium */}
        <div className="rounded-xl border-2 border-primary bg-card p-6 flex flex-col gap-5 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="text-xs px-3 py-1 rounded-full bg-primary text-white font-semibold flex items-center gap-1">
              <IconSparkles size={12} /> Mais popular
            </span>
          </div>

          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wide">Premium</p>
            {anual ? (
              <>
                <p className="mt-1 font-mono text-3xl font-bold text-foreground">R$149</p>
                <p className="text-xs text-muted-foreground mt-0.5">por ano · ~R$12,40/mês</p>
              </>
            ) : (
              <>
                <p className="mt-1 font-mono text-3xl font-bold text-foreground">R$19</p>
                <p className="text-xs text-muted-foreground mt-0.5">por mês</p>
              </>
            )}
            <p className="text-xs text-primary mt-1">14 dias grátis para testar</p>
          </div>

          <ul className="space-y-2.5 flex-1">
            {recursosPremium.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-foreground">
                <IconCheck size={15} className="text-primary mt-0.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>

          {planoAtual === "premium" && isLoggedIn ? (
            <div className="w-full text-center py-2 text-sm text-primary border border-primary/30 rounded-lg bg-primary/10">
              Plano atual ✓
            </div>
          ) : (
            <button
              onClick={() => handleCheckout(anual ? priceAnnual : priceMonthly)}
              disabled={isPending}
              className="w-full py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isPending ? "Redirecionando…" : "Começar grátis 14 dias"}
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Cancele a qualquer momento. Sem cobrança durante o período de teste.
      </p>
    </div>
  )
}
