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
import { IconChartLine } from "@tabler/icons-react"
import type { HistoricoMensal } from "@/types"

interface Props {
  historico: HistoricoMensal[]
}

function fmtMes(mesStr: string) {
  const [year, month] = mesStr.split("-")
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  return `${meses[parseInt(month) - 1]}/${year.slice(2)}`
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
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

export function HistoricoClient({ historico }: Props) {
  if (historico.length === 0) {
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

      {/* Barra: saldo livre por mês */}
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

      {/* Tabela resumo */}
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
    </div>
  )
}

function calcPoupanca(h: HistoricoMensal): number {
  if (!h.snapshot_fundos) return 0
  return (h.snapshot_fundos as any[]).reduce((s: number, f: any) => s + (f.saldo_atual ?? 0), 0)
}
