import type { Gasto } from "@/types"
import { IconShoppingBag, IconTarget, IconSparkles } from "@tabler/icons-react"

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
    { key: "necessidade", label: "Necessidades", color: "var(--fd-amber)", icon: IconShoppingBag },
    { key: "objetivo", label: "Objetivos", color: "var(--fd-green)", icon: IconTarget },
    { key: "qualidade", label: "Qualidade de Vida", color: "var(--fd-blue)", icon: IconSparkles },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {categorias.map(({ key, label, color, icon: Icon }) => (
        <div
          key={key}
          className="group rounded-xl bg-card border border-border p-4 flex items-center gap-4 transition-all duration-200 hover:border-foreground/15 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
          style={{ borderLeftColor: color, borderLeftWidth: 3 }}
        >
          <div 
            className="size-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon size={20} style={{ color }} strokeWidth={1.5} />
          </div>
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
