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
import { adicionarFundo, editarFundo } from "@/app/(app)/fundos/actions"
import type { Fundo } from "@/types"

const PRESET_CORES = [
  { value: "#E24B4A", label: "Vermelho" },
  { value: "#378ADD", label: "Azul" },
  { value: "#1D9E75", label: "Verde" },
  { value: "#BA7517", label: "Âmbar" },
  { value: "#9B59B6", label: "Roxo" },
  { value: "#F59E0B", label: "Laranja" },
]

interface Props {
  open: boolean
  onClose: () => void
  fundo?: Fundo
  onLimitReached?: () => void
  onFaseTrocada?: () => void
}

export function FundoModal({ open, onClose, fundo, onLimitReached, onFaseTrocada }: Props) {
  const isEdit = !!fundo
  const [nome, setNome] = useState(fundo?.nome ?? "")
  const [saldo, setSaldo] = useState(fundo ? String(fundo.saldo_atual) : "")
  const [meta, setMeta] = useState(fundo ? String(fundo.meta) : "")
  const [aporte, setAporte] = useState(fundo ? String(fundo.aporte_mensal) : "")
  const [cor, setCor] = useState(fundo?.cor ?? "#E24B4A")
  const [, startTransition] = useTransition()

  function resetForm() {
    setNome("")
    setSaldo("")
    setMeta("")
    setAporte("")
    setCor("#E24B4A")
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const saldoNum = parseFloat(saldo.replace(",", ".")) || 0
    const metaNum = parseFloat(meta.replace(",", "."))
    const aporteNum = parseFloat(aporte.replace(",", ".")) || 0

    if (!nome.trim() || isNaN(metaNum) || metaNum <= 0) return

    startTransition(async () => {
      const data = {
        nome: nome.trim(),
        saldo_atual: saldoNum,
        meta: metaNum,
        aporte_mensal: aporteNum,
        cor,
      }

      const result = isEdit
        ? await editarFundo(fundo.id, data)
        : await adicionarFundo(data)

      if (result.error === "LIMIT_REACHED") {
        onClose()
        onLimitReached?.()
        return
      }

      if (result.error) {
        toast.error("Erro ao salvar fundo")
        return
      }

      if (result.faseTrocada) {
        onFaseTrocada?.()
      }

      toast.success(isEdit ? "Fundo atualizado" : "Fundo criado")
      handleClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar fundo" : "Novo fundo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="fnome">Nome</Label>
            <Input
              id="fnome"
              placeholder="Ex: Reserva de Emergência"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fsaldo">Saldo atual (R$)</Label>
              <Input
                id="fsaldo"
                type="number"
                inputMode="decimal"
                placeholder="0,00"
                min="0"
                step="0.01"
                value={saldo}
                onChange={(e) => setSaldo(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fmeta">Meta (R$)</Label>
              <Input
                id="fmeta"
                type="number"
                inputMode="decimal"
                placeholder="0,00"
                min="0.01"
                step="0.01"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="faporte">Aporte mensal (R$)</Label>
            <Input
              id="faporte"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              min="0"
              step="0.01"
              value={aporte}
              onChange={(e) => setAporte(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {PRESET_CORES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setCor(c.value)}
                  className="size-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c.value,
                    borderColor: cor === c.value ? "white" : "transparent",
                    boxShadow: cor === c.value ? `0 0 0 2px ${c.value}` : "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
