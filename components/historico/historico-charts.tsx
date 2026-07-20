"use client";

import {
  IconTrendingUp,
  IconArrowsExchange,
  IconWallet,
  IconPigMoney,
  IconChartLine,
  IconChartBar,
  IconStack2,
  IconTable,
} from "@tabler/icons-react";
import type { HistoricoMensal } from "@/lib/types";
import { formatCurrency, handleCardGlow } from "@/lib/utils";
import { TrendIndicators } from "@/components/historico/trend-indicators";
import { AreaLineChart, BarChart, type LineSeries } from "@/components/historico/svg-charts";

interface HistoricoChartsProps {
  historico: HistoricoMensal[];
}

function formatMes(mes: string) {
  const d = new Date(mes);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

const GREEN = "var(--color-fd-green)";
const RED = "var(--color-fd-red)";
const BLUE = "var(--color-fd-blue)";
const PURPLE = "var(--color-fd-purple)";
const AMBER = "var(--color-fd-amber)";
const FUND_COLORS = [GREEN, BLUE, PURPLE, AMBER];

interface ChartCardProps {
  icon: React.ReactNode;
  iconColor: "green" | "blue" | "purple" | "amber";
  title: string;
  subtitle: string;
  legend?: { name: string; color: string }[];
  children: React.ReactNode;
}

const iconChip: Record<string, string> = {
  green: "bg-fd-green/10 text-fd-green",
  blue: "bg-fd-blue/10 text-fd-blue",
  purple: "bg-fd-purple/10 text-fd-purple",
  amber: "bg-fd-amber/10 text-fd-amber",
};

function ChartCard({ icon, iconColor, title, subtitle, legend, children }: ChartCardProps) {
  return (
    <div
      className="card-glow group rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:p-6"
      onMouseMove={handleCardGlow}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconChip[iconColor]}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {legend && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {legend.map((l) => (
              <span key={l.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

interface KpiTileProps {
  icon: React.ReactNode;
  color: "green" | "blue" | "amber" | "purple";
  label: string;
  value: string;
}

function KpiTile({ icon, color, label, value }: KpiTileProps) {
  return (
    <div
      className="card-glow rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      onMouseMove={handleCardGlow}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconChip[color]}`}>{icon}</div>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold tracking-tight text-foreground md:text-2xl">{value}</p>
    </div>
  );
}

export function HistoricoCharts({ historico }: HistoricoChartsProps) {
  const meses = historico.map((h) => formatMes(h.mes));
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

  const saldoPoints = historico.map((h, i) => ({
    label: meses[i],
    value: h.salario - h.total_gastos,
  }));

  const fundoKeys = Object.keys(historico[0]?.snapshot_fundos ?? {});
  const fundoSeries: LineSeries[] = fundoKeys.map((k, i) => ({
    key: k,
    name: k === "f1" ? "Reserva" : k === "f2" ? "Viagem" : k === "f3" ? "Aposentadoria" : k,
    color: FUND_COLORS[i % FUND_COLORS.length],
    points: historico.map((h, idx) => ({ label: meses[idx], value: h.snapshot_fundos[k] ?? 0 })),
  }));

  // KPIs — médias reais dos meses
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const rendaMedia = avg(historico.map((h) => h.salario));
  const gastosMedia = avg(historico.map((h) => h.total_gastos));
  const saldoMedio = rendaMedia - gastosMedia;
  const taxaPoupanca = rendaMedia > 0 ? Math.round((saldoMedio / rendaMedia) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile icon={<IconWallet className="h-5 w-5" />} color="green" label="Renda média" value={formatCurrency(rendaMedia)} />
        <KpiTile icon={<IconArrowsExchange className="h-5 w-5" />} color="amber" label="Gastos médios" value={formatCurrency(gastosMedia)} />
        <KpiTile icon={<IconPigMoney className="h-5 w-5" />} color="blue" label="Saldo médio" value={formatCurrency(saldoMedio)} />
        <KpiTile icon={<IconTrendingUp className="h-5 w-5" />} color="purple" label="Taxa de poupança" value={`${taxaPoupanca}%`} />
      </div>

      <TrendIndicators historico={historico} />

      {/* Renda vs Gastos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          icon={<IconChartLine className="h-5 w-5" />}
          iconColor="green"
          title="Renda vs. Gastos"
          subtitle={`Últimos ${n} meses`}
          legend={[
            { name: "Renda", color: GREEN },
            { name: "Gastos", color: RED },
          ]}
        >
          <AreaLineChart series={[rendaSeries, gastosSeries]} />
        </ChartCard>

        <ChartCard
          icon={<IconChartBar className="h-5 w-5" />}
          iconColor="blue"
          title="Saldo livre mensal"
          subtitle="Renda menos gastos por mês"
        >
          <BarChart points={saldoPoints} color={BLUE} negativeColor={RED} />
        </ChartCard>
      </div>

      {/* Fundos */}
      {fundoSeries.length > 0 && (
        <ChartCard
          icon={<IconStack2 className="h-5 w-5" />}
          iconColor="purple"
          title="Evolução dos fundos"
          subtitle="Saldo acumulado por fundo"
          legend={fundoSeries.map((s) => ({ name: s.name, color: s.color }))}
        >
          <AreaLineChart series={fundoSeries} height={260} />
        </ChartCard>
      )}

      {/* Resumo mensal */}
      <ChartCard
        icon={<IconTable className="h-5 w-5" />}
        iconColor="green"
        title="Resumo mensal"
        subtitle="Detalhamento mês a mês"
      >
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[440px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Mês</th>
                <th className="pb-3 pr-4 text-right font-medium">Renda</th>
                <th className="pb-3 pr-4 text-right font-medium">Gastos</th>
                <th className="pb-3 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {[...historico].reverse().map((h) => {
                const saldo = h.salario - h.total_gastos;
                return (
                  <tr key={h.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-secondary/40">
                    <td className="whitespace-nowrap py-3 pr-4 font-medium capitalize">{formatMes(h.mes)}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-right font-mono">{formatCurrency(h.salario)}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-right font-mono text-fd-red">{formatCurrency(h.total_gastos)}</td>
                    <td className={`whitespace-nowrap py-3 text-right font-mono font-semibold ${saldo >= 0 ? "text-fd-green" : "text-fd-red"}`}>
                      {formatCurrency(saldo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
