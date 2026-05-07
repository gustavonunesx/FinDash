"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { IconPencil, IconTrash } from "@tabler/icons-react"
import { removerFundo } from "@/app/(app)/fundos/actions"
import { FundoModal } from "./FundoModal"
import type { Fundo } from "@/types"

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

interface Props {
  fundo: Fundo
  onLimitReached?: () => void
  onFaseTrocada?: () => void
}

export function FundoCard({ fundo, onLimitReached, onFaseTrocada }: Props) {
  const [editando, setEditando] = useState(false)
  const [, startTransition] = useTransition()

  const pct = fundo.meta > 0 ? Math.min((fundo.saldo_atual / fundo.meta) * 100, 100) : 0
  const concluido = fundo.saldo_atual >= fundo.meta
  const meses = mesesRestantes(fundo)

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
      <div
        className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4"
        style={{ borderLeftColor: fundo.cor, borderLeftWidth: 3 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{fundo.nome}</h3>
            {concluido && (
              <Badge className="text-[10px] px-1.5 py-0.5 bg-fd-green/20 text-fd-green border border-fd-green/30">
                Concluído
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditando(true)}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors"
              title="Editar"
            >
              <IconPencil size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded text-muted-foreground hover:text-fd-red hover:bg-fd-red/10 transition-colors"
              title="Remover"
            >
              <IconTrash size={14} />
            </button>
          </div>
        </div>

        {/* Saldo */}
        <div>
          <p className="font-mono text-2xl font-bold text-foreground">{fmt(fundo.saldo_atual)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">de {fmt(fundo.meta)}</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: progressColor(pct) }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{Math.round(pct)}% da meta</span>
            <span className="text-muted-foreground">
              falta {fmt(Math.max(fundo.meta - fundo.saldo_atual, 0))}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
          <span>
            Aporte: <span className="font-mono">{fmt(fundo.aporte_mensal)}/mês</span>
          </span>
          <span>
            {concluido
              ? "✓ Meta atingida"
              : meses != null
              ? `~${meses} meses`
              : "Sem prazo"}
          </span>
        </div>
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
