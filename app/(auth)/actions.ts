"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { seedDefaultData } from "@/lib/supabase/seed-defaults"

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: traduzirErroAuth(error.message) }
  }

  redirect("/dashboard")
}

export async function signUp(nome: string, email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: traduzirErroAuth(error.message) }
  }

  // If email confirmation is disabled in Supabase, seed data immediately
  if (data.user && data.session) {
    await seedDefaultData(data.user.id)
    redirect("/dashboard")
  }

  return { success: true }
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return { error: "Erro ao iniciar login com Google." }
  }

  redirect(data.url)
}

export async function resetPassword(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/atualizar-senha`,
  })

  if (error) {
    return { error: traduzirErroAuth(error.message) }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

function traduzirErroAuth(message: string): string {
  const erros: Record<string, string> = {
    "Invalid login credentials": "Email ou senha incorretos.",
    "Email not confirmed": "Confirme seu email antes de entrar.",
    "User already registered": "Este email já está cadastrado.",
    "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres.",
    "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
    "For security purposes, you can only request this after": "Aguarde alguns segundos antes de tentar novamente.",
  }

  for (const [key, value] of Object.entries(erros)) {
    if (message.includes(key)) return value
  }

  return "Erro inesperado. Tente novamente."
}
