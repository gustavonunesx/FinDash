import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { IconSparkles, IconTrendingUp, IconWallet, IconReceipt2, IconPigMoney } from "@tabler/icons-react"
import { UpgradeToast } from "@/components/ui/UpgradeToast"

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function pct(val: number, total: number) {
  if (total <= 0) return 0
  return Math.round((val / total) * 100)
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const { upgraded } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: config }, { data: gastos }, { data: fundos }] =
    await Promise.all([
      supabase.from("profiles").select("nome, plano").eq("id", user.id).single(),
      supabase.from("configuracoes").select("salario, renda_extra").eq("user_id", user.id).single(),
      supabase.from("gastos").select("valor, categoria").eq("user_id", user.id),
      supabase.from("fundos").select("nome, saldo_atual, meta, cor").eq("user_id", user.id).order("ordem").limit(3),
    ])

  const salario = (config?.salario ?? 0) + (config?.renda_extra ?? 0)
  const totalGastos = (gastos ?? []).reduce((s, g) => s + g.valor, 0)
  const saldoLivre = salario - totalGastos

  const necessidades = (gastos ?? []).filter((g) => g.categoria === "necessidade").reduce((s, g) => s + g.valor, 0)
  const objetivos = (gastos ?? []).filter((g) => g.categoria === "objetivo").reduce((s, g) => s + g.valor, 0)

  const primeiroNome = (profile?.nome ?? user.email ?? "").split(" ")[0]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {upgraded === "1" && <UpgradeToast />}
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Olá, {primeiroNome} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Aqui está seu resumo financeiro</p>
      </div>

      {/* Premium banner */}
      {profile?.plano === "free" && (
        <Link
          href="/precos"
          className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 hover:bg-primary/15 transition-colors"
        >
          <IconSparkles size={18} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Desbloqueie o histórico mensal</p>
            <p className="text-xs text-muted-foreground">Acesse gráficos e relatórios com o Premium</p>
          </div>
          <span className="text-xs text-primary font-medium shrink-0">Ver planos →</span>
        </Link>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Renda total"
          value={fmt(salario)}
          icon={<IconWallet size={18} className="text-fd-green" />}
          color="var(--fd-green)"
        />
        <SummaryCard
          label="Total de gastos"
          value={fmt(totalGastos)}
          icon={<IconReceipt2 size={18} className="text-fd-amber" />}
          color="var(--fd-amber)"
        />
        <SummaryCard
          label="Saldo livre"
          value={fmt(saldoLivre)}
          icon={<IconTrendingUp size={18} className={saldoLivre >= 0 ? "text-fd-green" : "text-fd-red"} />}
          color={saldoLivre >= 0 ? "var(--fd-green)" : "var(--fd-red)"}
        />
      </div>

      {/* Category quick stats */}
      {salario > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Distribuição dos gastos</h2>
          <CategoryBar
            label="Necessidades"
            valor={necessidades}
            salario={salario}
            limite={50}
            color="var(--fd-amber)"
          />
          <CategoryBar
            label="Objetivos"
            valor={objetivos}
            salario={salario}
            limite={30}
            color="var(--fd-green)"
          />
        </div>
      )}

      {/* Mini fund list */}
      {(fundos ?? []).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Fundos</h2>
            <Link href="/fundos" className="text-xs text-primary hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {(fundos ?? []).map((f) => {
              const progresso = f.meta > 0 ? Math.min((f.saldo_atual / f.meta) * 100, 100) : 0
              return (
                <div key={f.nome} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full" style={{ backgroundColor: f.cor }} />
                      <span className="text-foreground">{f.nome}</span>
                    </div>
                    <span className="font-mono text-muted-foreground text-xs">
                      {fmt(f.saldo_atual)} / {fmt(f.meta)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progresso}%`, backgroundColor: f.cor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state: no config */}
      {salario === 0 && (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <IconPigMoney size={36} className="text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Configure seu salário na{" "}
            <Link href="/calculadora" className="text-primary hover:underline">
              Calculadora
            </Link>{" "}
            para ver seu resumo.
          </p>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon, color }: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div
      className="rounded-lg bg-card border border-border p-4 flex items-center gap-3"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-lg font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

function CategoryBar({ label, valor, salario, limite, color }: {
  label: string
  valor: number
  salario: number
  limite: number
  color: string
}) {
  const percentual = pct(valor, salario)
  const excede = percentual > limite

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={excede ? "font-medium" : "text-muted-foreground"} style={excede ? { color: "var(--fd-red)" } : {}}>
          {percentual}% / {limite}% limite
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(percentual, 100)}%`,
            backgroundColor: excede ? "var(--fd-red)" : color,
          }}
        />
      </div>
    </div>
  )
}
