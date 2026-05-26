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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { adicionarGasto, editarGasto } from "@/app/(app)/gastos/actions"
import { IconCurrencyReal, IconTag, IconRepeat } from "@tabler/icons-react"
import type { Gasto, Categoria } from "@/types"

interface Props {
  open: boolean
  onClose: () => void
  gasto?: Gasto
  onLimitReached?: () => void
}

const categorias: { value: Categoria; label: string; color: string }[] = [
  { value: "necessidade", label: "Necessidade", color: "var(--fd-amber)" },
  { value: "objetivo", label: "Objetivo", color: "var(--fd-green)" },
  { value: "qualidade", label: "Qualidade de Vida", color: "var(--fd-blue)" },
]

export function GastoModal({ open, onClose, gasto, onLimitReached }: Props) {
  const isEdit = !!gasto
  const [nome, setNome] = useState(gasto?.nome ?? "")
  const [valor, setValor] = useState(gasto ? String(gasto.valor) : "")
  const [categoria, setCategoria] = useState<Categoria>(gasto?.categoria ?? "necessidade")
  const [recorrente, setRecorrente] = useState(gasto?.recorrente ?? false)
  const [diaRecorrencia, setDiaRecorrencia] = useState(
    gasto?.dia_recorrencia ? String(gasto.dia_recorrencia) : ""
  )
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setNome("")
    setValor("")
    setCategoria("necessidade")
    setRecorrente(false)
    setDiaRecorrencia("")
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valorNum = parseFloat(valor.replace(",", "."))
    if (!nome.trim() || isNaN(valorNum) || valorNum <= 0) return
    const diaNum = diaRecorrencia ? parseInt(diaRecorrencia) : null

    startTransition(async () => {
      const action = isEdit
        ? editarGasto(gasto.id, { nome: nome.trim(), valor: valorNum, categoria, recorrente, dia_recorrencia: diaNum })
        : adicionarGasto({ nome: nome.trim(), valor: valorNum, categoria, recorrente, dia_recorrencia: diaNum })

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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">{isEdit ? "Editar gasto" : "Novo gasto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium">Nome</Label>
            <div className="relative">
              <IconTag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="nome"
                placeholder="Ex: Academia, Aluguel..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoFocus
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor" className="text-sm font-medium">Valor (R$)</Label>
            <div className="relative">
              <IconCurrencyReal className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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
                className="pl-10 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Categoria</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recorrente toggle */}
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconRepeat size={15} className="text-muted-foreground" />
                <Label htmlFor="recorrente" className="text-sm font-medium cursor-pointer">
                  Gasto recorrente
                </Label>
              </div>
              <Switch
                id="recorrente"
                checked={recorrente}
                onCheckedChange={(checked: boolean) => {
                  setRecorrente(checked)
                  if (!checked) setDiaRecorrencia("")
                }}
              />
            </div>

            {recorrente && (
              <div className="space-y-1.5">
                <Label htmlFor="dia" className="text-xs text-muted-foreground">
                  Dia do mês (opcional)
                </Label>
                <Input
                  id="dia"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="31"
                  placeholder="Ex: 5 (vence todo dia 5)"
                  value={diaRecorrencia}
                  onChange={(e) => setDiaRecorrencia(e.target.value)}
                  className="font-mono h-8 text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Aparecerá como sugestão mensal na página de gastos.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending}
            >
              {isPending ? "Salvando..." : isEdit ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
