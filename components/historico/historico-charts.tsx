"use client";

import { useEffect, useRef } from "react";
import type { HistoricoMensal, RendaExtraItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { LineChartMin, BarChartMin, Sparkline, type LineSeries } from "@/components/historico/svg-charts-min";
import { KpiCard } from "@/components/historico/kpi-card";
import { ProgressRing } from "@/components/historico/progress-ring";
import {
  IconWallet,
  IconReceipt2,
  IconPigMoney,
  IconTrendingUp,
  IconCalendarStats,
  IconGift,
  IconArrowUpRight,
} from "@tabler/icons-react";

interface HistoricoChartsProps {
  historico: HistoricoMensal[];
  rendaExtra: RendaExtraItem[];
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
  icon: Icon,
  iconColor,
  title,
  meta,
  legend,
  children,
}: {
  index: number;
  icon: React.ComponentType<{ size?: number; stroke?: number; color?: string }>;
  iconColor: string;
  title: string;
  meta?: string;
  legend?: { name: string; color: string }[];
  children: React.ReactNode;
}) {
  return (
    <section
      data-reveal
      style={{ "--index": index } as React.CSSProperties}
      className="reveal rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow)] transition-all duration-300 hover:-translate-y-1 md:p-7"
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${iconColor}26` }}>
            <Icon size={19} stroke={2} color={iconColor} />
          </span>
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">{title}</h2>
        </div>
        {legend ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {legend.map((l) => (
              <span key={l.name} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                {l.name}
              </span>
            ))}
          </div>
        ) : meta ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">{meta}</span>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function HistoricoCharts({ historico, rendaExtra }: HistoricoChartsProps) {
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
  const saldoSerie = historico.map((h) => h.salario - h.total_gastos);

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

  const hasTrend = n >= 2;
  const atual = historico[n - 1];
  const anterior = hasTrend ? historico[n - 2] : null;
  const trend = (curr: number, prev: number | null) => {
    if (prev === null || prev === 0) return undefined;
    return Math.round(((curr - prev) / prev) * 100);
  };
  const rendaTrend = anterior ? trend(atual.salario, anterior.salario) : undefined;
  const gastosTrend = anterior ? trend(atual.total_gastos, anterior.total_gastos) : undefined;
  const saldoAtual = atual.salario - atual.total_gastos;
  const saldoAnterior = anterior ? anterior.salario - anterior.total_gastos : null;
  const saldoTrend = anterior ? trend(saldoAtual, saldoAnterior) : undefined;

  const totalFundos = fundoSeries.reduce((sum, s) => sum + (s.points[n - 1]?.value ?? 0), 0);
  const gastosVsRenda = atual.salario > 0 ? Math.round((atual.total_gastos / atual.salario) * 100) : 0;

  const primeiroMes = new Date(historico[0].mes);
  const rendaExtraPeriodo = rendaExtra
    .filter((r) => new Date(r.created_at) >= primeiroMes)
    .reduce((sum, r) => sum + r.valor, 0);

  const crescimentoFundos = fundoSeries.reduce((sum, s) => {
    const primeiro = s.points[0]?.value ?? 0;
    const ultimo = s.points[n - 1]?.value ?? 0;
    return sum + (ultimo - primeiro);
  }, 0);

  return (
    <div ref={revealRef} className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard
          index={0}
          icon={IconWallet}
          iconColor={GREEN}
          label="Renda"
          value={formatCurrency(atual.salario)}
          trendPct={rendaTrend}
          trendPositive={rendaTrend !== undefined ? rendaTrend >= 0 : undefined}
        />
        <KpiCard
          index={1}
          icon={IconReceipt2}
          iconColor={AMBER}
          label="Gastos"
          value={formatCurrency(atual.total_gastos)}
          trendPct={gastosTrend}
          trendPositive={gastosTrend !== undefined ? gastosTrend < 0 : undefined}
        />
        <KpiCard
          index={2}
          icon={IconPigMoney}
          iconColor={BLUE}
          label="Saldo livre"
          value={formatCurrency(saldoAtual)}
          trendPct={saldoTrend}
          trendPositive={saldoTrend !== undefined ? saldoTrend >= 0 : undefined}
        />
        <KpiCard
          index={3}
          icon={IconTrendingUp}
          iconColor={PURPLE}
          label="Patrimônio em fundos"
          value={formatCurrency(totalFundos)}
        />
        <KpiCard
          index={4}
          icon={IconGift}
          iconColor={GREEN}
          label="Renda extra (período)"
          value={formatCurrency(rendaExtraPeriodo)}
        />
        <KpiCard
          index={5}
          icon={IconArrowUpRight}
          iconColor={AMBER}
          label="Crescimento em fundos"
          value={formatCurrency(crescimentoFundos)}
        />
      </div>

      <section
        data-reveal
        style={{ "--index": 6 } as React.CSSProperties}
        className="reveal grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow)] sm:grid-cols-2 md:p-7"
      >
        <ProgressRing
          value={taxaPoupanca}
          max={100}
          color={BLUE}
          label="Taxa de poupança média"
          centerValue={`${taxaPoupanca}%`}
        />
        <ProgressRing
          value={gastosVsRenda}
          max={100}
          color={AMBER}
          label="Gastos sobre a renda (mês atual)"
          centerValue={`${gastosVsRenda}%`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          index={7}
          icon={IconTrendingUp}
          iconColor={GREEN}
          title="Renda e gastos"
          legend={[
            { name: "Renda", color: GREEN },
            { name: "Gastos", color: RED },
          ]}
        >
          <LineChartMin series={[rendaSeries, gastosSeries]} />
        </Panel>

        <Panel index={8} icon={IconPigMoney} iconColor={BLUE} title="Saldo livre" meta={`${n} meses`}>
          <BarChartMin points={saldoPoints} color={BLUE} negativeColor={RED} />
        </Panel>
      </div>

      {fundoSeries.length > 0 && (
        <Panel
          index={9}
          icon={IconCalendarStats}
          iconColor={PURPLE}
          title="Evolução dos fundos"
          legend={fundoSeries.map((s) => ({ name: s.name, color: s.color }))}
        >
          <LineChartMin series={fundoSeries} height={250} />
        </Panel>
      )}

      <section
        data-reveal
        style={{ "--index": 10 } as React.CSSProperties}
        className="reveal rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow)] md:p-7"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${BLUE}26` }}>
            <IconCalendarStats size={19} stroke={2} color={BLUE} />
          </span>
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">Mês a mês</h2>
        </div>
        <div className="-mx-1 mt-6 overflow-x-auto px-1">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4 font-bold">Mês</th>
                <th className="pb-3 pr-4 text-right font-bold">Renda</th>
                <th className="pb-3 pr-4 text-right font-bold">Gastos</th>
                <th className="pb-3 pr-4 text-right font-bold">Saldo</th>
                <th className="pb-3 text-right font-bold">Tendência</th>
              </tr>
            </thead>
            <tbody>
              {[...historico].reverse().map((h, revIdx) => {
                const saldo = h.salario - h.total_gastos;
                const idx = n - 1 - revIdx;
                const janela = saldoSerie.slice(Math.max(0, idx - 4), idx + 1);
                return (
                  <tr key={h.id} className="border-b border-border/70 last:border-0 transition-colors hover:bg-muted/40">
                    <td className="whitespace-nowrap py-3.5 pr-4 font-bold capitalize">{formatMes(h.mes)}</td>
                    <td className="whitespace-nowrap py-3.5 pr-4 text-right font-mono text-foreground">{formatCurrency(h.salario)}</td>
                    <td className="whitespace-nowrap py-3.5 pr-4 text-right font-mono text-muted-foreground">{formatCurrency(h.total_gastos)}</td>
                    <td
                      className="whitespace-nowrap py-3.5 pr-4 text-right font-mono font-bold"
                      style={{ color: saldo >= 0 ? GREEN : RED }}
                    >
                      {formatCurrency(saldo)}
                    </td>
                    <td className="py-3.5">
                      <div className="flex justify-end">
                        <Sparkline points={janela} color={saldo >= 0 ? GREEN : RED} />
                      </div>
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
