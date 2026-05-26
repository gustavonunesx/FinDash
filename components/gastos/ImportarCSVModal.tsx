"use client"

import { useState, useRef, useTransition } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { importarGastos } from "@/app/(app)/gastos/actions"
import { IconUpload, IconFileTypeCsv, IconX, IconCheck, IconAlertTriangle } from "@tabler/icons-react"
import type { Categoria } from "@/types"

// ── CSV Parser ────────────────────────────────────────────────────────────────

function detectSep(line: string) {
  return (line.match(/;/g) ?? []).length > (line.match(/,/g) ?? []).length ? ";" : ","
}

function parseLine(line: string, sep: string): string[] {
  const result: string[] = []
  let cur = ""
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === sep && !inQuotes) { result.push(cur.trim()); cur = "" }
    else { cur += ch }
  }
  result.push(cur.trim())
  return result
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

const NAME_KW = ["descri", "histor", "memo", "nome", "lanc", "local", "estabelec", "payee", "origin", "comerci"]
const VALUE_KW = ["valor", "value", "debit", "montant", "quantia", "amount", "saida", "saída"]

function findCol(headers: string[], keywords: string[]) {
  const n = headers.map(norm)
  for (const kw of keywords) {
    const i = n.findIndex((h) => h.includes(kw))
    if (i !== -1) return i
  }
  return -1
}

function parseValor(raw: string): number | null {
  // handle "R$ 1.234,56" or "1234.56" or "-1234,56"
  const cleaned = raw.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".").trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export interface GastoImport {
  nome: string
  valor: number
  categoria: Categoria
  selecionado: boolean
}

function parseCSV(text: string): GastoImport[] | string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return "Arquivo sem dados suficientes."

  const sep = detectSep(lines[0])
  const headers = parseLine(lines[0], sep)

  const nomeIdx = findCol(headers, NAME_KW)
  const valorIdx = findCol(headers, VALUE_KW)

  if (nomeIdx === -1) return "Não encontrei uma coluna de descrição. Verifique o formato."
  if (valorIdx === -1) return "Não encontrei uma coluna de valor. Verifique o formato."

  const itens: GastoImport[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i], sep)
    if (cols.length <= Math.max(nomeIdx, valorIdx)) continue

    const nome = cols[nomeIdx].replace(/^["']|["']$/g, "").trim()
    if (!nome) continue

    const rawValor = cols[valorIdx]
    const valor = parseValor(rawValor)
    if (valor === null || valor === 0) continue

    // Only import expenses (negative in Nubank style OR positive in debit-column style)
    const expense = Math.abs(valor)

    itens.push({
      nome,
      valor: expense,
      categoria: "necessidade",
      selecionado: true,
    })
  }

  if (itens.length === 0) return "Nenhum gasto encontrado. Verifique se o arquivo tem despesas."
  return itens
}

// ── Component ─────────────────────────────────────────────────────────────────

const categorias: { value: Categoria; label: string; color: string }[] = [
  { value: "necessidade", label: "Necessidade", color: "var(--fd-amber)" },
  { value: "objetivo", label: "Objetivo", color: "var(--fd-green)" },
  { value: "qualidade", label: "Qualidade", color: "var(--fd-blue)" },
]

interface Props {
  open: boolean
  onClose: () => void
  onLimitReached?: () => void
}

type Step = "upload" | "preview" | "done"

export function ImportarCSVModal({ open, onClose, onLimitReached }: Props) {
  const [step, setStep] = useState<Step>("upload")
  const [dragging, setDragging] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [itens, setItens] = useState<GastoImport[]>([])
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    setStep("upload")
    setParseError(null)
    setItens([])
    onClose()
  }

  function processFile(file: File) {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setParseError("Selecione um arquivo .csv")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const result = parseCSV(text)
      if (typeof result === "string") {
        setParseError(result)
      } else {
        setParseError(null)
        setItens(result)
        setStep("preview")
      }
    }
    reader.readAsText(file, "UTF-8")
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function toggleItem(idx: number) {
    setItens((prev) => prev.map((it, i) => i === idx ? { ...it, selecionado: !it.selecionado } : it))
  }

  function setCategoria(idx: number, cat: Categoria) {
    setItens((prev) => prev.map((it, i) => i === idx ? { ...it, categoria: cat } : it))
  }

  function setCategoriaAll(cat: Categoria) {
    setItens((prev) => prev.map((it) => ({ ...it, categoria: cat })))
  }

  function handleConfirmar() {
    const selecionados = itens.filter((it) => it.selecionado)
    if (selecionados.length === 0) return

    startTransition(async () => {
      const res = await importarGastos(selecionados.map((it) => ({
        nome: it.nome,
        valor: it.valor,
        categoria: it.categoria,
      })))

      if (res.error === "LIMIT_REACHED") {
        onClose()
        onLimitReached?.()
        return
      }
      if (res.error) {
        toast.error("Erro ao importar gastos")
        return
      }

      toast.success(`${res.importados} gasto${res.importados !== 1 ? "s" : ""} importado${res.importados !== 1 ? "s" : ""}`)
      setStep("done")
    })
  }

  const selecionados = itens.filter((it) => it.selecionado)
  const totalSelecionado = selecionados.reduce((s, it) => s + it.valor, 0)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <IconFileTypeCsv size={20} className="text-primary" />
            Importar extrato CSV
          </DialogTitle>
        </DialogHeader>

        {/* Step: upload */}
        {step === "upload" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Suporta exportações do <strong>Nubank</strong>, <strong>Inter</strong>, <strong>Itaú</strong> e outros bancos em formato CSV.
            </p>

            <div
              className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/20"
              }`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <IconUpload size={32} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Arraste o arquivo CSV ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">Apenas arquivos .csv</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
            </div>

            {parseError && (
              <div className="flex items-start gap-2 rounded-lg bg-fd-red/10 border border-fd-red/20 px-4 py-3 text-sm text-fd-red">
                <IconAlertTriangle size={16} className="mt-0.5 shrink-0" />
                {parseError}
              </div>
            )}

            <div className="rounded-lg bg-muted/30 border border-border px-4 py-3 space-y-1.5">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Como exportar o CSV</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li><strong className="text-foreground">Nubank:</strong> App → Minha conta → Extrato → Exportar como CSV</li>
                <li><strong className="text-foreground">Inter:</strong> App → Extrato → Filtrar → Exportar</li>
                <li><strong className="text-foreground">Itaú:</strong> Internet Banking → Extrato → Salvar como CSV</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step: preview */}
        {step === "preview" && (
          <div className="flex flex-col gap-4 min-h-0 flex-1 pt-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{itens.length}</span> transações detectadas.
                Selecione as que deseja importar e defina a categoria.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Definir todas como:
                {categorias.map((c) => (
                  <button key={c.value} onClick={() => setCategoriaAll(c.value)}
                    className="px-2 py-1 rounded border text-[10px] font-medium transition-colors hover:opacity-80"
                    style={{ color: c.color, borderColor: `${c.color}40`, backgroundColor: `${c.color}10` }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl border border-border min-h-0">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2.5 w-8" />
                    <th className="px-3 py-2.5 text-left text-muted-foreground font-medium text-xs uppercase tracking-wide">Descrição</th>
                    <th className="px-3 py-2.5 text-right text-muted-foreground font-medium text-xs uppercase tracking-wide">Valor</th>
                    <th className="px-3 py-2.5 text-right text-muted-foreground font-medium text-xs uppercase tracking-wide w-40">Categoria</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((it, i) => (
                    <tr key={i}
                      className={`border-b border-border/50 last:border-0 transition-colors ${
                        it.selecionado ? "hover:bg-muted/10" : "opacity-40 bg-muted/5"
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => toggleItem(i)}
                          className={`size-5 rounded border flex items-center justify-center transition-all ${
                            it.selecionado
                              ? "bg-primary border-primary text-white"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {it.selecionado && <IconCheck size={11} />}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-foreground max-w-[240px]">
                        <span className="truncate block">{it.nome}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-foreground">
                        {it.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="px-3 py-2.5">
                        <Select
                          value={it.categoria}
                          onValueChange={(v) => setCategoria(i, v as Categoria)}
                          disabled={!it.selecionado}
                        >
                          <SelectTrigger className="h-7 text-xs w-36 ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                <div className="flex items-center gap-2">
                                  <div className="size-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                  {c.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{selecionados.length}</span> selecionados ·{" "}
                <span className="font-mono font-semibold text-foreground">
                  {totalSelecionado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setStep("upload")}>
                  Voltar
                </Button>
                <Button size="sm" onClick={handleConfirmar} disabled={isPending || selecionados.length === 0}>
                  {isPending ? "Importando..." : `Importar ${selecionados.length} gasto${selecionados.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: done */}
        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="size-14 rounded-full bg-primary/15 flex items-center justify-center">
              <IconCheck size={28} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground text-lg">Importação concluída!</p>
              <p className="text-sm text-muted-foreground mt-1">Os gastos foram adicionados à sua lista.</p>
            </div>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
