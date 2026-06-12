"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import {
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconCreditCard,
  IconDownload,
  IconExternalLink,
  IconGift,
  IconLogout,
  IconSettings,
  IconShield,
  IconStar,
  IconUserCircle,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { salvarConfiguracoes } from "@/app/(app)/configuracoes/actions";
import type { Configuracao, Profile } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { buildReferralLink, REFERRAL_REWARD_BRL } from "@/lib/referral";
import { useRouter } from "next/navigation";

const TABS = ["Conta", "Plano", "Financeiro"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS = {
  Conta: IconUserCircle,
  Plano: IconStar,
  Financeiro: IconSettings,
};

const PREMIUM_FEATURES = [
  "Gastos e fundos ilimitados",
  "Histórico e analytics completos",
  "Exportação de relatório em PDF",
  "Alertas de orçamento por categoria",
];

function UpgradeCards({
  onCheckout,
  loading,
}: {
  onCheckout: (yearly: boolean) => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-border bg-card overflow-hidden shadow-card"
    >
      {/* Cabeçalho */}
      <div className="border-b border-border px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Upgrade para Premium</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              14 dias grátis, cancele a qualquer momento.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-fd-green/10 px-2.5 py-1 text-[11px] font-medium text-fd-green ring-1 ring-fd-green/20">
            14 dias grátis
          </span>
        </div>

        {/* Features em grid horizontal compacto */}
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5">
          {PREMIUM_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <IconCheck className="h-3 w-3 shrink-0 text-fd-green" />
              <span className="text-xs text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Opções de plano */}
      <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
        {/* Mensal */}
        <button
          type="button"
          onClick={() => onCheckout(false)}
          disabled={loading}
          className="group flex flex-col items-center px-6 py-5 transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <span className="text-xs text-muted-foreground">Mensal</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold">R$29</span>
            <span className="text-xs text-muted-foreground">/mês</span>
          </div>
          <span className="mt-1 text-[10px] text-transparent select-none">—</span>
          <span className="mt-3 w-full rounded-lg bg-fd-green/12 py-2 text-xs font-semibold text-fd-green ring-1 ring-fd-green/25 transition-colors group-hover:bg-fd-green/20">
            Começar grátis
          </span>
        </button>

        {/* Anual */}
        <button
          type="button"
          onClick={() => onCheckout(true)}
          disabled={loading}
          className="group flex flex-col items-center px-6 py-5 transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Anual</span>
            <span className="rounded-full bg-fd-blue/15 px-1.5 py-px text-[10px] font-semibold text-fd-blue">
              −20%
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold text-fd-blue">R$23</span>
            <span className="text-xs text-muted-foreground">/mês</span>
          </div>
          <span className="mt-1 font-mono text-[10px] text-muted-foreground/60">R$276/ano</span>
          <span className="mt-3 w-full rounded-lg bg-fd-blue/10 py-2 text-xs font-semibold text-fd-blue ring-1 ring-fd-blue/20 transition-colors group-hover:bg-fd-blue/20">
            {loading ? "Aguarde..." : "Assinar anual"}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

interface ConfigFormProps {
  profile: Profile;
  config: Configuracao;
  canExportPdf?: boolean;
}

export function ConfigForm({ profile, config, canExportPdf = false }: ConfigFormProps) {
  const [tab, setTab] = useState<Tab>("Conta");
  const [pending, startTransition] = useTransition();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await salvarConfiguracoes({
        nome: fd.get("nome") as string,
        salario: parseFloat(fd.get("salario") as string) || 0,
        renda_extra: parseFloat(fd.get("renda_extra") as string) || 0,
        custo_vida: parseFloat(fd.get("custo_vida") as string) || 0,
        meta_economia_mensal: parseFloat(fd.get("meta_economia") as string) || null,
      });
      if (result.error) toast.error(result.error);
      else toast.success("Configurações salvas");
    });
  }

  async function openPortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? "Stripe não configurado");
    } catch {
      toast.error("Erro ao abrir portal");
    } finally {
      setLoadingPortal(false);
    }
  }

  async function startCheckout(yearly: boolean) {
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearly }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? "Erro ao iniciar checkout");
    } catch {
      toast.error("Erro ao iniciar checkout");
    } finally {
      setLoadingCheckout(false);
    }
  }

  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/login");
    }
  }

  async function exportPdf() {
    try {
      const res = await fetch("/api/exportar-pdf");
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erro ao exportar PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `findash-relatorio-${new Date().toISOString().slice(0, 7)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exportado");
    } catch {
      toast.error("Erro ao exportar PDF");
    }
  }

  async function copyReferral() {
    if (!profile.referral_code) return;
    await navigator.clipboard.writeText(buildReferralLink(profile.referral_code));
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  const isPremium = profile.plano === "premium";
  const statusLabel =
    profile.assinatura_status === "trial" ? "Trial" :
    profile.assinatura_status === "ativa" ? "Ativa" :
    profile.assinatura_status === "cancelada" ? "Cancelada" : "Inativa";

  return (
    <div className="mx-auto max-w-2xl">

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1 shadow-card"
      >
        {TABS.map((t) => {
          const Icon = TAB_ICONS[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                tab === t
                  ? "bg-fd-green/15 text-fd-green"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t}
            </button>
          );
        })}
      </div>

      {/* ── Aba Conta ── */}
      {tab === "Conta" && (
        <div className="space-y-4">

          {/* Perfil */}
          <form onSubmit={handleSubmit}>
          <div
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h2 className="mb-4 text-sm font-semibold">Perfil</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="nome">
                  Nome de exibição
                </label>
                <input
                  id="nome"
                  name="nome"
                  defaultValue={profile.nome ?? ""}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-fd-green/15 px-4 py-2 text-sm font-medium text-fd-green transition-all hover:bg-fd-green/25 disabled:opacity-50"
              >
                {pending ? "Salvando..." : "Salvar nome"}
              </button>
            </div>
          </div>
          </form>

          {/* Sessão */}
          <div
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h2 className="mb-4 text-sm font-semibold">Sessão</h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => toast.info("Troca de conta: saia e entre com outra conta")}
                className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3.5 text-sm text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fd-blue/15 text-fd-blue">
                    <IconUserCircle className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Trocar de conta</p>
                    <p className="text-xs text-muted-foreground">Sair e entrar com outra conta</p>
                  </div>
                </div>
                <IconArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center justify-between rounded-xl border border-fd-red/20 px-4 py-3.5 text-sm text-fd-red transition-all hover:bg-fd-red/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fd-red/15 text-fd-red">
                    <IconLogout className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Sair</p>
                    <p className="text-xs opacity-70">Encerrar sessão atual</p>
                  </div>
                </div>
                <IconArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Referral */}
          {profile.referral_code && (
            <div className="rounded-xl border border-fd-purple/20 bg-purple-50/60 p-6 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fd-purple/15 text-fd-purple">
                  <IconGift className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Indique e ganhe</h2>
                  {(profile.referral_rewards ?? 0) > 0 && (
                    <span className="rounded-full bg-fd-purple/15 px-2 py-0.5 text-[11px] font-medium text-fd-purple">
                      {profile.referral_rewards} recompensa(s)
                    </span>
                  )}
                </div>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Quando um amigo assinar o Premium pelo seu link, você ganha{" "}
                <span className="font-mono text-fd-green">R${REFERRAL_REWARD_BRL}</span> de crédito.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-border bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground">
                  {buildReferralLink(profile.referral_code)}
                </code>
                <button
                  type="button"
                  onClick={copyReferral}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-fd-purple/15 px-3 py-2 text-xs font-medium text-fd-purple transition-all hover:bg-fd-purple/25"
                >
                  {copied ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Aba Plano ── */}
      {tab === "Plano" && (
        <div className="space-y-4">

          {/* Status atual */}
          <div
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Plano atual</p>
                <p className="mt-1 text-2xl font-bold capitalize">
                  {isPremium ? "Premium" : "Gratuito"}
                </p>
                {isPremium && (
                  <span className={cn(
                    "mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                    profile.assinatura_status === "ativa" ? "bg-fd-green/15 text-fd-green" :
                    profile.assinatura_status === "trial" ? "bg-fd-blue/15 text-fd-blue" :
                    "bg-fd-red/15 text-fd-red"
                  )}>
                    {statusLabel}
                  </span>
                )}
              </div>
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                isPremium ? "bg-purple-50 text-fd-purple" : "bg-secondary text-muted-foreground"
              )}>
                <IconShield className="h-6 w-6" />
              </div>
            </div>

            {isPremium && (
              <div className="mt-4 border-t border-border pt-4 space-y-2">
                <p className="text-xs text-muted-foreground">Benefícios ativos</p>
                {[
                  "Gastos ilimitados",
                  "Histórico e analytics",
                  "Exportação de relatório PDF",
                  "Alertas de orçamento",
                ].map((b) => (
                  <div key={b} className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-3.5 w-3.5 text-fd-green" />
                    {b}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações de plano */}
          {isPremium ? (
            <div
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <h2 className="mb-4 text-sm font-semibold">Gerenciar assinatura</h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={openPortal}
                  disabled={loadingPortal}
                  className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3.5 transition-all hover:bg-secondary disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fd-blue/15 text-fd-blue">
                      <IconCreditCard className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">Forma de pagamento</p>
                      <p className="text-xs text-muted-foreground">Trocar cartão, boleto ou PIX</p>
                    </div>
                  </div>
                  <IconExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  type="button"
                  onClick={openPortal}
                  disabled={loadingPortal}
                  className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3.5 transition-all hover:bg-secondary disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fd-amber/15 text-fd-amber">
                      <IconSettings className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">Portal de assinatura</p>
                      <p className="text-xs text-muted-foreground">Faturas, cancelar, mudar plano</p>
                    </div>
                  </div>
                  <IconExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>

                {canExportPdf && (
                  <button
                    type="button"
                    onClick={exportPdf}
                    className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3.5 transition-all hover:bg-secondary"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fd-green/15 text-fd-green">
                        <IconDownload className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Exportar relatório PDF</p>
                        <p className="text-xs text-muted-foreground">Relatório financeiro do mês atual</p>
                      </div>
                    </div>
                    <IconArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Free: upgrade — 3 cards estilo PricingModern */
            <UpgradeCards onCheckout={startCheckout} loading={loadingCheckout} />
          )}
        </div>
      )}

      {/* ── Aba Financeiro ── */}
      {tab === "Financeiro" && (
        <form onSubmit={handleSubmit}>
          <div
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h2 className="mb-5 text-sm font-semibold">Dados financeiros</h2>
            <div className="space-y-4">
              {[
                { id: "salario", label: "Salário mensal", defaultValue: config.salario },
                { id: "renda_extra", label: "Renda extra", defaultValue: config.renda_extra },
                { id: "custo_vida", label: "Custo de vida mensal", defaultValue: config.custo_vida },
                {
                  id: "meta_economia",
                  label: "Meta de economia mensal",
                  defaultValue: config.meta_economia_mensal ?? "",
                  placeholder: formatCurrency(900),
                },
              ].map(({ id, label, defaultValue, placeholder }) => (
                <div key={id}>
                  <label className="mb-1.5 block text-xs text-muted-foreground" htmlFor={id}>
                    {label}
                  </label>
                  <input
                    id={id}
                    name={id}
                    type="number"
                    step="0.01"
                    defaultValue={defaultValue}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                  />
                </div>
              ))}

              <div className="border-t border-border pt-4">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-fd-green/15 px-5 py-2.5 text-sm font-medium text-fd-green transition-all hover:bg-fd-green/25 disabled:opacity-50"
                >
                  {pending ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
