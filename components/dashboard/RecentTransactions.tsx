import Link from "next/link"

interface Transaction {
  id: string
  nome: string
  valor: number
  categoria: "necessidade" | "objetivo" | "qualidade"
  data: string
}

const categoryConfig = {
  necessidade: {
    label: "Necessidade",
    emoji: "🏠",
    color: "var(--fd-amber)",
    bg: "color-mix(in srgb, var(--fd-amber) 12%, transparent)",
  },
  objetivo: {
    label: "Objetivo",
    emoji: "🎯",
    color: "var(--fd-green)",
    bg: "color-mix(in srgb, var(--fd-green) 12%, transparent)",
  },
  qualidade: {
    label: "Qualidade",
    emoji: "✨",
    color: "var(--fd-blue)",
    bg: "color-mix(in srgb, var(--fd-blue) 12%, transparent)",
  },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return "Hoje"
  if (diff === 1) return "Ontem"
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden animate-fade-up"
      style={{ animationDelay: "200ms" }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Últimas transações</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{transactions.length} registros recentes</p>
        </div>
        <Link
          href="/gastos"
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Ver todos →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma transação ainda.</p>
          <Link href="/gastos" className="text-xs text-primary mt-1 inline-block hover:underline">
            Adicionar gasto →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {transactions.map((tx, i) => {
            const cat = categoryConfig[tx.categoria]
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-5 py-3.5
                  hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]
                  transition-colors duration-150 cursor-default
                  animate-fade-up"
                style={{ animationDelay: `${220 + i * 50}ms` }}
              >
                {/* ícone categoria */}
                <div
                  className="size-9 rounded-lg flex items-center justify-center shrink-0 text-base"
                  style={{ backgroundColor: cat.bg }}
                >
                  {cat.emoji}
                </div>

                {/* nome + categoria */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.nome}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: cat.color }}>
                    {cat.label}
                  </p>
                </div>

                {/* valor + data */}
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-semibold text-[var(--fd-red)]">
                    − {tx.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(tx.data)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
