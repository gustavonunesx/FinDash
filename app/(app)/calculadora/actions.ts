"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Fase } from "@/types"

type ActionResult = { error?: string }

async function getUid() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")
  return { supabase, userId: user.id }
}

function revalidate() {
  revalidatePath("/calculadora")
  revalidatePath("/dashboard")
}

export async function salvarSalario(valor: number): Promise<ActionResult> {
  const { supabase, userId } = await getUid()
  const { error } = await supabase
    .from("configuracoes")
    .update({ salario: valor, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
  if (error) return { error: error.message }
  revalidate()
  return {}
}

export async function salvarRendaExtra(valor: number): Promise<ActionResult> {
  const { supabase, userId } = await getUid()
  const { error } = await supabase
    .from("configuracoes")
    .update({ renda_extra: valor, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
  if (error) return { error: error.message }
  revalidate()
  return {}
}

export async function salvarFase(fase: Fase): Promise<ActionResult> {
  const { supabase, userId } = await getUid()
  const { error } = await supabase
    .from("configuracoes")
    .update({ fase, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
  if (error) return { error: error.message }
  revalidate()
  return {}
}

export async function confirmarAporteRendaExtra(fundoId: string, valor: number): Promise<ActionResult> {
  const { supabase, userId } = await getUid()
  const { data: fundo, error: fetchError } = await supabase
    .from("fundos")
    .select("saldo_atual")
    .eq("id", fundoId)
    .eq("user_id", userId)
    .single()
  if (fetchError || !fundo) return { error: "Fundo não encontrado" }
  const { error } = await supabase
    .from("fundos")
    .update({ saldo_atual: fundo.saldo_atual + valor })
    .eq("id", fundoId)
    .eq("user_id", userId)
  if (error) return { error: error.message }
  revalidatePath("/fundos")
  revalidatePath("/calculadora")
  revalidatePath("/dashboard")
  return {}
}
