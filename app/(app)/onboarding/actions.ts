"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function saveOnboardingSalario(salario: number, rendaExtra: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase
    .from("configuracoes")
    .update({ salario, renda_extra: rendaExtra })
    .eq("user_id", user.id)

  return { ok: true }
}

export async function saveOnboardingFundo(nome: string, meta: number, cor: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase.from("fundos").insert({
    user_id: user.id,
    nome,
    meta,
    saldo_atual: 0,
    aporte_mensal: 0,
    cor,
    ordem: 0,
  })

  return { ok: true }
}

export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id)

  redirect("/dashboard")
}
