"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Custodia } from "@/types"

const FREE_LIMIT = 3

type FundoInput = {
  nome: string
  saldo_atual: number
  meta: number
  meta_data?: string | null
  aporte_mensal: number
  cor: string
  custodia?: Custodia | null
}

type ActionResult = { error?: string; faseTrocada?: boolean }

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")
  return { supabase, userId: user.id }
}

async function verificarFase(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data: config } = await supabase
    .from("configuracoes")
    .select("fase, custo_vida")
    .eq("user_id", userId)
    .single()

  if (!config || config.fase === "investindo") return false

  const { data: fundos } = await supabase
    .from("fundos")
    .select("saldo_atual")
    .eq("user_id", userId)
    .ilike("nome", "%reserva%")

  if (!fundos?.length) return false

  const reservaCompleta = fundos.some((f) => f.saldo_atual >= config.custo_vida * 3)
  if (!reservaCompleta) return false

  await supabase
    .from("configuracoes")
    .update({ fase: "investindo", updated_at: new Date().toISOString() })
    .eq("user_id", userId)

  revalidatePath("/calculadora")
  return true
}

function revalidate() {
  revalidatePath("/fundos")
  revalidatePath("/dashboard")
}

export async function adicionarFundo(data: FundoInput): Promise<ActionResult> {
  const { supabase, userId } = await getAuthenticatedClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", userId)
    .single()

  if (profile?.plano === "free") {
    const { count } = await supabase
      .from("fundos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if ((count ?? 0) >= FREE_LIMIT) return { error: "LIMIT_REACHED" }
  }

  const { count: maxOrdem } = await supabase
    .from("fundos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  const { error } = await supabase.from("fundos").insert({
    user_id: userId,
    nome: data.nome,
    saldo_atual: data.saldo_atual,
    meta: data.meta,
    meta_data: data.meta_data ?? null,
    aporte_mensal: data.aporte_mensal,
    cor: data.cor,
    ordem: maxOrdem ?? 0,
    custodia: data.custodia ?? null,
  })

  if (error) return { error: error.message }

  revalidate()
  const faseTrocada = await verificarFase(supabase, userId)
  return { faseTrocada }
}

export async function editarFundo(id: string, data: FundoInput): Promise<ActionResult> {
  const { supabase, userId } = await getAuthenticatedClient()

  const { error } = await supabase
    .from("fundos")
    .update({
      nome: data.nome,
      saldo_atual: data.saldo_atual,
      meta: data.meta,
      meta_data: data.meta_data ?? null,
      aporte_mensal: data.aporte_mensal,
      cor: data.cor,
      custodia: data.custodia ?? null,
    })
    .eq("id", id)
    .eq("user_id", userId)

  if (error) return { error: error.message }

  revalidate()
  const faseTrocada = await verificarFase(supabase, userId)
  return { faseTrocada }
}

export async function removerFundo(id: string): Promise<ActionResult> {
  const { supabase, userId } = await getAuthenticatedClient()

  const { error } = await supabase
    .from("fundos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) return { error: error.message }

  revalidate()
  return {}
}
