import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { IconSparkles, IconTrendingUp, IconWallet, IconReceipt2, IconPigMoney, IconArrowRight } from "@tabler/icons-react"
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
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Olá, {primeiroNome}
        </h1>
        <p className="text-sm text-muted-foreground">Aqui está seu resumo financeiro</p>
      </div>

      {/* Premium banner */}
      {profile?.plano === "free" && (
        <Link
          href="/precos"
          className="group flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3.5 hover:border-primary/30 hover:from-primary/15 hover:to-primary/10 transition-all duration-200"
        >
          <div className="size-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <IconSparkles size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Desbloqueie o histórico mensal</p>
            <p className="text-xs text-muted-foreground">Acesse gráficos e relatórios com o Premium</p>
          </div>
          <span className="text-xs text-primary font-medium shrink-0 flex items-center gap-1 group-hover:gap-2 transition-all">
            Ver planos
            <IconArrowRight size={14} />
          </span>
        </Link>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Renda total"
          value={fmt(salario)}
          icon={<IconWallet size={20} strokeWidth={1.5} />}
          colorClass="text-fd-green"
          borderColor="var(--fd-green)"
        />
        <SummaryCard
          label="Total de gastos"
          value={fmt(totalGastos)}
          icon={<IconReceipt2 size={20} strokeWidth={1.5} />}
          colorClass="text-fd-amber"
          borderColor="var(--fd-amber)"
        />
        <SummaryCard
          label="Saldo livre"
          value={fmt(saldoLivre)}
          icon={<IconTrendingUp size={20} strokeWidth={1.5} />}
          colorClass={saldoLivre >= 0 ? "text-fd-green" : "text-fd-red"}
          borderColor={saldoLivre >= 0 ? "var(--fd-green)" : "var(--fd-red)"}
        />
      </div>

      {/* Category quick stats */}
      {salario > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 transition-all hover:border-foreground/10">
          <h2 className="text-sm font-semibold text-foreground">Distribuição dos gastos</h2>
          <div className="space-y-4">
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
        </div>
      )}

      {/* Mini fund list */}
      {(fundos ?? []).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 transition-all hover:border-foreground/10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Fundos</h2>
            <Link href="/fundos" className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group">
              Ver todos
              <IconArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="space-y-4">
            {(fundos ?? []).map((f) => {
              const progresso = f.meta > 0 ? Math.min((f.saldo_atual / f.meta) * 100, 100) : 0
              return (
                <div key={f.nome} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full ring-2 ring-offset-2 ring-offset-card" style={{ backgroundColor: f.cor, boxShadow: `0 0 8px ${f.cor}40` }} />
                      <span className="text-foreground font-medium">{f.nome}</span>
                    </div>
                    <span className="font-mono text-muted-foreground text-xs">
                      {fmt(f.saldo_atual)} / {fmt(f.meta)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-full progress-animate"
                      style={{ 
                        width: `${progresso}%`, 
                        backgroundColor: f.cor,
                        boxShadow: `0 0 12px ${f.cor}40`
                      }}
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
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="size-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <IconPigMoney size={28} className="text-muted-foreground/60" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">Configure seu salário</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Para ver seu resumo financeiro completo
          </p>
          <Link 
            href="/calculadora" 
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Ir para Calculadora
            <IconArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon, colorClass, borderColor }: {
  label: string
  value: string
  icon: React.ReactNode
  colorClass: string
  borderColor: string
}) {
  return (
    <div
      className="group rounded-xl bg-card border border-border p-4 flex items-center gap-3 transition-all duration-200 hover:border-foreground/15 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
      style={{ borderLeftColor: borderColor, borderLeftWidth: 3 }}
    >
      <div className={`shrink-0 ${colorClass}`}>{icon}</div>
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
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span 
          className={excede ? "font-semibold" : "text-muted-foreground"} 
          style={excede ? { color: "var(--fd-red)" } : {}}
        >
          {percentual}% / {limite}% limite
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full progress-animate"
          style={{
            width: `${Math.min(percentual, 100)}%`,
            backgroundColor: excede ? "var(--fd-red)" : color,
            boxShadow: `0 0 8px ${excede ? "var(--fd-red)" : color}30`
          }}
        />
      </div>
    </div>
  )
}
