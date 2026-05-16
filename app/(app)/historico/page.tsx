import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { registrarHistoricoMensal } from "./actions"
import { HistoricoClient } from "@/components/historico/HistoricoClient"
import { IconSparkles, IconArrowRight, IconChartLine } from "@tabler/icons-react"
import type { HistoricoMensal } from "@/types"

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", user.id)
    .single()

  if (profile?.plano !== "premium") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-6">
        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
          <IconChartLine size={40} className="text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Histórico Mensal</h1>
          <p className="text-muted-foreground max-w-sm">
            O histórico mensal com gráficos de evolução é exclusivo do plano Premium.
          </p>
        </div>
        <Link
          href="/precos"
          className="group inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
        >
          <IconSparkles size={16} />
          Ver planos Premium
          <IconArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    )
  }

  // Registra snapshot do mês atual (idempotente)
  await registrarHistoricoMensal()

  const { data: historico } = await supabase
    .from("historico_mensal")
    .select("*")
    .eq("user_id", user.id)
    .order("mes", { ascending: true })

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Histórico Mensal</h1>
        <p className="text-sm text-muted-foreground">Evolução financeira ao longo do tempo</p>
      </div>
      <HistoricoClient historico={(historico ?? []) as HistoricoMensal[]} />
    </div>
  )
}
