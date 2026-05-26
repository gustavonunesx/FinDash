import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GastosTable } from "@/components/gastos/GastosTable"
import { CategoryTotals } from "@/components/gastos/CategoryTotals"
import { RecorrentesAlert } from "@/components/gastos/RecorrentesAlert"

export default async function GastosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: gastos }, { data: profile }] = await Promise.all([
    supabase
      .from("gastos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("plano")
      .eq("id", user.id)
      .single(),
  ])

  const lista = gastos ?? []
  const plano = profile?.plano ?? "free"

  // Gastos recorrentes (templates) + detecção de confirmados este mês
  const templates = lista.filter((g) => g.recorrente)
  const gastosEsteMes = lista.filter(
    (g) => !g.recorrente && g.created_at >= inicioMes
  )
  const nomesConfirmados = new Set(gastosEsteMes.map((g) => g.nome.toLowerCase()))

  const recorrentesComStatus = templates.map((t) => ({
    id: t.id,
    nome: t.nome,
    valor: t.valor,
    categoria: t.categoria,
    dia_recorrencia: t.dia_recorrencia ?? null,
    confirmadoEsteMes: nomesConfirmados.has(t.nome.toLowerCase()),
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Gastos mensais</h1>
        <p className="text-sm text-muted-foreground">
          Seus gastos organizados por categoria
        </p>
      </div>

      {recorrentesComStatus.length > 0 && (
        <RecorrentesAlert recorrentes={recorrentesComStatus} />
      )}

      <CategoryTotals gastos={lista} />

      <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/10">
        <GastosTable gastos={lista} plano={plano as "free" | "premium"} />
      </div>
    </div>
  )
}
