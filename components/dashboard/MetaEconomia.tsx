"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { IconTarget, IconTrendingUp, IconTrendingDown, IconSettings } from "@tabler/icons-react"

interface Props {
  meta: number
  saldoLivre: number
  index?: number
}

export function MetaEconomia({ meta, saldoLivre, index = 0 }: Props) {
  const barRef = useRef<HTMLDivElement>(null)

  const economizado = Math.max(saldoLivre, 0)
  const pct = meta > 0 ? Math.min((economizado / meta) * 100, 100) : 0
  const atingiu = economizado >= meta && meta > 0
  const falta = meta > 0 ? Math.max(meta - economizado, 0) : 0

  const barColor = atingiu
    ? "var(--fd-green)"
    : pct >= 70
      ? "var(--fd-blue)"
      : pct >= 40
        ? "var(--fd-amber)"
        : "var(--fd-red)"

  useEffect(() => {
    if (!barRef.current) return
    const el = barRef.current
    el.style.width = "0%"
    const timeout = setTimeout(() => {
      el.style.transition = "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
      el.style.width = `${pct}%`
    }, 200 + index * 60)
    return () => clearTimeout(timeout)
  }, [pct, index])

  if (meta <= 0) return null

  return (
    <div
      className="rounded-xl border border-border/60 bg-card/50 px-5 py-4 space-y-3.5 animate-fade-up transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80"
      style={{ animationDelay: `${140 + index * 40}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="size-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${barColor}18` }}
          >
            <IconTarget size={16} style={{ color: barColor }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Meta de economia</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {meta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} por mês
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="font-mono text-base font-bold" style={{ color: barColor }}>
            {Math.round(pct)}%
          </p>
          <p className="text-[10px] text-muted-foreground">atingido</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            ref={barRef}
            className="h-full rounded-full"
            style={{ backgroundColor: barColor, width: "0%" }}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-muted-foreground">
            <span style={{ color: barColor }} className="font-semibold">
              {economizado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
            <span className="text-muted-foreground/50">
              {" "}/ {meta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </p>

          {atingiu ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "var(--fd-green)" }}>
              <IconTrendingUp size={11} />
              Meta atingida!
            </span>
          ) : falta > 0 ? (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <IconTrendingDown size={11} />
              Faltam {falta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          ) : null}
        </div>
      </div>

      {/* Hint: sem renda configurada */}
      {saldoLivre <= 0 && (
        <p className="text-[10px] text-muted-foreground">
          Configure sua renda na{" "}
          <Link href="/calculadora" className="text-primary hover:underline">
            Calculadora
          </Link>{" "}
          para acompanhar o progresso.
        </p>
      )}
    </div>
  )
}
