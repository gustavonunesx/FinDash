"use client"

import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { calcularRendaExtra } from "@/lib/finance"
import { salvarRendaExtra, salvarFase } from "@/app/(app)/calculadora/actions"
import type { Fase, Fundo } from "@/types"

const BLOCO_COLORS = [
  "var(--fd-red)",
  "var(--fd-green)",
  "var(--fd-blue)",
  "var(--fd-amber)",
]

interface Props {
  rendaExtraInicial: number
  faseInicial: Fase
  fundos: Fundo[]
}

export function CalculadoraRendaExtra({ rendaExtraInicial, faseInicial, fundos }: Props) {
  const [extra, setExtra] = useState(String(rendaExtraInicial || ""))
  const [fase, setFase] = useState<Fase>(faseInicial)
  const [, startTransition] = useTransition()

  const extraNum = parseFloat(extra.replace(",", ".")) || 0
  const resultado = useMemo(() => calcularRendaExtra(extraNum, fase, fundos), [extraNum, fase, fundos])

  function handleExtraBlur() {
    const prev = rendaExtraInicial
    if (extraNum === prev) return
    startTransition(async () => {
      const res = await salvarRendaExtra(extraNum)
      if (res.error) toast.error("Erro ao salvar renda extra")
    })
  }

  function handleFaseChange(checked: boolean) {
    const novaFase: Fase = checked ? "investindo" : "construindo"
    setFase(novaFase)
    startTransition(async () => {
      const res = await salvarFase(novaFase)
      if (res.error) toast.error("Erro ao salvar fase")
    })
  }

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-5">
      <div>
        <h2 className="font-semibold text-foreground">Calculadora de Renda Extra</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Como distribuir renda adicional conforme sua fase financeira
        </p>
      </div>

      {/* Inputs row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="space-y-1.5 max-w-xs w-full sm:w-auto">
          <Label htmlFor="extra">Renda extra mensal (R$)</Label>
          <Input
            id="extra"
            type="number"
            inputMode="decimal"
            placeholder="0,00"
            min="0"
            step="0.01"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            onBlur={handleExtraBlur}
            className="font-mono"
          />
        </div>

        <div className="flex items-center gap-3 pb-0.5">
          <span className={`text-sm transition-colors ${fase === "construindo" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Construindo reserva
          </span>
          <Switch
            checked={fase === "investindo"}
            onCheckedChange={handleFaseChange}
          />
          <span className={`text-sm transition-colors ${fase === "investindo" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Investindo
          </span>
        </div>
      </div>

      {extraNum > 0 ? (
        <>
          {/* Distribution blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {resultado.blocos.map((bloco, i) => (
              <div
                key={bloco.label}
                className="rounded-lg border border-border p-4 space-y-2"
                style={{ borderLeftColor: BLOCO_COLORS[i], borderLeftWidth: 3 }}
              >
                <p className="text-xs text-muted-foreground leading-snug">{bloco.label}</p>
                <p className="font-mono text-base font-bold text-foreground">{fmt(bloco.valor)}</p>
                <p className="text-xs font-medium" style={{ color: BLOCO_COLORS[i] }}>
                  {bloco.percentual}%
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">{bloco.descricao}</p>
              </div>
            ))}
          </div>

          {/* Projection table */}
          {resultado.projecoes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Projeção com renda extra
              </h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/50">
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Fundo</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden sm:table-cell">Meta</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden sm:table-cell">Saldo</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium">Sem extra</th>
                      <th className="text-right px-3 py-2 text-muted-foreground font-medium">Com extra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.projecoes.map((proj, i) => {
                      const concluido = proj.mesesComExtra === 0
                      return (
                        <tr
                          key={proj.fundo.id}
                          className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-card" : "bg-card/60"}`}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: proj.fundo.cor }} />
                              <span className="text-foreground font-medium">{proj.fundo.nome}</span>
                              {concluido && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-fd-green/20 text-fd-green font-medium">
                                  Concluído
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-muted-foreground hidden sm:table-cell">
                            {fmt(proj.fundo.meta)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-muted-foreground hidden sm:table-cell">
                            {fmt(proj.fundo.saldo_atual)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                            {concluido ? "—" : proj.mesesSemExtra != null ? `${proj.mesesSemExtra} meses` : "∞"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold" style={{ color: concluido ? "var(--fd-green)" : "var(--foreground)" }}>
                            {concluido ? "—" : proj.mesesComExtra != null ? `${proj.mesesComExtra} meses` : "∞"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Distribuição de {fmt(resultado.blocos[1].valor)} (30% da renda extra) dividida igualmente entre os fundos.
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Informe sua renda extra para ver como distribuí-la.
        </p>
      )}
    </div>
  )
}
