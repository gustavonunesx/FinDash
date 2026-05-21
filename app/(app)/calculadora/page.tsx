import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CalculadoraSalario } from "@/components/calculadoras/CalculadoraSalario"
import { CalculadoraRendaExtra } from "@/components/calculadoras/CalculadoraRendaExtra"
import type { TotaisPorCategoria } from "@/types"

export default async function CalculadoraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: config }, { data: gastos }, { data: fundos }] = await Promise.all([
    supabase.from("configuracoes").select("*").eq("user_id", user.id).single(),
    supabase.from("gastos").select("valor, categoria").eq("user_id", user.id),
    supabase.from("fundos").select("*").eq("user_id", user.id).order("ordem"),
  ])

  const lista = gastos ?? []
  const totais: TotaisPorCategoria = {
    necessidade: lista.filter((g) => g.categoria === "necessidade").reduce((s, g) => s + g.valor, 0),
    objetivo: lista.filter((g) => g.categoria === "objetivo").reduce((s, g) => s + g.valor, 0),
    qualidade: lista.filter((g) => g.categoria === "qualidade").reduce((s, g) => s + g.valor, 0),
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Calculadoras</h1>
        <p className="text-sm text-muted-foreground">Analise sua distribuição de renda</p>
      </div>

      <CalculadoraSalario
        salarioInicial={config?.salario ?? 0}
        totais={totais}
      />

      <CalculadoraRendaExtra
        rendaExtraInicial={config?.renda_extra ?? 0}
        faseInicial={config?.fase ?? "construindo"}
        fundos={fundos ?? []}
      />
    </div>
  )
}
