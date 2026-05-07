"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {gastos.length} {gastos.length === 1 ? "gasto" : "gastos"}
            {plano === "free" && ` · limite: 10`}
          </p>
        </div>
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white gap-1.5"
          onClick={() => setCriando(true)}
        >
          <IconPlus size={15} />
          Novo gasto
        </Button>
      </div>

      {gastos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IconReceipt2 size={40} className="text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum gasto cadastrado.</p>
          <Button
            variant="link"
            className="text-primary mt-1 text-sm h-auto p-0"
            onClick={() => setCriando(true)}
          >
            Adicionar primeiro gasto
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/50">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Nome</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium hidden sm:table-cell">Categoria</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Valor</th>
                <th className="px-4 py-2.5 w-20" />
              </tr>
            </thead>
            <tbody>
              {gastos.map((g, i) => {
                const meta = categoriaMeta[g.categoria]
                return (
                  <tr
                    key={g.id}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-card" : "bg-card/60"}`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{g.nome}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className="inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium"
                        style={{ color: meta.color, borderColor: `${meta.color}40`, backgroundColor: `${meta.color}15` }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-foreground">
                      {g.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditando(g)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors"
                          title="Editar"
                        >
                          <IconPencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          disabled={deletingId === g.id || isPending}
                          className="p-1.5 rounded text-muted-foreground hover:text-fd-red hover:bg-fd-red/10 transition-colors disabled:opacity-50"
                          title="Remover"
                        >
                          <IconTrash size={14} />
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
