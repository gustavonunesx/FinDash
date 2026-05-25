"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { IconPencil, IconTrash, IconCheck, IconChevronDown, IconChevronUp, IconTrendingUp } from "@tabler/icons-react"
import { removerFundo } from "@/app/(app)/fundos/actions"
import { calcularRendimento } from "@/lib/rendimento"
import { FundoModal } from "./FundoModal"
import type { Fundo } from "@/types"

const INST_COLORS: Record<string, string> = {
  "Nubank": "#820AD1",
  "Inter": "#FF6B00",
  "Itaú": "#EC7000",
  "XP": "#F0800B",
  "BTG": "#0057B7",
  "Sicoob": "#1E6B3E",
  "Outro": "var(--muted-foreground)",
}

function progressColor(pct: number): string {
  if (pct >= 100) return "var(--fd-green)"
  if (pct >= 60) return "var(--fd-blue)"
  if (pct >= 30) return "var(--fd-amber)"
  return "var(--fd-red)"
}

function mesesRestantes(fundo: Fundo): number | null {
  const restante = fundo.meta - fundo.saldo_atual
  if (restante <= 0) return 0
  if (fundo.aporte_mensal <= 0) return null
  return Math.ceil(restante / fundo.aporte_mensal)
}

function tipoLabel(tipo: string): string {
  switch (tipo) {
    case "percentual_cdi": return "CDI"
    case "prefixado": return "Prefixado"
    case "ipca_mais": return "IPCA+"
    case "poupanca": return "Poupança"
    default: return tipo
  }
}

interface Props {
  fundo: Fundo
  cdiDiario: number
  onLimitReached?: () => void
  onFaseTrocada?: () => void
}

export function FundoCard({ fundo, cdiDiario, onLimitReached, onFaseTrocada }: Props) {
  const [editando, setEditando] = useState(false)
  const [rendimentoOpen, setRendimentoOpen] = useState(false)
  const [, startTransition] = useTransition()

  const pct = fundo.meta > 0 ? Math.min((fundo.saldo_atual / fundo.meta) * 100, 100) : 0
  const concluido = fundo.saldo_atual >= fundo.meta
  const meses = mesesRestantes(fundo)

  const rendimento = fundo.custodia
    ? calcularRendimento(fundo.custodia, cdiDiario)
    : null

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  function handleDelete() {
    if (!confirm(`Remover o fundo "${fundo.nome}"?`)) return
    startTransition(async () => {
      const res = await removerFundo(fundo.id)
      if (res.error) toast.error("Erro ao remover fundo")
      else toast.success("Fundo removido")
    })
  }

  return (
    <>
      <div className="group rounded-xl border border-border bg-card p-5 flex flex-col gap-4 transition-all duration-200 hover:border-foreground/15 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="size-2.5 rounded-full ring-2 ring-offset-2 ring-offset-card"
              style={{ backgroundColor: fundo.cor, boxShadow: `0 0 8px ${fundo.cor}40` }}
            />
            <h3 className="font-semibold text-foreground">{fundo.nome}</h3>
            {concluido && (
              <Badge className="text-[10px] px-1.5 py-0.5 bg-fd-green/15 text-fd-green border border-fd-green/20 gap-0.5">
                <IconCheck size={10} />
                Concluído
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditando(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
              title="Editar"
            >
              <IconPencil size={15} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-muted-foreground hover:text-fd-red hover:bg-fd-red/10 transition-all duration-150"
              title="Remover"
            >
              <IconTrash size={15} />
            </button>
          </div>
        </div>

        {/* Saldo */}
        <div>
          <p className="font-mono text-2xl font-bold text-foreground tracking-tight">
            {fmt(fundo.saldo_atual)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">de {fmt(fundo.meta)}</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full progress-animate"
              style={{
                width: `${pct}%`,
                backgroundColor: progressColor(pct),
                boxShadow: `0 0 12px ${progressColor(pct)}40`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">{Math.round(pct)}% da meta</span>
            <span className="text-muted-foreground">
              falta {fmt(Math.max(fundo.meta - fundo.saldo_atual, 0))}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
          <span>
            Aporte:{" "}
            <span className="font-mono font-medium text-foreground">{fmt(fundo.aporte_mensal)}/mês</span>
          </span>
          <span className={concluido ? "text-fd-green font-medium" : ""}>
            {concluido
              ? "Meta atingida"
              : meses != null
              ? `~${meses} meses restantes`
              : "Sem prazo definido"}
          </span>
        </div>

        {/* Rendimento section (only when custódia is set) */}
        {fundo.custodia && rendimento && (
          <div className="border-t border-border/50 pt-3 space-y-2">
            <button
              type="button"
              onClick={() => setRendimentoOpen((v) => !v)}
              className="w-full flex items-center justify-between text-xs group/rend"
            >
              <div className="flex items-center gap-2">
                <IconTrendingUp size={13} style={{ color: INST_COLORS[fundo.custodia.instituicao] ?? "var(--fd-green)" }} />
                <span className="font-medium text-foreground">{fundo.custodia.instituicao}</span>
                <span className="text-muted-foreground">
                  {fundo.custodia.tipo === "percentual_cdi"
                    ? `${fundo.custodia.taxa}% CDI`
                    : fundo.custodia.tipo === "prefixado"
                    ? `${fundo.custodia.taxa}% a.a.`
                    : fundo.custodia.tipo === "ipca_mais"
                    ? `IPCA + ${fundo.custodia.taxa}%`
                    : "Poupança"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-fd-green">
                  + {fmt(rendimento.rendimentoMensal)}/mês
                </span>
                {rendimentoOpen
                  ? <IconChevronUp size={13} className="text-muted-foreground" />
                  : <IconChevronDown size={13} className="text-muted-foreground" />
                }
              </div>
            </button>

            {rendimentoOpen && (
              <div className="rounded-lg bg-muted/20 border border-border/50 p-3 grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-muted-foreground">Rendimento total</span>
                <span className="font-mono text-right font-semibold text-fd-green">
                  + {fmt(rendimento.rendimentoTotal)}
                </span>
                <span className="text-muted-foreground">Ganho %</span>
                <span className="font-mono text-right text-foreground">
                  {rendimento.percentualGanho.toFixed(2)}%
                </span>
                <span className="text-muted-foreground">Dias investido</span>
                <span className="font-mono text-right text-foreground">
                  {rendimento.diasInvestido} dias
                </span>
                <span className="text-muted-foreground">Tipo</span>
                <span className="text-right text-foreground">
                  {tipoLabel(fundo.custodia.tipo)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <FundoModal
        open={editando}
        onClose={() => setEditando(false)}
        fundo={fundo}
        onLimitReached={onLimitReached}
        onFaseTrocada={onFaseTrocada}
      />
    </>
  )
}
