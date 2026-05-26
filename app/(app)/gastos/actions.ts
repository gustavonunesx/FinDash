"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Categoria } from "@/types"

const FREE_LIMIT = 10

type GastoInput = {
  nome: string
  valor: number
  categoria: Categoria
  recorrente?: boolean
  dia_recorrencia?: number | null
}
type ActionResult = { error?: string }

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")
  return { supabase, userId: user.id }
}

export async function adicionarGasto(data: GastoInput): Promise<ActionResult> {
  const { supabase, userId } = await getAuthenticatedClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", userId)
    .single()

  if (profile?.plano === "free") {
    const { count } = await supabase
      .from("gastos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if ((count ?? 0) >= FREE_LIMIT) {
      return { error: "LIMIT_REACHED" }
    }
  }

  const { error } = await supabase.from("gastos").insert({
    user_id: userId,
    nome: data.nome,
    valor: data.valor,
    categoria: data.categoria,
    recorrente: data.recorrente ?? false,
    dia_recorrencia: data.recorrente ? (data.dia_recorrencia ?? null) : null,
  })

  if (error) return { error: error.message }

  revalidatePath("/gastos")
  revalidatePath("/dashboard")
  return {}
}

export async function editarGasto(id: string, data: GastoInput): Promise<ActionResult> {
  const { supabase, userId } = await getAuthenticatedClient()

  const { error } = await supabase
    .from("gastos")
    .update({
      nome: data.nome,
      valor: data.valor,
      categoria: data.categoria,
      recorrente: data.recorrente ?? false,
      dia_recorrencia: data.recorrente ? (data.dia_recorrencia ?? null) : null,
    })
    .eq("id", id)
    .eq("user_id", userId)

  if (error) return { error: error.message }

  revalidatePath("/gastos")
  revalidatePath("/dashboard")
  return {}
}

export async function removerGasto(id: string): Promise<ActionResult> {
  const { supabase, userId } = await getAuthenticatedClient()

  const { error } = await supabase
    .from("gastos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) return { error: error.message }

  revalidatePath("/gastos")
  revalidatePath("/dashboard")
  return {}
}

export async function importarGastos(
  itens: { nome: string; valor: number; categoria: Categoria }[]
): Promise<ActionResult & { importados?: number }> {
  const { supabase, userId } = await getAuthenticatedClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", userId)
    .single()

  let lista = itens
  if (profile?.plano === "free") {
    const { count } = await supabase
      .from("gastos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    const disponiveis = FREE_LIMIT - (count ?? 0)
    if (disponiveis <= 0) return { error: "LIMIT_REACHED" }
    lista = itens.slice(0, disponiveis)
  }

  const rows = lista.map((item) => ({
    user_id: userId,
    nome: item.nome,
    valor: item.valor,
    categoria: item.categoria,
    recorrente: false,
    dia_recorrencia: null,
  }))

  const { error } = await supabase.from("gastos").insert(rows)
  if (error) return { error: error.message }

  revalidatePath("/gastos")
  revalidatePath("/dashboard")
  return { importados: rows.length }
}

export async function confirmarRecorrente(templateId: string): Promise<ActionResult> {
  const { supabase, userId } = await getAuthenticatedClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", userId)
    .single()

  if (profile?.plano === "free") {
    const { count } = await supabase
      .from("gastos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if ((count ?? 0) >= FREE_LIMIT) {
      return { error: "LIMIT_REACHED" }
    }
  }

  const { data: template } = await supabase
    .from("gastos")
    .select("nome, valor, categoria")
    .eq("id", templateId)
    .eq("user_id", userId)
    .single()

  if (!template) return { error: "Template não encontrado" }

  const { error } = await supabase.from("gastos").insert({
    user_id: userId,
    nome: template.nome,
    valor: template.valor,
    categoria: template.categoria,
    recorrente: false,
    dia_recorrencia: null,
  })

  if (error) return { error: error.message }

  revalidatePath("/gastos")
  revalidatePath("/dashboard")
  return {}
}
