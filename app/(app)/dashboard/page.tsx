import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { UpgradeToast } from "@/components/ui/UpgradeToast"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { Rule502030 } from "@/components/dashboard/Rule502030"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import {
  IconWallet,
  IconReceipt2,
  IconPigMoney,
  IconChartPie,
  IconSparkles,
  IconArrowRight,
} from "@tabler/icons-react"

function getGreeting(nome: string) {
  const h = new Date().getHours()
  const period = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"
  return `${period}, ${nome}`
}

function scoreLabel(nec: number, obj: number, sal: number): { text: string; variant: "success" | "warning" | "danger" } {
  if (sal === 0) return { text: "Configure renda", variant: "warning" }
  const necPct = (nec / sal) * 100
  const objPct = (obj / sal) * 100
  if (necPct <= 50 && objPct >= 30) return { text: "No caminho certo", variant: "success" }
  if (necPct <= 55) return { text: "Atenção", variant: "warning" }
  return { text: "Revise os gastos", variant: "danger" }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const { upgraded } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: config }, { data: gastos }, { data: fundos }] =
    await Promise.all([
      supabase.from("profiles").select("nome, plano").eq("id", user.id).single(),
      supabase.from("configuracoes").select("salario, renda_extra").eq("user_id", user.id).single(),
      supabase
        .from("gastos")
        .select("id, nome, valor, categoria, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("fundos")
        .select("nome, saldo_atual, meta, cor")
        .eq("user_id", user.id)
        .order("ordem")
        .limit(3),
    ])

  const salario = (config?.salario ?? 0) + (config?.renda_extra ?? 0)
  const allGastos = gastos ?? []
  const totalGastos = allGastos.reduce((s, g) => s + g.valor, 0)
  const saldoLivre = salario - totalGastos

  const necessidades = allGastos
    .filter((g) => g.categoria === "necessidade")
    .reduce((s, g) => s + g.valor, 0)
  const objetivos = allGastos
    .filter((g) => g.categoria === "objetivo")
    .reduce((s, g) => s + g.valor, 0)
  const qualidade = allGastos
    .filter((g) => g.categoria === "qualidade")
    .reduce((s, g) => s + g.valor, 0)

  const fundosAtivos = (fundos ?? []).length
  const primeiroNome = (profile?.nome ?? user.email ?? "").split(" ")[0]

  const score = scoreLabel(necessidades, objetivos, salario)
  const scorePct =
    salario > 0
      ? Math.max(
          0,
          100 -
            Math.abs((necessidades / salario) * 100 - 50) -
            Math.abs((objetivos / salario) * 100 - 30)
        )
      : 0

  const gastosProgressPct = salario > 0 ? Math.min((totalGastos / salario) * 100, 100) : 0
  const fundosProgressPct = Math.min((fundosAtivos / 3) * 100, 100)

  const recentTransactions = allGastos.slice(0, 6).map((g) => ({
    id: g.id,
    nome: g.nome,
    valor: g.valor,
    categoria: g.categoria as "necessidade" | "objetivo" | "qualidade",
    data: g.created_at,
  }))

  const metrics = [
    {
      label: "Saldo livre",
      value: Math.max(saldoLivre, 0),
      formatted: saldoLivre.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: <IconWallet size={18} style={{ color: "var(--fd-green)" }} />,
      accentColor: "var(--fd-green)",
      badge:
        salario > 0
          ? {
              text: `${Math.round(((salario - totalGastos) / salario) * 100)}% livre`,
              variant: saldoLivre >= 0 ? ("success" as const) : ("danger" as const),
            }
          : undefined,
      progress: salario > 0 ? Math.round(((salario - totalGastos) / salario) * 100) : undefined,
    },
    {
      label: "Gastos do mês",
      value: totalGastos,
      formatted: totalGastos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: <IconReceipt2 size={18} style={{ color: "var(--fd-amber)" }} />,
      accentColor: "var(--fd-amber)",
      badge:
        salario > 0
          ? {
              text: `${Math.round(gastosProgressPct)}% da renda`,
              variant: gastosProgressPct > 90 ? ("danger" as const) : ("neutral" as const),
            }
          : undefined,
      progress: gastosProgressPct,
    },
    {
      label: "Fundos ativos",
      value: fundosAtivos,
      formatted: String(fundosAtivos),
      icon: <IconPigMoney size={18} style={{ color: "var(--fd-blue)" }} />,
      accentColor: "var(--fd-blue)",
      badge:
        fundosAtivos > 0
          ? { text: `${fundosAtivos} de 3`, variant: "info" as const }
          : { text: "Nenhum ainda", variant: "neutral" as const },
      progress: fundosProgressPct,
    },
    {
      label: "Score 50/30/20",
      value: Math.round(scorePct),
      formatted: `${Math.round(scorePct)}`,
      icon: (
        <IconChartPie
          size={18}
          style={{
            color:
              score.variant === "success"
                ? "var(--fd-green)"
                : score.variant === "warning"
                  ? "var(--fd-amber)"
                  : "var(--fd-red)",
          }}
        />
      ),
      accentColor:
        score.variant === "success"
          ? "var(--fd-green)"
          : score.variant === "warning"
            ? "var(--fd-amber)"
            : "var(--fd-red)",
      badge: { text: score.text, variant: score.variant },
      progress: Math.round(scorePct),
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {upgraded === "1" && <UpgradeToast />}

      {/* Greeting */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {getGreeting(primeiroNome)} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Premium banner */}
      {profile?.plano === "free" && (
        <Link
          href="/precos"
          className="group flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3.5 hover:border-primary/30 hover:from-primary/15 hover:to-primary/10 transition-all duration-200 animate-fade-up"
          style={{ animationDelay: "40ms" }}
        >
          <div className="size-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <IconSparkles size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Desbloqueie o histórico mensal</p>
            <p className="text-xs text-muted-foreground mt-0.5">Gráficos, relatórios e exportação PDF com o Premium</p>
          </div>
          <span className="text-xs text-primary font-medium shrink-0 flex items-center gap-1 group-hover:gap-2 transition-all">
            Ver planos
            <IconArrowRight size={14} />
          </span>
        </Link>
      )}

      {/* Metric cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <MetricCard key={m.label} {...m} index={i} />
        ))}
      </div>

      {/* Regra 50/30/20 */}
      <Rule502030
        necessidades={necessidades}
        objetivos={objetivos}
        qualidade={qualidade}
        salario={salario}
      />

      {/* Últimas transações */}
      <RecentTransactions transactions={recentTransactions} />

      {/* Empty state */}
      {salario === 0 && allGastos.length === 0 && (
        <div
          className="rounded-xl border border-border bg-card p-8 text-center animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <IconPigMoney size={28} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Comece configurando sua renda</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Configure seu salário para ver seu resumo financeiro completo.
          </p>
          <Link
            href="/calculadora"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary
              border border-primary/30 rounded-lg px-4 py-2 hover:bg-primary/10 transition-colors"
          >
            Ir para Calculadora →
          </Link>
        </div>
      )}
    </div>
  )
}
