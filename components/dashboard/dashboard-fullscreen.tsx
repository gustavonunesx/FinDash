"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconCash,
  IconChartBar,
  IconPigMoney,
  IconWallet,
} from "@tabler/icons-react";
import { MetricCard } from "./metric-card";
import { Rule502030 } from "./rule-502030";
import { DashboardHero } from "./dashboard-hero";
import { FundoMiniCard } from "./fundo-mini-card";
import { RecentTransactions } from "./recent-transactions";
import { MetaEconomia } from "./meta-economia";
import { MetaAtingidaBanner } from "./meta-atingida-banner";
import { UpgradeBanner } from "./upgrade-banner";
import type { Configuracao, Fundo, Gasto, Profile } from "@/lib/types";
import type { Score502030Result } from "@/lib/score";
import { calcularScore502030, totalPorCategoria } from "@/lib/score";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const PERIODS = ["Esta semana", "Este mês", "Últimos 3 meses", "Este ano"] as const;
type Period = (typeof PERIODS)[number];

function filterGastosByPeriod(gastos: Gasto[], period: Period): Gasto[] {
  const now = new Date();
  return gastos.filter((g) => {
    const date = new Date(g.created_at);
    if (period === "Esta semana") {
      const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }
    if (period === "Este mês") {
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }
    if (period === "Últimos 3 meses") {
      const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 90;
    }
    if (period === "Este ano") {
      return date.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

interface DashboardProps {
  profile: Profile;
  config: Configuracao | null;
  scoreData: Score502030Result;
  totalGastos: number;
  fundos: Fundo[];
  gastos: Gasto[];
  metaEconomia: number | null;
}

export function DashboardFullscreen({
  profile,
  config,
  scoreData: scoreDataServer,
  totalGastos: totalGastosServer,
  fundos,
  gastos,
  metaEconomia,
}: DashboardProps) {
  const [period, setPeriod] = useState<Period>("Este mês");
  const metricsRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const gastosFiltered = filterGastosByPeriod(gastos, period);
  const scoreData = period === "Este mês" ? scoreDataServer : calcularScore502030(config, gastosFiltered);
  const totaisFiltrados = totalPorCategoria(gastosFiltered);
  const totalGastos = period === "Este mês" ? totalGastosServer : totaisFiltrados.necessidade + totaisFiltrados.objetivo + totaisFiltrados.qualidade;
  const economiaAtual = scoreData.saldoLivre > 0 ? scoreData.saldoLivre : 0;

  useGSAP(() => {
    const cards = metricsRef.current?.querySelectorAll("[data-metric-card]");
    if (cards?.length) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.6, stagger: 0.08, ease: "power3.out",
          scrollTrigger: {
            trigger: metricsRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }

    const cols = bottomRef.current?.querySelectorAll("[data-bottom-col]");
    if (cols?.length) {
      gsap.fromTo(
        cols,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0,
          duration: 0.65, stagger: 0.1, ease: "power3.out",
          scrollTrigger: {
            trigger: bottomRef.current,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, { dependencies: [scoreDataServer] });

  const nome = profile.nome ?? "Usuário";
  const rendimentoMensal = fundos.reduce((acc, f) => acc + f.saldo_atual * 0.001, 0);
  const totalFundos = fundos.reduce((acc, f) => acc + f.saldo_atual, 0);
  const taxaGastos = scoreData.rendaTotal > 0
    ? (totalGastos / scoreData.rendaTotal) * 100
    : 0;

  return (
    <div className="relative space-y-6 pb-24 md:pb-8">

      {/* ── Glow de fundo ambiental ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-fd-green/[0.03] blur-[120px]" />
        <div className="absolute -top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-fd-blue/[0.03] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fd-purple/[0.02] blur-[140px]" />
      </div>

      {/* ── Header: saudação + filtro temporal ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#1a1a24] px-6 py-5"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.35)" }}
      >
        <DashboardHero nome={nome} scoreData={scoreData} />

        {/* Filtro temporal */}
        <div className="mt-5 flex items-center gap-1 border-t border-white/[0.05] pt-4">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                period === p
                  ? "bg-fd-green/15 text-fd-green"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div ref={metricsRef} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div data-metric-card>
          <MetricCard
            title="Saldo Livre"
            value={scoreData.saldoLivre}
            icon={<IconWallet className="h-4 w-4" />}
            iconColor="green"
            badge={scoreData.saldoLivre >= 0
              ? { label: "Positivo", variant: "green" }
              : { label: "Negativo", variant: "destructive" }
            }
          />
        </div>
        <div data-metric-card>
          <MetricCard
            title={`Gastos — ${period}`}
            value={totalGastos}
            icon={<IconCash className="h-4 w-4" />}
            iconColor="amber"
            progress={taxaGastos}
            badge={{ label: `${gastosFiltered.length} itens`, variant: "amber" }}
          />
        </div>
        <div data-metric-card>
          <MetricCard
            title="Patrimônio em Fundos"
            value={totalFundos}
            icon={<IconPigMoney className="h-4 w-4" />}
            iconColor="purple"
            badge={{ label: formatCurrency(rendimentoMensal) + "/mês", variant: "purple" }}
          />
        </div>
        <div data-metric-card>
          <MetricCard
            title="Score 50/30/20"
            value={scoreData.score}
            formatAsCurrency={false}
            icon={<IconChartBar className="h-4 w-4" />}
            iconColor={
              scoreData.status === "saudavel" ? "green" :
              scoreData.status === "atencao" ? "amber" : "green"
            }
            badge={{
              label:
                scoreData.status === "saudavel" ? "Saudável" :
                scoreData.status === "atencao" ? "Atenção" : "Crítico",
              variant:
                scoreData.status === "saudavel" ? "green" :
                scoreData.status === "atencao" ? "amber" : "destructive",
            }}
          />
        </div>
      </div>

      {/* ── Centro: Regra 50/30/20 + Painel lateral ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Regra 50/30/20 */}
        <div>
          <MetaAtingidaBanner fundos={fundos} />
          <Rule502030 data={scoreData} />
        </div>

        {/* Painel lateral: meta + renda */}
        <div className="flex flex-col gap-4">
          {metaEconomia && metaEconomia > 0 && (
            <MetaEconomia meta={metaEconomia} atual={economiaAtual} />
          )}

          {/* Card: Renda vs Gastos */}
          <div
            className="rounded-2xl border border-white/[0.06] bg-[#1a1a24] p-5 flex-1"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.4)" }}
          >
            <h3 className="text-sm font-semibold">Visão geral</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Renda vs. categorias</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Renda total</span>
                <span className="font-mono text-sm font-bold text-fd-green">
                  {formatCurrency(scoreData.rendaTotal)}
                </span>
              </div>
              <div className="h-px bg-white/[0.05]" />
              {scoreData.categorias.map((cat) => (
                <div key={cat.categoria} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      cat.categoria === "necessidade" ? "bg-fd-amber" :
                      cat.categoria === "objetivo" ? "bg-fd-green" : "bg-fd-blue"
                    )} />
                    <span className="text-xs capitalize text-muted-foreground">
                      {cat.categoria}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-medium">
                      {formatCurrency(cat.gasto)}
                    </span>
                    <span className="ml-1 font-mono text-xs text-muted-foreground">
                      / {formatCurrency(cat.limite)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="h-px bg-white/[0.05]" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Saldo livre</span>
                <span className={cn(
                  "font-mono text-sm font-bold",
                  scoreData.saldoLivre >= 0 ? "text-fd-green" : "text-fd-red"
                )}>
                  {formatCurrency(scoreData.saldoLivre)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fundos + Transações ── */}
      <div ref={bottomRef} className="grid gap-4 lg:grid-cols-2">

        {/* Fundos */}
        <div data-bottom-col className="rounded-2xl border border-white/[0.06] bg-[#1a1a24] p-5"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.4)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Fundos & Metas</h2>
              <p className="text-xs text-muted-foreground">{fundos.length} fundo{fundos.length !== 1 ? "s" : ""} ativo{fundos.length !== 1 ? "s" : ""}</p>
            </div>
            <Link
              href="/fundos"
              className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-white/[0.07] hover:text-foreground"
            >
              Ver todos
              <IconArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {fundos.length === 0 ? (
            <div className="flex h-28 items-center justify-center rounded-xl border border-white/[0.04] text-sm text-muted-foreground">
              Nenhum fundo cadastrado.
            </div>
          ) : (
            <div className="space-y-2">
              {fundos.slice(0, 3).map((fundo) => (
                <FundoMiniCard key={fundo.id} fundo={fundo} />
              ))}
            </div>
          )}

          {/* Total patrimônio */}
          {fundos.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
              <span className="text-xs text-muted-foreground">Total investido</span>
              <span className="font-mono text-sm font-bold text-fd-purple">
                {formatCurrency(totalFundos)}
              </span>
            </div>
          )}
        </div>

        {/* Transações */}
        <div data-bottom-col className="rounded-2xl border border-white/[0.06] bg-[#1a1a24] p-5"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.4)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Transações recentes</h2>
              <p className="text-xs text-muted-foreground">{gastosFiltered.slice(0, 6).length} lançamento{gastosFiltered.slice(0, 6).length !== 1 ? "s" : ""} — {period.toLowerCase()}</p>
            </div>
            <Link
              href="/gastos"
              className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-white/[0.07] hover:text-foreground"
            >
              Ver todos
              <IconArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <RecentTransactions gastos={gastosFiltered.slice(0, 6)} />
        </div>
      </div>

      {/* ── Upgrade banner (Free) ── */}
      {profile.plano === "free" && <UpgradeBanner />}
    </div>
  );
}
