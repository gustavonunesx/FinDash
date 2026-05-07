"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { IconSparkles, IconExternalLink, IconFileTypePdf } from "@tabler/icons-react"
import { salvarNome, salvarCustoVida } from "@/app/(app)/configuracoes/actions"

const STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste",
  canceled: "Cancelada",
}

const STATUS_COLOR: Record<string, string> = {
  active: "var(--fd-green)",
  trialing: "var(--fd-blue)",
  canceled: "var(--fd-red)",
}

interface Props {
  email: string
  nome: string
  plano: "free" | "premium"
  assinaturaStatus: "active" | "canceled" | "trialing" | null
  temStripeCustomer: boolean
  custoVida: number
}

export function ConfiguracoesClient({ email, nome: nomeInicial, plano, assinaturaStatus, temStripeCustomer, custoVida: custoVidaInicial }: Props) {
  const [nome, setNome] = useState(nomeInicial)
  const [custoVida, setCustoVida] = useState(String(custoVidaInicial))
  const [isPending, startTransition] = useTransition()
  const [portalPending, setPortalPending] = useState(false)
  const [pdfPending, setPdfPending] = useState(false)

  function handleSalvarNome() {
    if (!nome.trim() || nome === nomeInicial) return
    startTransition(async () => {
      const res = await salvarNome(nome)
      if (res.error) toast.error("Erro ao salvar nome")
      else toast.success("Nome atualizado")
    })
  }

  function handleSalvarCustoVida() {
    const val = parseFloat(custoVida.replace(",", "."))
    if (isNaN(val) || val <= 0) return
    if (val === custoVidaInicial) return
    startTransition(async () => {
      const res = await salvarCustoVida(val)
      if (res.error) toast.error("Erro ao salvar custo de vida")
      else toast.success("Custo de vida atualizado")
    })
  }

  async function handleExportarPdf() {
    setPdfPending(true)
    try {
      const res = await fetch("/api/exportar-pdf")
      if (!res.ok) { toast.error("Erro ao gerar PDF"); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `findash-${new Date().toISOString().slice(0,7)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setPdfPending(false)
    }
  }

  async function handlePortal() {
    setPortalPending(true)
    const res = await fetch("/api/stripe/portal", { method: "POST" })
    const data = await res.json()
    setPortalPending(false)
    if (data.url) window.location.href = data.url
    else toast.error("Erro ao acessar portal de assinatura")
  }

  return (
    <div className="space-y-6">
      {/* Seção Conta */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Conta</h2>
        <Separator className="bg-border" />

        <div className="space-y-1.5">
          <Label>Email</Label>
          <p className="text-sm text-muted-foreground font-mono">{email}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="conf-nome">Nome</Label>
          <div className="flex gap-2">
            <Input
              id="conf-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="max-w-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSalvarNome}
              disabled={isPending || !nome.trim() || nome === nomeInicial}
            >
              Salvar
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="conf-custo">Custo de vida mensal (R$)</Label>
          <p className="text-xs text-muted-foreground">Usado para calcular o tamanho da sua reserva de emergência (3×).</p>
          <div className="flex gap-2">
            <Input
              id="conf-custo"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={custoVida}
              onChange={(e) => setCustoVida(e.target.value)}
              className="max-w-xs font-mono"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSalvarCustoVida}
              disabled={isPending}
            >
              Salvar
            </Button>
          </div>
        </div>
      </section>

      {/* Seção Assinatura */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Assinatura</h2>
        <Separator className="bg-border" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Plano atual</p>
            <div className="flex items-center gap-2 mt-1">
              {plano === "premium" ? (
                <>
                  <IconSparkles size={16} className="text-primary" />
                  <span className="font-semibold text-foreground">Premium</span>
                  {assinaturaStatus && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border font-medium"
                      style={{
                        color: STATUS_COLOR[assinaturaStatus] ?? "var(--fd-green)",
                        borderColor: `${STATUS_COLOR[assinaturaStatus] ?? "var(--fd-green)"}40`,
                        backgroundColor: `${STATUS_COLOR[assinaturaStatus] ?? "var(--fd-green)"}15`,
                      }}
                    >
                      {STATUS_LABEL[assinaturaStatus] ?? assinaturaStatus}
                    </span>
                  )}
                </>
              ) : (
                <span className="font-semibold text-foreground">Gratuito</span>
              )}
            </div>
          </div>

          {plano === "premium" && temStripeCustomer ? (
            <button
              onClick={handlePortal}
              disabled={portalPending}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-50"
            >
              <IconExternalLink size={14} />
              {portalPending ? "Abrindo…" : "Gerenciar assinatura"}
            </button>
          ) : (
            <Link
              href="/precos"
              className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <IconSparkles size={14} />
              Ver planos
            </Link>
          )}
        </div>

        {plano === "premium" && (
          <button
            onClick={handleExportarPdf}
            disabled={pdfPending}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <IconFileTypePdf size={16} />
            {pdfPending ? "Gerando PDF…" : "Exportar relatório PDF"}
          </button>
        )}

        {plano === "free" && (
          <div className="rounded-md bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-muted-foreground">
            Com o Premium você desbloqueia gastos ilimitados, histórico mensal e exportação PDF.{" "}
            <Link href="/precos" className="text-primary hover:underline">
              Saiba mais →
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
