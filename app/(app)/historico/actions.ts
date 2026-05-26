"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function registrarHistoricoMensal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const mesAtual = new Date()
  mesAtual.setDate(1)
  const mesStr = mesAtual.toISOString().slice(0, 10)

  // Idempotente — se já existe para esse mês, não sobrescreve
  const { data: existing } = await supabase
    .from("historico_mensal")
    .select("id")
    .eq("user_id", user.id)
    .eq("mes", mesStr)
    .maybeSingle()

  if (existing) return { ok: true, novo: false }

  const [{ data: config }, { data: gastos }, { data: fundos }] = await Promise.all([
    supabase.from("configuracoes").select("salario, renda_extra").eq("user_id", user.id).single(),
    supabase.from("gastos").select("valor").eq("user_id", user.id),
    supabase.from("fundos").select("id, nome, saldo_atual, meta, aporte_mensal").eq("user_id", user.id),
  ])

  const salario = (config?.salario ?? 0) + (config?.renda_extra ?? 0)
  const totalGastos = (gastos ?? []).reduce((s, g) => s + g.valor, 0)

  await supabase.from("historico_mensal").insert({
    user_id: user.id,
    mes: mesStr,
    salario,
    total_gastos: totalGastos,
    snapshot_fundos: fundos ?? [],
  })

  return { ok: true, novo: true }
}
