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
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

export function HistoricoClient({ historico }: Props) {
  if (historico.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Nenhum dado ainda. Volte no próximo mês para ver sua evolução.
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
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Renda vs Gastos</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="salario"
              name="Renda"
              stroke="var(--fd-green)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="gastos"
              name="Gastos"
              stroke="var(--fd-amber)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Barra: saldo livre por mês */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">Saldo Livre por Mês</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="saldo"
              name="Saldo livre"
              fill="var(--fd-blue)"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela resumo */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Mês</th>
              <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Renda</th>
              <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Gastos</th>
              <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-medium text-foreground">{row.mes}</td>
                <td className="px-4 py-2.5 text-right font-mono text-fd-green">{fmt(row.salario)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-fd-amber">{fmt(row.gastos)}</td>
                <td
                  className="px-4 py-2.5 text-right font-mono font-medium"
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
