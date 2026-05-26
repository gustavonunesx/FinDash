"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { IconChartLine, IconTrendingUp, IconTrendingDown, IconMinus } from "@tabler/icons-react"
import type { HistoricoMensal } from "@/types"

interface GastoItem {
  valor: number
  categoria: string
  created_at: string
}

interface Props {
  historico: HistoricoMensal[]
  gastosRecentes: GastoItem[]
}

function fmtMes(mesStr: string) {
  const [year, month] = mesStr.split("-")
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  return `${meses[parseInt(month) - 1]}/${year.slice(2)}`
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function agruparGastosPorMes(gastos: GastoItem[]) {
  const now = new Date()
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    months.push(key)
  }

  const map: Record<string, { necessidade: number; objetivo: number; qualidade: number }> = {}
  for (const key of months) map[key] = { necessidade: 0, objetivo: 0, qualidade: 0 }

  for (const g of gastos) {
    const d = new Date(g.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (map[key] && (g.categoria === "necessidade" || g.categoria === "objetivo" || g.categoria === "qualidade")) {
      map[key][g.categoria as "necessidade" | "objetivo" | "qualidade"] += g.valor
    }
  }

  return months.map((key) => ({
    mes: fmtMes(key + "-01"),
    mesKey: key,
    ...map[key],
    total: map[key].necessidade + map[key].objetivo + map[key].qualidade,
  }))
}

function calcTrend(atual: number, anterior: number) {
  if (anterior === 0) return null
  const pct = ((atual - anterior) / anterior) * 100
  return { pct: Math.abs(pct), up: pct > 0 }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm px-4 py-3 text-xs shadow-premium">
      <p className="font-medium text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <span className="font-mono font-medium">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

function TrendBadge({ label, atual, anterior, color }: { label: string; atual: number; anterior: number; color: string }) {
  const trend = calcTrend(atual, anterior)
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-2">
      <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs text-muted-foreground">{label}:</span>
      {trend === null ? (
        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <IconMinus size={12} />
          <span>—</span>
        </span>
      ) : trend.up ? (
        <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color: "var(--fd-red)" }}>
          <IconTrendingUp size={12} />
          +{trend.pct.toFixed(0)}%
        </span>
      ) : (
        <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color: "var(--fd-green)" }}>
          <IconTrendingDown size={12} />
          -{trend.pct.toFixed(0)}%
        </span>
      )}
    </div>
  )
}

export function HistoricoClient({ historico, gastosRecentes }: Props) {
  const comparativo = agruparGastosPorMes(gastosRecentes)
  const hasComparativo = comparativo.some((m) => m.total > 0)
  const penultimo = comparativo[comparativo.length - 2]
  const ultimo = comparativo[comparativo.length - 1]

  if (historico.length === 0 && !hasComparativo) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
        <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <IconChartLine size={28} className="text-muted-foreground/60" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">Nenhum dado ainda</h3>
        <p className="text-muted-foreground text-sm">
          Volte no próximo mês para ver sua evolução financeira.
        </p>
      </div>
    )
  }

  const data = historico.map((h) => ({
    mes: fmtMes(h.mes),
    salario: h.salario ?? 0,
    gastos: h.total_gastos ?? 0,
    saldo: (h.salario ?? 0) - (h.total_gastos ?? 0),
    poupanca: calcPoupanca(h),
  }))

  return (
    <div className="space-y-6">
      {/* Linha: evolução de renda vs gastos */}
      {historico.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/10">
          <h2 className="text-sm font-semibold text-foreground mb-5">Renda vs Gastos</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                width={52}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={{ stroke: "var(--border)" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
              <Line
                type="monotone"
                dataKey="salario"
                name="Renda"
                stroke="var(--fd-green)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--fd-green)", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "var(--fd-green)", stroke: "var(--background)", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="gastos"
                name="Gastos"
                stroke="var(--fd-amber)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--fd-amber)", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "var(--fd-amber)", stroke: "var(--background)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Barras agrupadas: comparativo por categoria (últimos 6 meses) */}
      <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/10">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Gastos por Categoria</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Comparativo dos últimos 6 meses</p>
          </div>
        </div>

        {hasComparativo ? (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={comparativo} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
                  width={52}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={{ stroke: "var(--border)" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                <Bar dataKey="necessidade" name="Necessidades" fill="var(--fd-amber)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="objetivo" name="Objetivos" fill="var(--fd-green)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="qualidade" name="Qualidade" fill="var(--fd-blue)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {penultimo && ultimo && (
              <div className="mt-4 flex flex-wrap gap-2">
                <TrendBadge label="Necessidades" atual={ultimo.necessidade} anterior={penultimo.necessidade} color="var(--fd-amber)" />
                <TrendBadge label="Objetivos" atual={ultimo.objetivo} anterior={penultimo.objetivo} color="var(--fd-green)" />
                <TrendBadge label="Qualidade" atual={ultimo.qualidade} anterior={penultimo.qualidade} color="var(--fd-blue)" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhum gasto registrado nos últimos 6 meses.</p>
          </div>
        )}
      </div>

      {/* Barra: saldo livre por mês */}
      {historico.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/10">
          <h2 className="text-sm font-semibold text-foreground mb-5">Saldo Livre por Mês</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                width={52}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={{ stroke: "var(--border)" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="saldo"
                name="Saldo livre"
                fill="var(--fd-blue)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela resumo */}
      {historico.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-foreground/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Mês</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Renda</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Gastos</th>
                <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-foreground">{row.mes}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-fd-green">{fmt(row.salario)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-fd-amber">{fmt(row.gastos)}</td>
                  <td
                    className="px-4 py-3.5 text-right font-mono font-semibold"
                    style={{ color: row.saldo >= 0 ? "var(--fd-green)" : "var(--fd-red)" }}
                  >
                    {fmt(row.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function calcPoupanca(h: HistoricoMensal): number {
  if (!h.snapshot_fundos) return 0
  return (h.snapshot_fundos as any[]).reduce((s: number, f: any) => s + (f.saldo_atual ?? 0), 0)
}
