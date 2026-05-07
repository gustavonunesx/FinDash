"use client"

import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { calcularSalario } from "@/lib/finance"
import { salvarSalario } from "@/app/(app)/calculadora/actions"
import type { TotaisPorCategoria } from "@/types"

const STATUS_COLOR = {
  verde: "var(--fd-green)",
  amarelo: "var(--fd-amber)",
  vermelho: "var(--fd-red)",
}

const STATUS_BG = {
  verde: "rgba(29,158,117,0.12)",
  amarelo: "rgba(186,117,23,0.12)",
  vermelho: "rgba(226,75,74,0.12)",
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
    },
    {
      label: "Objetivos",
      percentual: 30,
      limite: resultado.limiteObjetivos,
      comprometido: resultado.comprometidoObjetivos,
      status: resultado.statusObjetivos,
    },
    {
      label: "Qualidade de vida",
      percentual: 20,
      limite: resultado.limiteQualidade,
      comprometido: resultado.comprometidoQualidade,
      status: null,
    },
  ]

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-5">
      <div>
        <h2 className="font-semibold text-foreground">Calculadora de Salário</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Distribuição 50/30/20: necessidades · objetivos · qualidade de vida
        </p>
      </div>

      {/* Salary input */}
      <div className="max-w-xs space-y-1.5">
        <Label htmlFor="salario">Salário mensal (R$)</Label>
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
          className="font-mono"
        />
      </div>

      {salarioNum > 0 ? (
        <>
          {/* 3 category blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {blocos.map(({ label, percentual, limite, comprometido, status }) => {
              const fill = limite > 0 ? Math.min((comprometido / limite) * 100, 100) : 0
              const cor = status?.cor ?? "verde"
              const barColor = STATUS_COLOR[cor]

              return (
                <div key={label} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">{percentual}%</span>
                  </div>

                  <div>
                    <p className="font-mono text-lg font-bold text-foreground">{fmt(comprometido)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      limite: {fmt(limite)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${fill}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <p className="text-xs text-right" style={{ color: barColor }}>
                      {Math.round(fill)}% usado
                    </p>
                  </div>

                  {status && (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLOR[status.cor] }}
                      />
                      <span className="text-xs text-muted-foreground capitalize">{status.cor}</span>
                    </div>
                  )}
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
                  className="flex items-start gap-2 rounded-md px-3 py-2.5 text-sm border-l-2"
                  style={{
                    borderColor: "var(--fd-amber)",
                    backgroundColor: "rgba(186,117,23,0.08)",
                    color: "var(--fd-amber)",
                  }}
                >
                  ⚠ {msg}
                </div>
              ))}
            </div>
          )}

          {/* Saldo livre */}
          <div
            className="rounded-lg px-4 py-3 flex items-center justify-between"
            style={{
              backgroundColor: resultado.saldoLivre >= 0 ? STATUS_BG.verde : STATUS_BG.vermelho,
              borderLeft: `3px solid ${resultado.saldoLivre >= 0 ? STATUS_COLOR.verde : STATUS_COLOR.vermelho}`,
            }}
          >
            <span className="text-sm text-foreground font-medium">Saldo livre</span>
            <span
              className="font-mono text-lg font-bold"
              style={{ color: resultado.saldoLivre >= 0 ? STATUS_COLOR.verde : STATUS_COLOR.vermelho }}
            >
              {fmt(resultado.saldoLivre)}
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Informe seu salário para ver a distribuição 50/30/20.
        </p>
      )}
    </div>
  )
}
