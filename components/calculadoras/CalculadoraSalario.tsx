"use client"

import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { calcularSalario } from "@/lib/finance"
import { salvarSalario } from "@/app/(app)/calculadora/actions"
import { IconAlertTriangle, IconShoppingBag, IconTarget, IconSparkles } from "@tabler/icons-react"
import type { TotaisPorCategoria } from "@/types"

const STATUS_COLOR = {
  verde: "var(--fd-green)",
  amarelo: "var(--fd-amber)",
  vermelho: "var(--fd-red)",
}

const CATEGORY_ICONS = {
  "Necessidades": IconShoppingBag,
  "Objetivos": IconTarget,
  "Qualidade de vida": IconSparkles,
}

interface Props {
  salarioInicial: number
  totais: TotaisPorCategoria
}

export function CalculadoraSalario({ salarioInicial, totais }: Props) {
  const [salario, setSalario] = useState(String(salarioInicial || ""))
  const [, startTransition] = useTransition()

  const salarioNum = parseFloat(salario.replace(",", ".")) || 0
  const resultado = useMemo(() => calcularSalario(salarioNum, totais), [salarioNum, totais])

  function handleBlur() {
    if (salarioNum === salarioInicial) return
    startTransition(async () => {
      const res = await salvarSalario(salarioNum)
      if (res.error) toast.error("Erro ao salvar salário")
    })
  }

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const alertas = [
    resultado.statusNecessidades.cor !== "verde" ? resultado.statusNecessidades.mensagem : null,
    resultado.statusObjetivos.cor !== "verde" ? resultado.statusObjetivos.mensagem : null,
  ].filter(Boolean)

  const blocos = [
    {
      label: "Necessidades",
      percentual: 50,
      limite: resultado.limiteNecessidades,
      comprometido: resultado.comprometidoNecessidades,
      status: resultado.statusNecessidades,
      color: "var(--fd-amber)",
    },
    {
      label: "Objetivos",
      percentual: 30,
      limite: resultado.limiteObjetivos,
      comprometido: resultado.comprometidoObjetivos,
      status: resultado.statusObjetivos,
      color: "var(--fd-green)",
    },
    {
      label: "Qualidade de vida",
      percentual: 20,
      limite: resultado.limiteQualidade,
      comprometido: resultado.comprometidoQualidade,
      status: null,
      color: "var(--fd-blue)",
    },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-6 transition-all hover:border-foreground/10">
      <div>
        <h2 className="font-semibold text-foreground text-lg">Calculadora de Salário</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Distribuição 50/30/20: necessidades · objetivos · qualidade de vida
        </p>
      </div>

      {/* Salary input */}
      <div className="max-w-xs space-y-2">
        <Label htmlFor="salario" className="text-sm font-medium">Salário mensal (R$)</Label>
        <Input
          id="salario"
          type="number"
          inputMode="decimal"
          placeholder="0,00"
          min="0"
          step="0.01"
          value={salario}
          onChange={(e) => setSalario(e.target.value)}
          onBlur={handleBlur}
          className="font-mono text-base"
        />
      </div>

      {salarioNum > 0 ? (
        <>
          {/* 3 category blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {blocos.map(({ label, percentual, limite, comprometido, status, color }) => {
              const fill = limite > 0 ? Math.min((comprometido / limite) * 100, 100) : 0
              const cor = status?.cor ?? "verde"
              const barColor = STATUS_COLOR[cor]
              const Icon = CATEGORY_ICONS[label as keyof typeof CATEGORY_ICONS]

              return (
                <div 
                  key={label} 
                  className="group rounded-xl border border-border p-4 space-y-4 transition-all duration-200 hover:border-foreground/15 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
                  style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="size-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <Icon size={16} style={{ color }} strokeWidth={1.5} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{percentual}%</span>
                  </div>

                  <div>
                    <p className="font-mono text-xl font-bold text-foreground">{fmt(comprometido)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      limite: {fmt(limite)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full progress-animate"
                        style={{ 
                          width: `${fill}%`, 
                          backgroundColor: barColor,
                          boxShadow: `0 0 8px ${barColor}30`
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">{Math.round(fill)}% usado</span>
                      {status && (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="size-2 rounded-full"
                            style={{ backgroundColor: STATUS_COLOR[status.cor] }}
                          />
                          <span className="capitalize" style={{ color: STATUS_COLOR[status.cor] }}>{status.cor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Alerts */}
          {alertas.length > 0 && (
            <div className="space-y-2">
              {alertas.map((msg) => (
                <div
                  key={msg}
                  className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm border border-fd-amber/20"
                  style={{
                    backgroundColor: "rgba(186,117,23,0.08)",
                  }}
                >
                  <IconAlertTriangle size={18} className="text-fd-amber shrink-0 mt-0.5" />
                  <span className="text-fd-amber">{msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Saldo livre */}
          <div
            className="rounded-xl px-5 py-4 flex items-center justify-between transition-all"
            style={{
              backgroundColor: resultado.saldoLivre >= 0 ? "rgba(29,158,117,0.08)" : "rgba(226,75,74,0.08)",
              borderLeft: `3px solid ${resultado.saldoLivre >= 0 ? STATUS_COLOR.verde : STATUS_COLOR.vermelho}`,
            }}
          >
            <span className="text-sm text-foreground font-medium">Saldo livre</span>
            <span
              className="font-mono text-xl font-bold"
              style={{ color: resultado.saldoLivre >= 0 ? STATUS_COLOR.verde : STATUS_COLOR.vermelho }}
            >
              {fmt(resultado.saldoLivre)}
            </span>
          </div>
        </>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Informe seu salário para ver a distribuição 50/30/20.
          </p>
        </div>
      )}
    </div>
  )
}
