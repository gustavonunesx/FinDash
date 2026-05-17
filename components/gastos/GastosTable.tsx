"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { GastoModal } from "./GastoModal"
import { UpgradeModal } from "@/components/ui/UpgradeModal"
import { removerGasto } from "@/app/(app)/gastos/actions"
import { IconPencil, IconTrash, IconPlus, IconReceipt2 } from "@tabler/icons-react"
import type { Gasto } from "@/types"

const categoriaMeta: Record<string, { label: string; color: string }> = {
  necessidade: { label: "Necessidade", color: "var(--fd-amber)" },
  objetivo: { label: "Objetivo", color: "var(--fd-green)" },
  qualidade: { label: "Qualidade", color: "var(--fd-blue)" },
}

interface Props {
  gastos: Gasto[]
  plano: "free" | "premium"
}

export function GastosTable({ gastos, plano }: Props) {
  const [editando, setEditando] = useState<Gasto | null>(null)
  const [criando, setCriando] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleDelete(id: string) {
    if (!confirm("Remover este gasto?")) return
    setDeletingId(id)
    startTransition(async () => {
      const result = await removerGasto(id)
      setDeletingId(null)
      if (result.error) toast.error("Erro ao remover gasto")
      else toast.success("Gasto removido")
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-muted-foreground">
            {gastos.length} {gastos.length === 1 ? "gasto" : "gastos"}
            {plano === "free" && <span className="text-muted-foreground/60"> · limite: 10</span>}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCriando(true)}
        >
          <IconPlus size={15} />
          Novo gasto
        </Button>
      </div>

      {gastos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <IconReceipt2 size={32} className="text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">Nenhum gasto cadastrado</h3>
          <p className="text-muted-foreground text-sm mb-4">Comece adicionando seu primeiro gasto</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setCriando(true)}
          >
            <IconPlus size={14} />
            Adicionar gasto
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Valor</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => {
                const meta = categoriaMeta[g.categoria]
                return (
                  <tr
                    key={g.id}
                    className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3.5 font-medium text-foreground">{g.nome}</td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span
                        className="inline-flex items-center text-xs px-2.5 py-1 rounded-full border font-medium transition-colors"
                        style={{ color: meta.color, borderColor: `${meta.color}30`, backgroundColor: `${meta.color}10` }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-foreground">
                      {g.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => setEditando(g)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
                          title="Editar"
                        >
                          <IconPencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          disabled={deletingId === g.id || isPending}
                          className="p-2 rounded-lg text-muted-foreground hover:text-fd-red hover:bg-fd-red/10 transition-all duration-150 disabled:opacity-50"
                          title="Remover"
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <GastoModal
        open={criando}
        onClose={() => setCriando(false)}
        onLimitReached={() => setShowUpgrade(true)}
      />

      {editando && (
        <GastoModal
          open={!!editando}
          onClose={() => setEditando(null)}
          gasto={editando}
          onLimitReached={() => setShowUpgrade(true)}
        />
      )}

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        recurso="gastos"
      />
    </>
  )
}
