import type { Gasto } from "@/types"

interface Props {
  gastos: Gasto[]
}

export function CategoryTotals({ gastos }: Props) {
  const totais = gastos.reduce(
    (acc, g) => {
      acc[g.categoria] = (acc[g.categoria] ?? 0) + g.valor
      return acc
    },
    {} as Record<string, number>
  )

  const categorias = [
    { key: "necessidade", label: "Necessidades", color: "var(--fd-amber)" },
    { key: "objetivo", label: "Objetivos", color: "var(--fd-green)" },
    { key: "qualidade", label: "Qualidade de Vida", color: "var(--fd-blue)" },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {categorias.map(({ key, label, color }) => (
        <div
          key={key}
          className="rounded-lg bg-card border border-border p-4 flex items-center gap-4"
          style={{ borderLeftColor: color, borderLeftWidth: 3 }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="font-mono text-lg font-semibold text-foreground mt-0.5">
              {(totais[key] ?? 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
