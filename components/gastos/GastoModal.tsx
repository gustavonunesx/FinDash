"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { adicionarGasto, editarGasto } from "@/app/(app)/gastos/actions"
import type { Gasto, Categoria } from "@/types"

interface Props {
  open: boolean
  onClose: () => void
  gasto?: Gasto
  onLimitReached?: () => void
}

const categorias: { value: Categoria; label: string }[] = [
  { value: "necessidade", label: "Necessidade" },
  { value: "objetivo", label: "Objetivo" },
  { value: "qualidade", label: "Qualidade de Vida" },
]

export function GastoModal({ open, onClose, gasto, onLimitReached }: Props) {
  const isEdit = !!gasto
  const [nome, setNome] = useState(gasto?.nome ?? "")
  const [valor, setValor] = useState(gasto ? String(gasto.valor) : "")
  const [categoria, setCategoria] = useState<Categoria>(gasto?.categoria ?? "necessidade")
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setNome("")
    setValor("")
    setCategoria("necessidade")
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valorNum = parseFloat(valor.replace(",", "."))
    if (!nome.trim() || isNaN(valorNum) || valorNum <= 0) return

    startTransition(async () => {
      const action = isEdit
        ? editarGasto(gasto.id, { nome: nome.trim(), valor: valorNum, categoria })
        : adicionarGasto({ nome: nome.trim(), valor: valorNum, categoria })

      const result = await action

      if (result.error === "LIMIT_REACHED") {
        onClose()
        onLimitReached?.()
        return
      }

      if (result.error) {
        toast.error("Erro ao salvar gasto")
        return
      }

      toast.success(isEdit ? "Gasto atualizado" : "Gasto adicionado")
      handleClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar gasto" : "Novo gasto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Ex: Academia"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              disabled={isPending}
            >
              {isPending ? "Salvando…" : isEdit ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
