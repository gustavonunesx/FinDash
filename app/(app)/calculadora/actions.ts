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
