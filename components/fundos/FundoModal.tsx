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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { adicionarFundo, editarFundo } from "@/app/(app)/fundos/actions"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import type { Fundo, Custodia, TipoRendimento } from "@/types"

const PRESET_CORES = [
  { value: "#C94040", label: "Vermelho" },
  { value: "#378ADD", label: "Azul" },
  { value: "#1D9E75", label: "Verde" },
  { value: "#C98A2E", label: "Âmbar" },
  { value: "#7C5CBF", label: "Roxo" },
  { value: "#F59E0B", label: "Laranja" },
]

const INSTITUICOES = ["Nubank", "Inter", "Itaú", "XP", "BTG", "Sicoob", "Outro"]

const TIPOS_RENDIMENTO: { value: TipoRendimento; label: string; taxaLabel: string | null }[] = [
  { value: "percentual_cdi", label: "% do CDI", taxaLabel: "% do CDI (ex: 100 = 100%)" },
  { value: "prefixado", label: "Prefixado % a.a.", taxaLabel: "Taxa % a.a. (ex: 12,5)" },
  { value: "ipca_mais", label: "IPCA + spread", taxaLabel: "Spread % a.a. (ex: 5)" },
  { value: "poupanca", label: "Poupança", taxaLabel: null },
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
  const [cor, setCor] = useState(fundo?.cor ?? "#C94040")
  const [custodiaEnabled, setCustodiaEnabled] = useState(!!fundo?.custodia)
  const [custodiaOpen, setCustodiaOpen] = useState(!!fundo?.custodia)
  const [instituicao, setInstituicao] = useState(fundo?.custodia?.instituicao ?? "Nubank")
  const [tipo, setTipo] = useState<TipoRendimento>(fundo?.custodia?.tipo ?? "percentual_cdi")
  const [taxa, setTaxa] = useState(String(fundo?.custodia?.taxa ?? "100"))
  const [dataInicio, setDataInicio] = useState(
    fundo?.custodia?.data_inicio ?? new Date().toISOString().split("T")[0]
  )
  const [aporteInicial, setAporteInicial] = useState(
    fundo?.custodia?.aporte_inicial ? String(fundo.custodia.aporte_inicial) : ""
  )
  const [, startTransition] = useTransition()

  const taxaConfig = TIPOS_RENDIMENTO.find((t) => t.value === tipo)

  function resetForm() {
    setNome("")
    setSaldo("")
    setMeta("")
    setAporte("")
    setCor("#C94040")
    setCustodiaEnabled(false)
    setCustodiaOpen(false)
    setInstituicao("Nubank")
    setTipo("percentual_cdi")
    setTaxa("100")
    setDataInicio(new Date().toISOString().split("T")[0])
    setAporteInicial("")
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleCustodiaToggle(checked: boolean) {
    setCustodiaEnabled(checked)
    if (checked) setCustodiaOpen(true)
    else setCustodiaOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const saldoNum = parseFloat(saldo.replace(",", ".")) || 0
    const metaNum = parseFloat(meta.replace(",", "."))
    const aporteNum = parseFloat(aporte.replace(",", ".")) || 0

    if (!nome.trim() || isNaN(metaNum) || metaNum <= 0) return

    let custodia: Custodia | null = null
    if (custodiaEnabled && aporteInicial) {
      const aporteInicialNum = parseFloat(aporteInicial.replace(",", ".")) || 0
      const taxaNum = parseFloat(taxa.replace(",", ".")) || 0
      if (aporteInicialNum > 0 && dataInicio) {
        custodia = {
          instituicao,
          tipo,
          taxa: tipo === "poupanca" ? 0 : taxaNum,
          data_inicio: dataInicio,
          aporte_inicial: aporteInicialNum,
        }
      }
    }

    startTransition(async () => {
      const data = {
        nome: nome.trim(),
        saldo_atual: saldoNum,
        meta: metaNum,
        aporte_mensal: aporteNum,
        cor,
        custodia,
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
      <DialogContent className="max-w-sm bg-card border-border max-h-[90vh] overflow-y-auto">
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

          {/* Custódia section */}
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                if (!custodiaEnabled) {
                  setCustodiaEnabled(true)
                  setCustodiaOpen(true)
                } else {
                  setCustodiaOpen((v) => !v)
                }
              }}
              className="w-full flex items-center justify-between px-3.5 py-3 text-sm hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Switch
                  checked={custodiaEnabled}
                  onCheckedChange={handleCustodiaToggle}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className={custodiaEnabled ? "text-foreground font-medium" : "text-muted-foreground"}>
                  Onde está guardado?
                </span>
                {custodiaEnabled && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-fd-green/15 text-fd-green font-medium">
                    ativo
                  </span>
                )}
              </div>
              {custodiaEnabled && (
                custodiaOpen
                  ? <IconChevronUp size={14} className="text-muted-foreground" />
                  : <IconChevronDown size={14} className="text-muted-foreground" />
              )}
            </button>

            {custodiaEnabled && custodiaOpen && (
              <div className="px-3.5 pb-3.5 space-y-3 border-t border-border/50 pt-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Instituição</Label>
                    <Select value={instituicao} onValueChange={setInstituicao}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INSTITUICOES.map((i) => (
                          <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de rendimento</Label>
                    <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRendimento)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_RENDIMENTO.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {taxaConfig?.taxaLabel && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{taxaConfig.taxaLabel}</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder={tipo === "percentual_cdi" ? "100" : "12,5"}
                      min="0"
                      step="0.01"
                      value={taxa}
                      onChange={(e) => setTaxa(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data de início</Label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Valor investido (R$)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="500,00"
                      min="0"
                      step="0.01"
                      value={aporteInicial}
                      onChange={(e) => setAporteInicial(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Usado para calcular o rendimento acumulado. O valor investido é o montante inicial aplicado neste produto.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white">
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
