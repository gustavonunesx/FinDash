"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MetricCard } from "./metric-card";
import { Rule502030 } from "./rule-502030";
import { DashboardHero } from "./dashboard-hero";
import { FundoMiniCard } from "./fundo-mini-card";
import { StreakBar } from "./streak-bar";
import { RecentTransactions } from "./recent-transactions";
import { MetaEconomia } from "./meta-economia";
import { MetaAtingidaBanner } from "./meta-atingida-banner";
import { RecorrentesAlert } from "./recorrentes-alert";
import { UpgradeBanner } from "./upgrade-banner";
import type { Fundo, Gasto, Profile } from "@/lib/types";
import type { Score502030Result } from "@/lib/score";
import { formatCurrency } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface DashboardFullscreenProps {
  profile: Profile;
  scoreData: Score502030Result;
  totalGastos: number;
  fundos: Fundo[];
  gastos: Gasto[];
  metaEconomia: number | null;
  economiaAtual: number;
}

export function DashboardFullscreen({
  profile,
  scoreData,
  totalGastos,
  fundos,
  gastos,
  metaEconomia,
  economiaAtual,
}: DashboardFullscreenProps) {
  const metricsRef = useRef<HTMLElement>(null);
  const fundosRef = useRef<HTMLElement>(null);
  const transactionsRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = metricsRef.current?.querySelectorAll("[data-metric-card]");
      if (!cards?.length) return;

      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: metricsRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: scrollRef, dependencies: [scoreData] }
  );

  const nome = profile.nome?.split(" ")[0] ?? "Usuário";
  const rendimentoMensal = fundos.reduce((acc, f) => acc + f.saldo_atual * 0.001, 0);

  return (
    <div ref={scrollRef} className="dashboard-snap -mx-4 md:-mx-8">
      <DashboardHero nome={nome} scoreData={scoreData} />

      <section ref={metricsRef} className="dashboard-section px-6 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">Suas métricas</h2>
          <MetaAtingidaBanner fundos={fundos} />
          <RecorrentesAlert gastos={gastos} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div data-metric-card>
              <MetricCard
                title="Saldo Livre"
                value={scoreData.saldoLivre}
                badge={
                  scoreData.saldoLivre >= 0
                    ? { label: "Positivo", variant: "green" }
                    : { label: "Negativo", variant: "destructive" }
                }
              />
            </div>
            <div data-metric-card>
              <MetricCard
                title="Gastos do Mês"
                value={totalGastos}
                progress={
                  scoreData.rendaTotal > 0
                    ? (totalGastos / scoreData.rendaTotal) * 100
                    : 0
                }
                badge={{ label: `${gastos.length} itens`, variant: "blue" }}
              />
            </div>
            <div data-metric-card>
              <MetricCard
                title="Fundos Ativos"
                value={fundos.length}
                formatAsCurrency={false}
                badge={{ label: formatCurrency(rendimentoMensal) + "/mês", variant: "purple" }}
              />
            </div>
            <div data-metric-card>
              <MetricCard
                title="Score 50/30/20"
                value={scoreData.score}
                formatAsCurrency={false}
                badge={{
                  label:
                    scoreData.status === "saudavel"
                      ? "Saudável"
                      : scoreData.status === "atencao"
                        ? "Atenção"
                        : "Crítico",
                  variant:
                    scoreData.status === "saudavel"
                      ? "green"
                      : scoreData.status === "atencao"
                        ? "amber"
                        : "destructive",
                }}
              />
            </div>
          </div>

          {metaEconomia && metaEconomia > 0 && (
            <div className="mt-6">
              <MetaEconomia meta={metaEconomia} atual={economiaAtual} />
            </div>
          )}

          <div className="mt-6">
            <StreakBar />
          </div>
        </div>
      </section>

      <section className="dashboard-section px-6 md:px-12">
        <div className="mx-auto max-w-6xl">
          <Rule502030 data={scoreData} />
        </div>
      </section>

      <section ref={fundosRef} className="dashboard-section px-6 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-2xl font-bold md:text-3xl">Fundos & Metas</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {fundos.slice(0, 3).map((fundo) => (
              <div key={fundo.id} className="min-w-[280px] snap-center flex-shrink-0 md:min-w-[320px]">
                <FundoMiniCard fundo={fundo} />
              </div>
            ))}
          </div>
          {profile.plano === "free" && <UpgradeBanner className="mt-8" />}
        </div>
      </section>

      <section ref={transactionsRef} className="dashboard-section px-6 md:px-12 pb-24">
        <div className="mx-auto max-w-6xl">
          <RecentTransactions gastos={gastos.slice(0, 6)} />
        </div>
      </section>
    </div>
  );
}
