"use client"

import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { calcularRendaExtra } from "@/lib/finance"
import { salvarRendaExtra, salvarFase } from "@/app/(app)/calculadora/actions"
import { IconCheck } from "@tabler/icons-react"
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
    <div className="rounded-xl border border-border bg-card p-5 space-y-6 transition-all hover:border-foreground/10">
      <div>
        <h2 className="font-semibold text-foreground text-lg">Calculadora de Renda Extra</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Como distribuir renda adicional conforme sua fase financeira
        </p>
      </div>

      {/* Inputs row */}
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end">
        <div className="space-y-2 max-w-xs w-full sm:w-auto">
          <Label htmlFor="extra" className="text-sm font-medium">Renda extra mensal (R$)</Label>
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
            className="font-mono text-base"
          />
        </div>

        <div className="flex items-center gap-3 pb-1 px-4 py-2.5 rounded-lg bg-muted/30">
          <span className={`text-sm transition-all duration-150 ${fase === "construindo" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Construindo reserva
          </span>
          <Switch
            checked={fase === "investindo"}
            onCheckedChange={handleFaseChange}
          />
          <span className={`text-sm transition-all duration-150 ${fase === "investindo" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Investindo
          </span>
        </div>
      </div>

      {extraNum > 0 ? (
        <>
          {/* Distribution blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {resultado.blocos.map((bloco, i) => (
              <div
                key={bloco.label}
                className="group rounded-xl border border-border p-4 space-y-3 transition-all duration-200 hover:border-foreground/15 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
                style={{ borderLeftColor: BLOCO_COLORS[i], borderLeftWidth: 3 }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium leading-snug">{bloco.label}</p>
                  <span 
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${BLOCO_COLORS[i]}15`, color: BLOCO_COLORS[i] }}
                  >
                    {bloco.percentual}%
                  </span>
                </div>
                <p className="font-mono text-lg font-bold text-foreground">{fmt(bloco.valor)}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{bloco.descricao}</p>
              </div>
            ))}
          </div>

          {/* Projection table */}
          {resultado.projecoes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Projeção com renda extra
              </h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Fundo</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Meta</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Saldo</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Sem extra</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Com extra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.projecoes.map((proj) => {
                      const concluido = proj.mesesComExtra === 0
                      return (
                        <tr
                          key={proj.fundo.id}
                          className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div 
                                className="size-2.5 rounded-full ring-2 ring-offset-2 ring-offset-card" 
                                style={{ backgroundColor: proj.fundo.cor, boxShadow: `0 0 6px ${proj.fundo.cor}40` }} 
                              />
                              <span className="text-foreground font-medium">{proj.fundo.nome}</span>
                              {concluido && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-fd-green/15 text-fd-green border border-fd-green/20 font-medium">
                                  <IconCheck size={10} />
                                  Concluído
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-muted-foreground hidden sm:table-cell">
                            {fmt(proj.fundo.meta)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-muted-foreground hidden sm:table-cell">
                            {fmt(proj.fundo.saldo_atual)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-muted-foreground">
                            {concluido ? "—" : proj.mesesSemExtra != null ? `${proj.mesesSemExtra} meses` : "∞"}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-semibold" style={{ color: concluido ? "var(--fd-green)" : "var(--foreground)" }}>
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
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Informe sua renda extra para ver como distribuí-la.
          </p>
        </div>
      )}
    </div>
  )
}
