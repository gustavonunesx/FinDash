"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconSparkles, IconExternalLink, IconFileTypePdf, IconUser, IconCreditCard, IconArrowRight } from "@tabler/icons-react"
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
      <section className="rounded-xl border border-border bg-card p-6 space-y-5 transition-all hover:border-foreground/10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center">
            <IconUser size={20} className="text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-foreground text-lg">Conta</h2>
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">Email</Label>
          <p className="text-sm text-foreground font-mono bg-muted/30 px-3 py-2 rounded-lg">{email}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="conf-nome" className="text-muted-foreground text-xs uppercase tracking-wide">Nome</Label>
          <div className="flex gap-3">
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

        <div className="space-y-2">
          <Label htmlFor="conf-custo" className="text-muted-foreground text-xs uppercase tracking-wide">Custo de vida mensal (R$)</Label>
          <p className="text-xs text-muted-foreground">Usado para calcular o tamanho da sua reserva de emergência (3x).</p>
          <div className="flex gap-3">
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
      <section className="rounded-xl border border-border bg-card p-6 space-y-5 transition-all hover:border-foreground/10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center">
            <IconCreditCard size={20} className="text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-foreground text-lg">Assinatura</h2>
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Plano atual</p>
            <div className="flex items-center gap-2">
              {plano === "premium" ? (
                <>
                  <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <IconSparkles size={16} className="text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">Premium</span>
                  {assinaturaStatus && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full border font-medium"
                      style={{
                        color: STATUS_COLOR[assinaturaStatus] ?? "var(--fd-green)",
                        borderColor: `${STATUS_COLOR[assinaturaStatus] ?? "var(--fd-green)"}30`,
                        backgroundColor: `${STATUS_COLOR[assinaturaStatus] ?? "var(--fd-green)"}10`,
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
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
            >
              <IconExternalLink size={14} />
              {portalPending ? "Abrindo..." : "Gerenciar assinatura"}
            </button>
          ) : (
            <Link
              href="/precos"
              className="group text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20"
            >
              <IconSparkles size={14} />
              Ver planos
              <IconArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {plano === "premium" && (
          <button
            onClick={handleExportarPdf}
            disabled={pdfPending}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors px-4 py-2.5 rounded-lg border border-border hover:border-foreground/20 hover:bg-muted/30"
          >
            <IconFileTypePdf size={18} />
            {pdfPending ? "Gerando PDF..." : "Exportar relatório PDF"}
          </button>
        )}

        {plano === "free" && (
          <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 px-5 py-4 text-sm text-muted-foreground">
            <p className="text-foreground font-medium mb-1">Desbloqueie todo o potencial do FinDash</p>
            <p className="text-muted-foreground">
              Gastos ilimitados, histórico mensal e exportação PDF.{" "}
              <Link href="/precos" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Saiba mais
              </Link>
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
