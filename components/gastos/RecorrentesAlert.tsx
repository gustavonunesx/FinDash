"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { confirmarRecorrente } from "@/app/(app)/gastos/actions"
import { IconRepeat, IconCheck, IconPlus, IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import type { Gasto } from "@/types"

interface RecorrentePendente {
  id: string
  nome: string
  valor: number
  categoria: string
  dia_recorrencia: number | null
  confirmadoEsteMes: boolean
}

interface Props {
  recorrentes: RecorrentePendente[]
}

function ConfirmarButton({ id, onLimitReached }: { id: string; onLimitReached: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleConfirmar() {
    startTransition(async () => {
      const res = await confirmarRecorrente(id)
      if (res.error === "LIMIT_REACHED") {
        onLimitReached()
        return
      }
      if (res.error) {
        toast.error("Erro ao confirmar gasto")
        return
      }
      setDone(true)
      toast.success("Gasto confirmado para este mês")
    })
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg"
        style={{ color: "var(--fd-green)", backgroundColor: "var(--fd-green)15" }}
      >
        <IconCheck size={12} />
        Confirmado
      </span>
    )
  }

  return (
    <button
      onClick={handleConfirmar}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all disabled:opacity-50 hover:-translate-y-0.5"
      style={{ color: "var(--fd-green)", borderColor: "var(--fd-green)40", backgroundColor: "var(--fd-green)10" }}
    >
      <IconPlus size={11} />
      {isPending ? "..." : "Confirmar"}
    </button>
  )
}

const categoriaMeta: Record<string, { label: string; color: string }> = {
  necessidade: { label: "Necessidade", color: "var(--fd-amber)" },
  objetivo: { label: "Objetivo", color: "var(--fd-green)" },
  qualidade: { label: "Qualidade", color: "var(--fd-blue)" },
}

export function RecorrentesAlert({ recorrentes }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const pendentes = recorrentes.filter((r) => !r.confirmadoEsteMes)
  const confirmados = recorrentes.filter((r) => r.confirmadoEsteMes)

  if (recorrentes.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-fd-blue/10 flex items-center justify-center">
            <IconRepeat size={14} className="text-fd-blue" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Gastos recorrentes</p>
            <p className="text-[10px] text-muted-foreground">
              {pendentes.length > 0
                ? `${pendentes.length} pendente${pendentes.length > 1 ? "s" : ""} este mês`
                : "Todos confirmados este mês"}
            </p>
          </div>
          {pendentes.length > 0 && (
            <span className="size-5 rounded-full bg-fd-blue text-white text-[10px] font-bold flex items-center justify-center">
              {pendentes.length}
            </span>
          )}
        </div>
        {collapsed ? <IconChevronDown size={15} className="text-muted-foreground" /> : <IconChevronUp size={15} className="text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className="border-t border-border divide-y divide-border/50">
          {recorrentes.map((r) => {
            const meta = categoriaMeta[r.categoria] ?? { label: r.categoria, color: "var(--muted-foreground)" }
            return (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{r.nome}</span>
                    {r.dia_recorrencia && (
                      <span className="text-[10px] text-muted-foreground">dia {r.dia_recorrencia}</span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {r.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    {" · "}
                    <span style={{ color: meta.color }}>{meta.label}</span>
                  </p>
                </div>

                {r.confirmadoEsteMes ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg shrink-0"
                    style={{ color: "var(--fd-green)", backgroundColor: "var(--fd-green)15" }}
                  >
                    <IconCheck size={12} />
                    Confirmado
                  </span>
                ) : (
                  <ConfirmarButton id={r.id} onLimitReached={() => {}} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
