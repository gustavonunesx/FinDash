"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Categoria } from "@/types"

const FREE_LIMIT = 10

type GastoInput = { nome: string; valor: number; categoria: Categoria }
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
    .update({ nome: data.nome, valor: data.valor, categoria: data.categoria })
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
