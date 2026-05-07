import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GastosTable } from "@/components/gastos/GastosTable"
import { CategoryTotals } from "@/components/gastos/CategoryTotals"

export default async function GastosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Gastos mensais</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Seus gastos organizados por categoria
        </p>
      </div>

      <CategoryTotals gastos={lista} />

      <div className="rounded-lg border border-border bg-card p-4">
        <GastosTable gastos={lista} plano={plano as "free" | "premium"} />
      </div>
    </div>
  )
}
