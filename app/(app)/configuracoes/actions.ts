"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function salvarNome(nome: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase
    .from("profiles")
    .update({ nome: nome.trim() })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/configuracoes")
  revalidatePath("/dashboard")
  return {}
}

export async function salvarCustoVida(valor: number): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase
    .from("configuracoes")
    .update({ custo_vida: valor, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/configuracoes")
  return {}
}

export async function salvarMetaEconomia(valor: number): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase
    .from("configuracoes")
    .update({ meta_economia_mensal: valor, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/configuracoes")
  revalidatePath("/dashboard")
  return {}
}
