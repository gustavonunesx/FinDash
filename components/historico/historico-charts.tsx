"use client";

import { useEffect, useRef } from "react";
import type { HistoricoMensal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { TrendIndicators } from "@/components/historico/trend-indicators";
import { LineChartMin, BarChartMin, type LineSeries } from "@/components/historico/svg-charts-min";

interface HistoricoChartsProps {
  historico: HistoricoMensal[];
}

function formatMes(mes: string) {
  const d = new Date(mes);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

/** Label curta p/ eixo dos gráficos — só o mês, evita corte do último tick. */
function formatMesCurto(mes: string) {
  const d = new Date(mes);
  return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

const GREEN = "var(--color-fd-green)";
const RED = "var(--color-fd-red)";
const BLUE = "var(--color-fd-blue)";
const PURPLE = "var(--color-fd-purple)";
const AMBER = "var(--color-fd-amber)";
const FUND_COLORS = [GREEN, BLUE, PURPLE, AMBER];

/** Reveal on-scroll: fade + translateY, stagger via --index. IntersectionObserver. */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Panel({
  index,
  eyebrow,
  title,
  meta,
  legend,
  children,
}: {
  index: number;
  eyebrow: string;
  title: string;
  meta?: string;
  legend?: { name: string; color: string }[];
  children: React.ReactNode;
}) {
  return (
    <section
      data-reveal
      style={{ "--index": index } as React.CSSProperties}
      className="reveal group rounded-xl border border-border bg-card p-6 transition-shadow duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] md:p-8"
    >
      <header className="mb-7 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight text-foreground">{title}</h2>
        </div>
        {legend ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {legend.map((l) => (
              <span key={l.name} className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
                {l.name}
              </span>
            ))}
          </div>
        ) : meta ? (
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{meta}</span>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="border-l border-border pl-4 first:border-l-0 first:pl-0 md:border-l md:first:border-l md:first:pl-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-xl font-medium tracking-tight text-foreground md:text-[1.75rem]">{value}</p>
      <div className="mt-3 h-px w-8" style={{ background: accent }} />
    </div>
  );
}

export function HistoricoCharts({ historico }: HistoricoChartsProps) {
  const revealRef = useReveal();
  const meses = historico.map((h) => formatMesCurto(h.mes));
  const n = historico.length;

  const rendaSeries: LineSeries = {
    key: "renda",
    name: "Renda",
    color: GREEN,
    points: historico.map((h, i) => ({ label: meses[i], value: h.salario })),
  };
  const gastosSeries: LineSeries = {
    key: "gastos",
    name: "Gastos",
    color: RED,
    points: historico.map((h, i) => ({ label: meses[i], value: h.total_gastos })),
  };
  const saldoPoints = historico.map((h, i) => ({ label: meses[i], value: h.salario - h.total_gastos }));

  const fundoKeys = Object.keys(historico[0]?.snapshot_fundos ?? {});
  const fundoSeries: LineSeries[] = fundoKeys.map((k, i) => ({
    key: k,
    name: k === "f1" ? "Reserva" : k === "f2" ? "Viagem" : k === "f3" ? "Aposentadoria" : k,
    color: FUND_COLORS[i % FUND_COLORS.length],
    points: historico.map((h, idx) => ({ label: meses[idx], value: h.snapshot_fundos[k] ?? 0 })),
  }));

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const rendaMedia = avg(historico.map((h) => h.salario));
  const gastosMedia = avg(historico.map((h) => h.total_gastos));
  const saldoMedio = rendaMedia - gastosMedia;
  const taxaPoupanca = rendaMedia > 0 ? Math.round((saldoMedio / rendaMedia) * 100) : 0;

  return (
    <div ref={revealRef} className="space-y-6">
      {/* Resumo — números em régua editorial, sem cards por KPI */}
      <section
        data-reveal
        style={{ "--index": 0 } as React.CSSProperties}
        className="reveal rounded-xl border border-border bg-card p-6 md:p-8"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Médias do período</p>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4 md:gap-x-8">
          <Stat label="Renda média" value={formatCurrency(rendaMedia)} accent={GREEN} />
          <Stat label="Gastos médios" value={formatCurrency(gastosMedia)} accent={AMBER} />
          <Stat label="Saldo médio" value={formatCurrency(saldoMedio)} accent={BLUE} />
          <Stat label="Taxa de poupança" value={`${taxaPoupanca}%`} accent={PURPLE} />
        </div>
      </section>

      <TrendIndicators historico={historico} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          index={2}
          eyebrow="Fluxo"
          title="Renda e gastos"
          legend={[
            { name: "Renda", color: GREEN },
            { name: "Gastos", color: RED },
          ]}
        >
          <LineChartMin series={[rendaSeries, gastosSeries]} />
        </Panel>

        <Panel index={3} eyebrow="Sobra" title="Saldo livre" meta={`${n} meses`}>
          <BarChartMin points={saldoPoints} color={BLUE} negativeColor={RED} />
        </Panel>
      </div>

      {fundoSeries.length > 0 && (
        <Panel
          index={4}
          eyebrow="Patrimônio"
          title="Evolução dos fundos"
          legend={fundoSeries.map((s) => ({ name: s.name, color: s.color }))}
        >
          <LineChartMin series={fundoSeries} height={250} />
        </Panel>
      )}

      {/* Resumo mensal — tabela editorial, só linhas divisoras */}
      <section
        data-reveal
        style={{ "--index": 5 } as React.CSSProperties}
        className="reveal rounded-xl border border-border bg-card p-6 md:p-8"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Detalhamento</p>
        <h2 className="mt-1.5 text-xl font-bold tracking-tight text-foreground">Mês a mês</h2>
        <div className="-mx-1 mt-6 overflow-x-auto px-1">
          <table className="w-full min-w-[440px] text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <th className="pb-3 pr-4 font-normal">Mês</th>
                <th className="pb-3 pr-4 text-right font-normal">Renda</th>
                <th className="pb-3 pr-4 text-right font-normal">Gastos</th>
                <th className="pb-3 text-right font-normal">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {[...historico].reverse().map((h) => {
                const saldo = h.salario - h.total_gastos;
                return (
                  <tr key={h.id} className="border-b border-border/70 last:border-0 transition-colors hover:bg-secondary/30">
                    <td className="whitespace-nowrap py-3.5 pr-4 font-medium capitalize">{formatMes(h.mes)}</td>
                    <td className="whitespace-nowrap py-3.5 pr-4 text-right font-mono text-foreground">{formatCurrency(h.salario)}</td>
                    <td className="whitespace-nowrap py-3.5 pr-4 text-right font-mono text-muted-foreground">{formatCurrency(h.total_gastos)}</td>
                    <td
                      className="whitespace-nowrap py-3.5 text-right font-mono font-medium"
                      style={{ color: saldo >= 0 ? GREEN : RED }}
                    >
                      {formatCurrency(saldo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
